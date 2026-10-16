const { z } = require('zod');
const supabase = require('../config/supabase');

const recentMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(5),
  page: z.coerce.number().int().min(1).default(1),
  status: z.enum(['all', 'finished', 'active']).default('all'),
});

/**
 * Controller for user-related endpoints.
 */
const getProfile = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User authentication required'
    });
  }

  try {
    // 1. Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, email, wallet_address, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('[UserController] Error fetching profile:', profileError);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve user profile'
      });
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // 2. Fetch wallet balances (off-chain in-game ledger)
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance, locked_balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (walletError) {
      console.warn('[UserController] Warning fetching wallet:', walletError.message);
    }

    const balanceGvt = wallet?.balance != null ? Number(wallet.balance) : 1000.0;
    const lockedBalanceGvt = wallet?.locked_balance != null ? Number(wallet.locked_balance) : 0.0;

    // 3. Derive match stats for completed/forfeited matches
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('id, player1_id, player2_id, winner_id, status, created_at')
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .in('status', ['finished', 'forfeited'])
      .order('created_at', { ascending: false });

    if (matchesError) {
      console.warn('[UserController] Warning fetching matches:', matchesError.message);
    }

    const completedMatches = matches || [];
    const totalMatches = completedMatches.length;
    const wins = completedMatches.filter((m) => m.winner_id === userId).length;
    const losses = completedMatches.filter((m) => m.winner_id && m.winner_id !== userId).length;
    const draws = completedMatches.filter((m) => !m.winner_id).length;
    const winRate = totalMatches > 0 ? Number(((wins / totalMatches) * 100).toFixed(1)) : 0.0;

    // Calculate current streak (most recent matches first)
    let currentStreak = 0;
    for (const match of completedMatches) {
      if (match.winner_id === userId) {
        currentStreak += 1;
      } else {
        break;
      }
    }

    // Calculate best streak across chronological history
    let bestStreak = 0;
    let runningStreak = 0;
    const chronological = [...completedMatches].reverse();
    for (const match of chronological) {
      if (match.winner_id === userId) {
        runningStreak += 1;
        if (runningStreak > bestStreak) {
          bestStreak = runningStreak;
        }
      } else {
        runningStreak = 0;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        id: profile.id,
        username: profile.username || null,
        fullName: profile.full_name || null,
        email: profile.email || req.user.email || null,
        avatarUrl: profile.avatar_url || null,
        walletAddress: profile.wallet_address || null,
        balanceGvt,
        lockedBalanceGvt,
        stats: {
          totalMatches,
          wins,
          losses,
          draws,
          winRate,
          currentStreak,
          bestStreak
        }
      }
    });
  } catch (error) {
    console.error('[UserController] Unexpected getProfile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching profile'
    });
  }
};

const GVT_USD_RATE = 0.1;

/**
 * GET /api/user/inventory
 * Authenticated endpoint to retrieve player's owned items and skins.
 */
const getUserInventory = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: User authentication required',
    });
  }

  try {
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('user_inventory')
      .select(`
        id,
        item_id,
        quantity,
        acquired_at,
        marketplace_items (
          id,
          name,
          badge,
          category,
          collection,
          price_gvt,
          image_url,
          asset_metadata
        )
      `)
      .eq('user_id', userId)
      .order('acquired_at', { ascending: false });

    if (inventoryError) {
      console.error('[UserController] Error fetching user inventory:', inventoryError);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve user inventory',
      });
    }

    const items = (inventoryData || []).map((inv) => {
      const item = inv.marketplace_items || {};
      const priceGvt = Number(item.price_gvt) || 0;
      return {
        inventoryId: inv.id,
        itemId: inv.item_id,
        quantity: inv.quantity || 1,
        acquiredAt: inv.acquired_at,
        name: item.name || 'Unknown Item',
        badge: item.badge || 'COMMON',
        category: item.category || 'skins',
        collection: item.collection || 'Genesis',
        priceGvt,
        priceUsd: Number((priceGvt * GVT_USD_RATE).toFixed(2)),
        imageUrl: item.image_url || null,
        assetMetadata: item.asset_metadata || {},
      };
    });

    return res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('[UserController] Unexpected getUserInventory error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching user inventory',
    });
  }
};

/**
 * GET /api/user/matches/recent
 * Retrieve authenticated user's recent matches with opponent profiles, scores, and payouts.
 */
