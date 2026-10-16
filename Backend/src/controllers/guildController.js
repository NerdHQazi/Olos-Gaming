const { z } = require('zod');
const supabase = require('../config/supabase');

const GVT_USD_RATE = 0.1;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const listGuildsQuerySchema = z.object({
  search: z.string().trim().optional(),
  tag: z.string().trim().optional(),
  sort: z.enum(['rank', 'wins', 'members', 'newest']).default('rank'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  page: z.coerce.number().int().min(1).default(1),
});

const createGuildBodySchema = z.object({
  name: z.string().trim().min(3, 'Guild name must be at least 3 characters').max(50, 'Guild name must not exceed 50 characters'),
  tag: z.string().trim().min(2, 'Guild tag must be between 2 and 5 characters').max(5, 'Guild tag must be between 2 and 5 characters').optional(),
  shortName: z.string().trim().min(2, 'Guild tag must be between 2 and 5 characters').max(5, 'Guild tag must be between 2 and 5 characters').optional(),
  description: z.string().trim().max(1000).optional(),
  tagline: z.string().trim().max(255).optional(),
  iconUrl: z.string().trim().optional(),
  emblemUrl: z.string().trim().optional(),
  isPrivate: z.boolean().default(true),
  maxMembers: z.coerce.number().int().min(5, 'Max members must be at least 5').max(50, 'Max members cannot exceed 50').default(30),
  minRank: z.string().trim().default('Silver Bracket (Tier II)'),
  entryFee: z.coerce.number().min(0, 'Entry fee cannot be negative').default(100),
  tags: z.array(z.string().trim()).default([]),
});

const applyGuildBodySchema = z.object({
  motivation: z.string().trim().min(1, 'Motivation is required').max(2000, 'Motivation must not exceed 2000 characters'),
  guildHistory: z.string().trim().max(1000).optional(),
});

function formatGuild(g, index, memberCount, isUserGuild = false) {
  const totalStaked = Number(g.total_staked) || 0;
  const stakedUsd = g.staked_usd_estimate != null
    ? Number(g.staked_usd_estimate)
    : Number((totalStaked * GVT_USD_RATE).toFixed(2));

  return {
    id: g.id,
    name: g.name,
    shortName: g.short_name || g.name.slice(0, 3).toUpperCase(),
    iconUrl: g.icon_url || '/guilds/cyberSerpentImage.png',
    globalRank: index + 1,
    members: memberCount,
    maxMembers: Number(g.max_members) || 30,
    winRate: Number(Number(g.win_rate || 0).toFixed(1)),
    tags: Array.isArray(g.tags) ? g.tags : [],
    isFeatured: Boolean(g.is_featured),
    tier: g.tier || 'Tier 1 Elite',
    description: g.description || '',
    totalStaked,
    currency: g.currency || 'GVT',
    tagline: g.tagline || '',
    winRateMinPercent: Number(g.win_rate_min_percent) || 0,
    stakingDuesPerMonth: Number(g.staking_dues_per_month) || 0,
    totalWins: Number(g.total_wins) || 0,
    totalMatches: Number(g.total_matches) || 0,
    totalEarned: Number(g.total_earned) || 0,
    isUserGuild: Boolean(isUserGuild),
    winRatePercentileLabel: g.win_rate_percentile_label || 'Top 5% worldwide',
    stakedUsdEstimate: stakedUsd,
    tierBracket: g.tier_bracket || 'Elite I',
    tierNote: g.tier_note || '',
    recruitmentRulesSummary: g.recruitment_rules_summary || '',
    stakingTaxPercent: Number(g.staking_tax_percent) || 10,
    draftAnnouncement: g.draft_announcement || '',
    createdAt: g.created_at,
  };
}

/**
 * GET /api/guilds
 * List guilds with search, tag filtering, sorting, pagination, and featured banner.
 */
const listGuilds = async (req, res) => {
  const parsed = listGuildsQuerySchema.safeParse(req.query || {});
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

  const { search, tag, sort, limit, page } = parsed.data;
  const offset = (page - 1) * limit;

  try {
    let query = supabase.from('guilds').select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,short_name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    if (sort === 'wins') {
      query = query.order('total_wins', { ascending: false });
    } else if (sort === 'members') {
      query = query.order('max_members', { ascending: false });
    } else if (sort === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('is_featured', { ascending: false }).order('total_wins', { ascending: false });
    }

    const { data: rawGuilds, count, error: fetchError } = await query.range(offset, offset + limit - 1);

    if (fetchError) {
      console.error('[GuildController] Error querying guilds:', fetchError);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve guilds',
      });
    }

    const total = count != null ? count : (rawGuilds?.length || 0);
    const totalPages = Math.ceil(total / limit) || 1;
    const guildList = rawGuilds || [];

    // Fetch actual member counts from public.guild_members
    const guildIds = guildList.map((g) => g.id);
    const memberCounts = new Map();
    if (guildIds.length > 0) {
      const { data: memberRows, error: memberErr } = await supabase
        .from('guild_members')
        .select('guild_id');

      if (!memberErr && memberRows) {
        for (const row of memberRows) {
          memberCounts.set(row.guild_id, (memberCounts.get(row.guild_id) || 0) + 1);
        }
      }
    }

    // Check caller's user guild if authenticated
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

    const formattedGuilds = guildList.map((g, index) => {
      const count = memberCounts.get(g.id) || 1;
      const isUserGuild = userGuildId === g.id;
      return formatGuild(g, offset + index, count, isUserGuild);
    });

    const featuredGuild = formattedGuilds.find((g) => g.isFeatured) || (formattedGuilds.length > 0 ? formattedGuilds[0] : null);

    return res.status(200).json({
      success: true,
      data: formattedGuilds,
      featured: featuredGuild,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      filters: {
        search: search || null,
        tag: tag || null,
        sort,
      },
    });
  } catch (err) {
    console.error('[GuildController] Unexpected error in listGuilds:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching guilds',
    });
  }
};

