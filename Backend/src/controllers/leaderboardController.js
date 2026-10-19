const { z } = require('zod');
const supabase = require('../config/supabase');

// Query validation schema with safe defaults, flexible casing, and whitespace normalization
const leaderboardQuerySchema = z.object({
  game: z
    .string()
    .transform((v) => {
      const lower = v.trim().toLowerCase();
      if (lower === 'all games' || lower === 'all' || lower === 'all-games') return 'all';
      return lower;
    })
    .pipe(z.enum(['all', 'chess', 'checkers', 'snake']))
    .default('all'),
  timeframe: z
    .string()
    .transform((v) => {
      const lower = v.trim().toLowerCase().replace(/\s+/g, '-');
      if (lower === 'all' || lower === 'all-time') return 'all-time';
      return lower;
    })
    .pipe(z.enum(['all-time', 'monthly', 'weekly', 'daily']))
    .default('all-time'),
  sortBy: z
    .string()
    .transform((v) => v.trim().toLowerCase())
    .pipe(z.enum(['wins', 'earnings']))
    .default('wins'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  page: z.coerce.number().int().min(1).default(1),
});

/**
 * Controller for Player Leaderboard.
 */
const getPlayerLeaderboard = async (req, res) => {
  // 1. Validate query parameters
  const parsed = leaderboardQuerySchema.safeParse(req.query || {});
  if (!parsed.success) {
    const errorList = parsed.error.issues || parsed.error.errors || [];
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorList.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
  }

  const { game, timeframe, sortBy, limit, page } = parsed.data;

  // 2. Compute date threshold for timeframe filtering
  let cutoff = null;
  const now = Date.now();
  if (timeframe === 'daily') {
    cutoff = new Date(now - 24 * 60 * 60 * 1000);
  } else if (timeframe === 'weekly') {
    cutoff = new Date(now - 7 * 24 * 60 * 60 * 1000);
  } else if (timeframe === 'monthly') {
    cutoff = new Date(now - 30 * 24 * 60 * 60 * 1000);
  }

  try {
    // 3. Batched chunked retrieval of authoritative terminal matches
    const BATCH_SIZE = 1000;
    const MAX_SCAN_CEILING = 50000;
    let scanOffset = 0;
    let hasMore = true;
    let totalScanned = 0;

    const playerMap = new Map();
    const streakActive = new Map();

    const getPlayerRecord = (id) => {
      if (!playerMap.has(id)) {
        playerMap.set(id, {
          userId: id,
          wins: 0,
          losses: 0,
          draws: 0,
          earnedGvt: 0,
          streak: 0,
          lastWinAt: null,
        });
      }
      return playerMap.get(id);
    };

    while (hasMore && totalScanned < MAX_SCAN_CEILING) {
      let query = supabase
        .from('matches')
        .select('id, player1_id, player2_id, winner_id, stake_amount, game_type, created_at')
        .in('status', ['finished', 'forfeited']);

      if (cutoff) {
        query = query.gte('created_at', cutoff.toISOString());
      }

      if (game !== 'all') {
        query = query.ilike('game_type', game);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(scanOffset, scanOffset + BATCH_SIZE - 1);

      const { data: batch, error: matchError } = await query;

      if (matchError) {
        console.error('[LeaderboardController] Error fetching matches batch:', matchError);
        return res.status(500).json({
          success: false,
          message: 'Failed to retrieve leaderboard data',
        });
      }

      if (!batch || batch.length === 0) {
        break;
      }

      totalScanned += batch.length;

      for (const match of batch) {
        const winnerId = match.winner_id;
        const p1 = match.player1_id;
        const p2 = match.player2_id;
        const stake = Number(match.stake_amount) || 0;
        // Authoritative platform settlement: net winnings = 0.8 * stake
        const netWinnings = Number((stake * 0.8).toFixed(2));

        if (winnerId) {
          const loserId = p1 === winnerId ? p2 : (p2 === winnerId ? p1 : null);

          // Aggregate Winner
          const winnerStats = getPlayerRecord(winnerId);
          winnerStats.wins += 1;
          winnerStats.earnedGvt = Number((winnerStats.earnedGvt + netWinnings).toFixed(2));
          if (!winnerStats.lastWinAt) {
            winnerStats.lastWinAt = match.created_at;
          }

          if (!streakActive.has(winnerId)) {
            streakActive.set(winnerId, true);
          }
          if (streakActive.get(winnerId)) {
            winnerStats.streak += 1;
          }

          // Aggregate Loser
          if (loserId) {
            const loserStats = getPlayerRecord(loserId);
            loserStats.losses += 1;
            streakActive.set(loserId, false);
          }
        } else {
          // Draw outcome (winner_id IS NULL)
          if (p1) {
            const p1Stats = getPlayerRecord(p1);
            p1Stats.draws += 1;
            streakActive.set(p1, false);
          }
          if (p2) {
            const p2Stats = getPlayerRecord(p2);
            p2Stats.draws += 1;
            streakActive.set(p2, false);
          }
        }
      }

      if (batch.length < BATCH_SIZE) {
        hasMore = false;
      } else {
        scanOffset += BATCH_SIZE;
      }
    }

    // 4. Filter for ranked players (at least 1 win)
    const rankedPlayers = Array.from(playerMap.values()).filter((p) => p.wins > 0);

    // 5. Sort and apply deterministic tie-breaking rules
    rankedPlayers.sort((a, b) => {
      if (sortBy === 'earnings') {
        if (b.earnedGvt !== a.earnedGvt) return b.earnedGvt - a.earnedGvt;
        if (b.wins !== a.wins) return b.wins - a.wins;
      } else {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.earnedGvt !== a.earnedGvt) return b.earnedGvt - a.earnedGvt;
      }
      // Tertiary tie-break: most recent win timestamp
      const timeA = a.lastWinAt ? new Date(a.lastWinAt).getTime() : 0;
      const timeB = b.lastWinAt ? new Date(b.lastWinAt).getTime() : 0;
      return timeB - timeA;
    });

    const total = rankedPlayers.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const pagedPlayers = rankedPlayers.slice(offset, offset + limit);

    // 6. Fetch public profile information for the paginated window
    const userIds = pagedPlayers.map((p) => p.userId);
    const profileMap = new Map();

    if (userIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);

      if (profileError) {
        console.warn('[LeaderboardController] Warning fetching profiles:', profileError.message);
      } else if (profiles) {
        for (const prof of profiles) {
          profileMap.set(prof.id, prof);
        }
      }
    }

    // 7. Assemble response entries without private PII, supporting both earned and earnedGvt
    const rankedData = pagedPlayers.map((p, index) => {
      const prof = profileMap.get(p.userId);
      const totalMatches = p.wins + p.losses + p.draws;
      const winRate =
        totalMatches > 0 ? Number(((p.wins / totalMatches) * 100).toFixed(1)) : 0.0;

      return {
        rank: offset + index + 1,
        userId: p.userId,
        username: prof?.username || prof?.full_name || 'Anonymous',
        fullName: prof?.full_name || null,
        avatarUrl: prof?.avatar_url || null,
        wins: p.wins,
        losses: p.losses,
        draws: p.draws,
        totalMatches,
        winRate,
        earned: p.earnedGvt,
        earnedGvt: p.earnedGvt,
        streak: p.streak,
      };
    });

    return res.status(200).json({
      success: true,
      data: rankedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      filters: {
        game,
        timeframe,
        sortBy,
      },
    });
  } catch (error) {
    console.error('[LeaderboardController] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching leaderboard',
    });
  }
};

