const supabase = require('../config/supabase');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Controller for match operations.
 */
const getMatchSummary = async (req, res) => {
  const userId = req.user?.id;
  const { matchId } = req.params;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User authentication required'
    });
  }

  if (!matchId || !UUID_REGEX.test(matchId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid match ID format'
    });
  }

  try {
    // 1. Fetch match record
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        id,
        player1_id,
        player2_id,
        game_type,
        stake_amount,
        player1_score,
        player2_score,
        status,
        winner_id,
        authority_resolution_reason,
        authority_resolved_at,
        last_move_timestamp,
        game_move_number,
        terminal_move_number,
        terminal_reason,
        created_at
      `)
      .eq('id', matchId)
      .maybeSingle();

    if (matchError) {
      console.error('[MatchController] Error fetching match:', matchError);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve match'
      });
    }

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // 2. Authorize caller: must be player1 or player2
    const isPlayer1 = match.player1_id === userId;
    const isPlayer2 = match.player2_id === userId;

    if (!isPlayer1 && !isPlayer2) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not a participant in this match'
      });
    }

    const opponentId = isPlayer1 ? match.player2_id : match.player1_id;

    // 3. Fetch opponent profile
    let opponentProfile = null;
    if (opponentId) {
      const { data: oppProfile, error: oppError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', opponentId)
        .maybeSingle();

      if (oppError) {
        console.warn('[MatchController] Warning fetching opponent profile:', oppError.message);
      }
      opponentProfile = oppProfile;
    }

    // 4. Derive match state and scores
    const isFinished = match.status === 'finished' || match.status === 'forfeited';
    const isWinner = isFinished && match.winner_id === userId;
    const isDraw = isFinished && match.winner_id === null;

    const userScore = isPlayer1 ? (match.player1_score ?? 0) : (match.player2_score ?? 0);
    const opponentScore = isPlayer1 ? (match.player2_score ?? 0) : (match.player1_score ?? 0);

    // 5. Fetch or compute rewards
    let rewards = null;

    if (isFinished) {
      const stakeAmount = Number(match.stake_amount) || 0;

      // Query match_payouts if available
      const { data: payout, error: payoutError } = await supabase
        .from('match_payouts')
        .select('winner_id, stake_amount, total_pot, fee_amount, payout_amount')
        .eq('match_id', matchId)
        .maybeSingle();

      if (payoutError) {
        console.warn('[MatchController] Warning fetching match payout:', payoutError.message);
      }

      if (isWinner) {
        if (payout) {
          const stakeReturned = Number(payout.stake_amount);
          const totalPayout = Number(payout.payout_amount);
          const fee = Number(payout.fee_amount);
          const winnings = Number((totalPayout - stakeReturned).toFixed(2));

          rewards = {
            stakeReturned,
            winnings,
            fee,
            currency: 'GVT'
          };
        } else {
          // Standard platform formula: totalPot = stake * 2, fee = 10%, winnings = 80% of stake
          const totalPot = stakeAmount * 2;
          const fee = Number((totalPot * 0.10).toFixed(2));
          const totalPayout = Number((totalPot - fee).toFixed(2));
          const winnings = Number((totalPayout - stakeAmount).toFixed(2));

          rewards = {
            stakeReturned: stakeAmount,
            winnings,
            fee,
            currency: 'GVT'
          };
        }
      } else if (isDraw) {
        // Draw returns entry stake to both players without winnings or fees
        rewards = {
          stakeReturned: stakeAmount,
          winnings: 0.0,
          fee: 0.0,
          currency: 'GVT'
        };
      } else {
        // Loser gets zero return and zero winnings
        rewards = {
          stakeReturned: 0.0,
          winnings: 0.0,
          fee: 0.0,
          currency: 'GVT'
        };
      }
    }

    // 6. Compute total moves
    let totalMoves = match.terminal_move_number || match.game_move_number || 0;

    if (totalMoves === 0) {
      const { count, error: countError } = await supabase
        .from('match_events')
        .select('id', { count: 'exact', head: true })
        .eq('match_id', matchId)
        .eq('event_type', 'move');

      if (!countError && typeof count === 'number') {
        totalMoves = count;
      }
    }

    // 7. Resolve resolution reason and timestamp
    const resolvedReason = isFinished
      ? (match.authority_resolution_reason || match.terminal_reason || (isDraw ? 'draw' : 'standard_completion'))
      : null;

    const resolvedAt = isFinished
      ? (match.authority_resolved_at || match.last_move_timestamp || match.created_at)
      : null;

    return res.status(200).json({
      success: true,
      data: {
        matchId: match.id,
        gameType: match.game_type,
        status: match.status,
        winnerId: match.winner_id,
        isWinner,
        isDraw,
        stakeAmount: Number(match.stake_amount) || 0,
        rewards,
        opponent: {
          id: opponentId,
          username: opponentProfile?.username || null,
          fullName: opponentProfile?.full_name || null,
          avatarUrl: opponentProfile?.avatar_url || null
        },
        scores: {
          userScore,
          opponentScore
        },
        stats: {
          totalMoves,
          resolvedReason
        },
        resolvedAt,
        createdAt: match.created_at
      }
    });
  } catch (error) {
    console.error('[MatchController] Unexpected getMatchSummary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching match summary'
    });
  }
};

module.exports = {
  getMatchSummary
};