/**
 * POST /api/guilds
 * Create a new guild with 5 GVT contract creation fee and register creator as Leader.
 */
const createGuild = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: User authentication required',
    });
  }

  const parsed = createGuildBodySchema.safeParse(req.body || {});
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

  const {
    name,
    tag,
    shortName,
    description,
    tagline,
    iconUrl,
    emblemUrl,
    isPrivate,
    maxMembers,
    minRank,
    entryFee,
    tags,
  } = parsed.data;

  const resolvedTag = (tag || shortName || '').toUpperCase();
  if (resolvedTag.length < 2 || resolvedTag.length > 5) {
    return res.status(400).json({
      success: false,
      message: 'Guild tag must be between 2 and 5 characters',
    });
  }

  const resolvedIcon = iconUrl || emblemUrl || '/guilds/cyberSerpentImage.png';

  try {
    // 1. Try atomic PostgreSQL RPC create_guild_with_leader
    const { data: rpcResult, error: rpcError } = await supabase.rpc('create_guild_with_leader', {
      p_user_id: userId,
      p_name: name,
      p_short_name: resolvedTag,
      p_description: description || null,
      p_tagline: tagline || null,
      p_icon_url: resolvedIcon,
      p_is_private: isPrivate,
      p_max_members: maxMembers,
      p_min_rank: minRank,
      p_entry_fee: entryFee,
      p_tags: tags,
    });

    if (rpcError) {
      const errMsg = rpcError.message || '';
      if (errMsg.includes('Insufficient GVT balance')) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient GVT balance for guild contract creation (5 GVT required)',
        });
      }
      if (errMsg.includes('A guild with this name already exists')) {
        return res.status(409).json({
          success: false,
          message: 'A guild with this name already exists',
        });
      }
      if (errMsg.includes('A guild with this tag already exists')) {
        return res.status(409).json({
          success: false,
          message: 'A guild with this tag already exists',
        });
      }

      if (errMsg.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          message: errMsg,
        });
      }

      console.error('[GuildController] RPC error in createGuild:', rpcError);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while creating guild',
      });
    }

    if (!rpcResult || !rpcResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Guild creation transaction failed to return valid confirmation',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Guild created successfully',
      data: rpcResult,
    });
  } catch (err) {
    console.error('[GuildController] Unexpected error in createGuild:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating guild',
    });
  }
};