/**
 * GET /api/leaderboard/guilds
 * Global competitive rankings for guilds.
 */
const getGuildLeaderboard = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const timeframe = req.query.timeframe || 'all-time';
    const offset = (page - 1) * limit;

    const { data: guilds, count, error: guildErr } = await supabase
      .from('guilds')
      .select('*', { count: 'exact' })
      .order('total_wins', { ascending: false })
      .order('win_rate', { ascending: false })
      .range(offset, offset + limit - 1);

    if (guildErr) {
      console.error('[LeaderboardController] Error querying guilds:', guildErr);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve guild leaderboard',
      });
    }

    const guildList = guilds || [];
    const total = count != null ? count : guildList.length;
    const totalPages = Math.ceil(total / limit) || 1;

    // Fetch member counts from guild_members
    const memberCounts = new Map();
    if (guildList.length > 0) {
      const { data: memberRows } = await supabase
        .from('guild_members')
        .select('guild_id');

      if (memberRows) {
        for (const row of memberRows) {
          memberCounts.set(row.guild_id, (memberCounts.get(row.guild_id) || 0) + 1);
        }
      }
    }

    // Check user membership if caller is authenticated
    let userGuildId = null;
    if (req.user?.id) {
      const { data: userMembership } = await supabase
        .from('guild_members')
        .select('guild_id')
        .eq('user_id', req.user.id)
        .maybeSingle();

      if (userMembership) {
        userGuildId = userMembership.guild_id;
      }
    }

    const rankedGuilds = guildList.map((g, index) => {
      const count = memberCounts.get(g.id) || 1;
      return {
        rank: offset + index + 1,
        guildId: g.id,
        name: g.name,
        shortName: g.short_name || g.name.slice(0, 3).toUpperCase(),
        iconUrl: g.icon_url || '/guilds/cyberSerpentImage.png',
        tags: Array.isArray(g.tags) ? g.tags : [],
        winRate: Number(Number(g.win_rate || 0).toFixed(1)),
        members: count,
        maxMembers: Number(g.max_members) || 30,
        totalWins: Number(g.total_wins) || 0,
        totalEarned: Number(g.total_earned) || 0,
        totalStaked: Number(g.total_staked) || 0,
        currency: g.currency || 'GVT',
        isUserGuild: userGuildId === g.id,
      };
    });

    return res.status(200).json({
      success: true,
      data: rankedGuilds,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      filters: {
        timeframe,
      },
    });
  } catch (error) {
    console.error('[LeaderboardController] Unexpected error in getGuildLeaderboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching guild leaderboard',
    });
  }
};

module.exports = {
  getPlayerLeaderboard,
  getGuildLeaderboard,
};