const getRecentMatches = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: User authentication required',
    });
  }

  const parsed = recentMatchesQuerySchema.safeParse(req.query || {});
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }

  const { limit, page, status } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let query = supabase
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
        created_at,
        last_move_timestamp,
        authority_resolved_at,
        authority_resolution_reason,
        terminal_reason
      `, { count: 'exact' })
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`);

    if (status === 'finished') {
      query = query.in('status', ['finished', 'forfeited']);
    } else if (status === 'active') {
      query = query.in('status', ['active', 'waiting', 'reconnecting']);
    }

    query = query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, to);

    const { data: matches, error: matchesError, count } = await query;

    if (matchesError) {
      console.error('[UserController] Error fetching recent matches:', matchesError);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve recent matches',
      });
    }

    const rawMatches = matches || [];
    const total = count != null ? count : rawMatches.length;

    if (rawMatches.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      });
    }

    // Collect opponent IDs
    const opponentIds = [...new Set(
      rawMatches
        .map((m) => (m.player1_id === userId ? m.player2_id : m.player1_id))
        .filter(Boolean)
    )];

    // Fetch opponent profiles in batch
    const opponentMap = new Map();
    if (opponentIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', opponentIds);

      if (profilesError) {
        console.warn('[UserController] Warning fetching opponent profiles for recent matches:', profilesError.message);
      } else if (profiles) {
        for (const p of profiles) {
          opponentMap.set(p.id, p);
        }
      }
    }

    // Collect finished match IDs to fetch payouts
    const finishedMatchIds = rawMatches
      .filter((m) => m.status === 'finished' || m.status === 'forfeited')
      .map((m) => m.id);

    const payoutMap = new Map();
    if (finishedMatchIds.length > 0) {
      const { data: payouts, error: payoutsError } = await supabase
        .from('match_payouts')
        .select('match_id, winner_id, stake_amount, total_pot, fee_amount, payout_amount')
        .in('match_id', finishedMatchIds);

      if (payoutsError) {
        console.warn('[UserController] Warning fetching payouts for recent matches:', payoutsError.message);
      } else if (payouts) {
        for (const py of payouts) {
          payoutMap.set(py.match_id, py);
        }
      }
    }

    // Format matches with derived outcome, rewards, and opponent details
    const formatted = rawMatches.map((match) => {
      const isPlayer1 = match.player1_id === userId;
      const opponentId = isPlayer1 ? match.player2_id : match.player1_id;
      const opponentProfile = opponentId ? opponentMap.get(opponentId) : null;

      const isFinished = match.status === 'finished' || match.status === 'forfeited';
      const isWinner = isFinished && match.winner_id === userId;
      const isDraw = isFinished && match.winner_id === null;

      const userScore = isPlayer1 ? (match.player1_score ?? 0) : (match.player2_score ?? 0);
      const opponentScore = isPlayer1 ? (match.player2_score ?? 0) : (match.player1_score ?? 0);
      const stakeAmount = Number(match.stake_amount) || 0;

      let rewards = null;
      if (isFinished) {
        const payout = payoutMap.get(match.id);
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
              netEarnings: winnings,
              currency: 'GVT',
              settled: true,
            };
          } else if (stakeAmount > 0) {
            rewards = {
              stakeReturned: 0.0,
              winnings: 0.0,
              fee: 0.0,
              netEarnings: 0.0,
              currency: 'GVT',
              settled: false,
            };
          } else {
            rewards = {
              stakeReturned: 0.0,
              winnings: 0.0,
              fee: 0.0,
              netEarnings: 0.0,
              currency: 'GVT',
              settled: true,
            };
          }
        } else if (isDraw) {
          rewards = {
            stakeReturned: stakeAmount,
            winnings: 0.0,
            fee: 0.0,
            netEarnings: 0.0,
            currency: 'GVT',
            settled: true,
          };
        } else {
          rewards = {
            stakeReturned: 0.0,
            winnings: 0.0,
            fee: 0.0,
            netEarnings: -stakeAmount,
            currency: 'GVT',
            settled: true,
          };
        }
      }

      const resolvedReason = isFinished
        ? (match.authority_resolution_reason || match.terminal_reason || (isDraw ? 'draw' : 'standard_completion'))
        : null;

      const resolvedAt = isFinished
        ? (match.authority_resolved_at || match.last_move_timestamp || match.created_at)
        : null;

      return {
        matchId: match.id,
        gameType: match.game_type,
        status: match.status,
        winnerId: match.winner_id,
        isWinner,
        isDraw,
        stakeAmount,
        rewards,
        opponent: {
          id: opponentId || null,
          username: opponentProfile?.username || null,
          fullName: opponentProfile?.full_name || null,
          avatarUrl: opponentProfile?.avatar_url || null,
        },
        scores: {
          userScore,
          opponentScore,
        },
        resolvedReason,
        resolvedAt,
        createdAt: match.created_at,
      };
    });

    return res.status(200).json({
      success: true,
      data: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('[UserController] Unexpected getRecentMatches error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching recent matches',
    });
  }
};

module.exports = {
  getProfile,
  getUserInventory,
  getRecentMatches,
};