/**
 * GET /api/guilds/:id
 * Retrieve full guild details, member roster, stats, and deferred battle/treasury metadata.
 */
const getGuildById = async (req, res) => {
  const { id } = req.params;

  if (!id || !UUID_REGEX.test(id)) {
    return res.status(404).json({
      success: false,
      message: 'Guild not found',
    });
  }

  try {
    const { data: guild, error: guildErr } = await supabase
      .from('guilds')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (guildErr) {
      console.error('[GuildController] Error fetching guild:', guildErr);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve guild',
      });
    }

    if (!guild) {
      return res.status(404).json({
        success: false,
        message: 'Guild not found',
      });
    }

    // Fetch roster from guild_members
    const { data: memberRows, error: memberErr } = await supabase
      .from('guild_members')
      .select('id, user_id, role, joined_at')
      .eq('guild_id', id);

    let members = [];
    if (!memberErr && memberRows && memberRows.length > 0) {
      const userIds = memberRows.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map();
      if (profiles) {
        for (const p of profiles) {
          profileMap.set(p.id, p);
        }
      }

      members = memberRows.map((m) => {
        const prof = profileMap.get(m.user_id);
        return {
          id: m.id,
          userId: m.user_id,
          username: prof?.username || prof?.full_name || 'Anonymous Guildmate',
          avatarUrl: prof?.avatar_url || '/Avatar.png',
          role: m.role || 'Member',
          winRate: Number(guild.win_rate) || 70.0,
          isOnline: true,
          joinedAt: m.joined_at,
        };
      });
    }

    // Structured deferred placeholders matching GuildProfilePageProps
    const chatPreview = [
      { id: 'chat-1', guildId: guild.id, username: 'GuildLeader', message: 'Welcome to the arena! Coordinate our weekly bracket matches.' },
      { id: 'chat-2', guildId: guild.id, username: 'StrikeOfficer', message: 'Stake pools updated for upcoming guild matches.' },
    ];

    const upcomingBattles = [
      { id: 'battle-1', guildId: guild.id, opponentName: 'Alpha Blitzers', stakeAmount: 1500, currency: 'GVT', scheduleLabel: 'Tonight, 8:30 PM UTC' },
    ];

    const activeWar = {
      id: 'war-1',
      guildId: guild.id,
      opponentName: 'Meta Cobras',
      opponentIconUrl: '/guilds/metaCobraImage.png',
      ourScore: 12,
      opponentScore: 8,
      stakeAmount: 5000,
      currency: 'GVT',
      timeRemainingLabel: 'Bracket match underway · Realtime sync deferred',
    };

    const guildWarBattles = [
      { id: 'gwb-1', guildId: guild.id, opponentName: 'Cyber Serpents II', opponentIconUrl: '/guilds/cyberSerpent2Image.png', scheduleLabel: 'Tomorrow, 9:00 PM UTC', gameType: 'Chess Arena', stakeAmount: 2000, currency: 'GVT' },
    ];

    const battleHistory = [
      { id: 'hist-1', guildId: guild.id, opponentName: 'EthWarriors', arena: 'Snake Pit', result: 'Victory', amount: 1200, currency: 'GVT' },
      { id: 'hist-2', guildId: guild.id, opponentName: 'Alpha Blitzers', arena: 'Checkers Blitz', result: 'Defeat', amount: -800, currency: 'GVT' },
    ];

    const incomeBreakdown = [
      { id: 'inc-1', guildId: guild.id, label: 'Match Winnings', percent: 65, amount: 29700, currency: 'GVT' },
      { id: 'inc-2', guildId: guild.id, label: 'Member Dues', percent: 20, amount: 9100, currency: 'GVT' },
      { id: 'inc-3', guildId: guild.id, label: 'Tournament Prizes', percent: 15, amount: 6800, currency: 'GVT' },
    ];

    const treasuryTransactions = [
      { id: 'txn-1', guildId: guild.id, type: 'Match Winnings (GvG)', member: 'Guild Pool', amount: 2000, currency: 'GVT', dateLabel: 'Today' },
      { id: 'txn-2', guildId: guild.id, type: 'Member Monthly Dues', member: 'Guild Pool', amount: 50, currency: 'GVT', dateLabel: 'Yesterday' },
    ];

    const callerId = req.user?.id;
    const userMemberRecord = callerId ? members.find((m) => m.userId === callerId) : null;

    const formatted = formatGuild(guild, 0, members.length || 1, Boolean(userMemberRecord));

    return res.status(200).json({
      success: true,
      data: {
        guild: formatted,
        members,
        chatPreview,
        upcomingBattles,
        activeWar,
        guildWarBattles,
        battleHistory,
        incomeBreakdown,
        treasuryTransactions,
        isMember: Boolean(userMemberRecord),
        userRole: userMemberRecord?.role || null,
      },
    });
  } catch (err) {
    console.error('[GuildController] Unexpected error in getGuildById:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching guild',
    });
  }
};

/**
 * POST /api/guilds/:id/apply
 * Submit membership join application.
 */
const applyToGuild = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: User authentication required',
    });
  }

  const { id } = req.params;
  if (!id || !UUID_REGEX.test(id)) {
    return res.status(404).json({
      success: false,
      message: 'Guild not found',
    });
  }

  const parsed = applyGuildBodySchema.safeParse(req.body || {});
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

  const { motivation, guildHistory } = parsed.data;

  try {
    // 1. Check guild existence
    const { data: guild, error: guildErr } = await supabase
      .from('guilds')
      .select('id, name, max_members')
      .eq('id', id)
      .maybeSingle();

    if (guildErr || !guild) {
      return res.status(404).json({
        success: false,
        message: 'Guild not found',
      });
    }

    // 2. Check if user is already a member
    const { data: existingMember } = await supabase
      .from('guild_members')
      .select('id')
      .eq('guild_id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this guild',
      });
    }

    // 3. Check for existing pending application (pre-insert check)
    const { data: existingApp } = await supabase
      .from('guild_applications')
      .select('id')
      .eq('guild_id', id)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingApp) {
      return res.status(409).json({
        success: false,
        message: 'You already have a pending application to this guild',
      });
    }

    // 4. Check member capacity
    const { count: currentMemberCount } = await supabase
      .from('guild_members')
      .select('id', { count: 'exact', head: true })
      .eq('guild_id', id);

    if (currentMemberCount != null && currentMemberCount >= guild.max_members) {
      return res.status(400).json({
        success: false,
        message: 'Guild has reached maximum member capacity',
      });
    }

    // 5. Insert application (guaranteed by idx_uq_guild_pending_app partial unique index)
    const { data: application, error: appErr } = await supabase
      .from('guild_applications')
      .insert({
        guild_id: id,
        user_id: userId,
        motivation,
        guild_history: guildHistory || null,
        status: 'pending',
      })
      .select()
      .single();

    if (appErr || !application) {
      // Catch unique index violation (concurrent race condition)
      if (appErr?.code === '23505' || appErr?.message?.includes('idx_uq_guild_pending_app')) {
        return res.status(409).json({
          success: false,
          message: 'You already have a pending application to this guild',
        });
      }

      console.error('[GuildController] Error creating application:', appErr);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit application',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        id: application.id,
        guildId: application.guild_id,
        userId: application.user_id,
        status: application.status,
        createdAt: application.created_at,
      },
    });
  } catch (err) {
    console.error('[GuildController] Unexpected error in applyToGuild:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while submitting application',
    });
  }
};

module.exports = {
  listGuilds,
  createGuild,
  getGuildById,
  applyToGuild,
};
