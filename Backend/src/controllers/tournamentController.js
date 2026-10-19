const { z } = require('zod');
const supabase = require('../config/supabase');

const GVT_USD_RATE = 0.10;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const listTournamentsQuerySchema = z.object({
  search: z.string().trim().optional(),
  gameType: z.string().trim().optional(),
  status: z.enum(['upcoming', 'registration_open', 'active', 'completed', 'cancelled']).optional(),
  sort: z.enum(['upcoming', 'prize', 'participants', 'newest']).default('upcoming'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
});

function deriveRoundStatus(t) {
  if (t.status === 'registration_open') return 'REGISTRATION OPEN';
  if (t.status === 'upcoming') return 'UPCOMING';
  if (t.status === 'completed') return 'COMPLETED';
  if (t.status === 'cancelled') return 'CANCELLED';
  if (t.status === 'active') {
    const round = t.round_number || 1;
    return `ROUND ${round} IN PROGRESS`;
  }
  return String(t.status).toUpperCase();
}

function formatTournamentSummary(t) {
  const entryFee = Number(t.entry_fee_gvt) || 0;
  const prizePool = Number(t.prize_pool_gvt) || 0;

  return {
    id: t.id,
    title: t.title,
    description: t.description || null,
    gameType: t.game_type,
    status: t.status,
    roundStatus: deriveRoundStatus(t),
    format: t.format || 'single_elimination',
    entryFeeGvt: entryFee,
    entryFeeUsd: Number((entryFee * GVT_USD_RATE).toFixed(2)),
    prizePoolGvt: prizePool,
    prizePoolUsd: Number((prizePool * GVT_USD_RATE).toFixed(2)),
    currency: t.currency || 'GVT',
    currentParticipants: Number(t.current_participants) || 0,
    maxParticipants: Number(t.max_participants) || 8,
    roundNumber: Number(t.round_number) || 1,
    totalRounds: Number(t.total_rounds) || 3,
    startsAt: t.starts_at || null,
    registrationDeadline: t.registration_deadline || null,
    createdAt: t.created_at
  };
}

/**
 * GET /api/tournaments
 * List tournaments with status/game filtering, sorting, and pagination.
 */
const listTournaments = async (req, res) => {
  const parsed = listTournamentsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
    });
  }

  const { search, gameType, status, sort, limit, page } = parsed.data;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    let query = supabase
      .from('tournaments')
      .select(`
        id,
        title,
        description,
        game_type,
        status,
        format,
        entry_fee_gvt,
        prize_pool_gvt,
        currency,
        current_participants,
        max_participants,
        round_number,
        total_rounds,
        starts_at,
        registration_deadline,
        created_at
      `, { count: 'exact' });

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    if (gameType) {
      query = query.eq('game_type', gameType.toLowerCase());
    }

    if (status) {
      query = query.eq('status', status);
    }

    switch (sort) {
      case 'prize':
        query = query.order('prize_pool_gvt', { ascending: false });
        break;
      case 'participants':
        query = query.order('current_participants', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'upcoming':
      default:
        query = query.order('starts_at', { ascending: true, nullsFirst: false });
        break;
    }

    query = query.range(from, to);

    const { data: tournaments, error, count } = await query;

    if (error) {
      console.error('[TournamentController] Error fetching tournaments:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve tournaments'
      });
    }

    const total = count != null ? count : (tournaments?.length || 0);
    const formatted = (tournaments || []).map(formatTournamentSummary);

    return res.status(200).json({
      success: true,
      data: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (err) {
    console.error('[TournamentController] Unexpected error in listTournaments:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while listing tournaments'
    });
  }
};

/**
 * GET /api/tournaments/:id
 * Retrieve tournament details including rules, prize distribution, structured bracket tree,
 * and caller registration status.
 */
const getTournamentDetails = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!id || !UUID_REGEX.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid tournament ID format'
    });
  }

  try {
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (tournamentError) {
      console.error('[TournamentController] Error fetching tournament details:', tournamentError);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve tournament details'
      });
    }

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    let isRegistered = false;
    let participantData = null;

    if (userId) {
      const { data: participant, error: partError } = await supabase
        .from('tournament_participants')
        .select('id, seed, status, registered_at')
        .eq('tournament_id', id)
        .eq('user_id', userId)
        .maybeSingle();

      if (partError) {
        console.warn('[TournamentController] Warning checking user tournament participation:', partError);
      } else if (participant) {
        isRegistered = true;
        participantData = participant;
      }
    }

    const summary = formatTournamentSummary(tournament);

    const bracketTree = tournament.bracket_data && typeof tournament.bracket_data === 'object'
      ? tournament.bracket_data
      : { quarters: [], semis: [], finals: null };

    const rules = Array.isArray(tournament.rules)
      ? tournament.rules
      : [
          'Mode: Single Elimination Knockout',
          'Game Timer: 10 mins max per round',
          'Disconnection results in automatic forfeit',
          'Stakes are held in secure platform escrow'
        ];

    const prizeDistribution = Array.isArray(tournament.prize_distribution)
      ? tournament.prize_distribution
      : [
          { place: '1st Place', amount: `${summary.prizePoolGvt * 0.5} GVT`, pct: '50% of Pool', highlight: true },
          { place: '2nd Place', amount: `${summary.prizePoolGvt * 0.25} GVT`, pct: '25% of Pool', highlight: false },
          { place: '3rd - 4th Place', amount: `${summary.prizePoolGvt * 0.125} GVT each`, pct: '12.5% of Pool', highlight: false }
        ];

    return res.status(200).json({
      success: true,
      data: {
        ...summary,
        bracketTree,
        rules,
        prizeDistribution,
        isRegistered,
        userParticipation: participantData
      }
    });
  } catch (err) {
    console.error('[TournamentController] Unexpected error in getTournamentDetails:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching tournament details'
    });
  }
};

/**
 * POST /api/tournaments/:id/register
 * Authenticated registration for a tournament. Atomically validates status/capacity,
 * verifies balance, debits entry fee (if > 0), increments participants count, and registers user.
 */
const registerTournament = async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User authentication required'
    });
  }

  if (!id || !UUID_REGEX.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid tournament ID format'
    });
  }

  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('register_tournament_participant', {
      p_user_id: userId,
      p_tournament_id: id
    });

    if (rpcError) {
      const msg = rpcError.message || '';

      if (msg.includes('Tournament not found')) {
        return res.status(404).json({
          success: false,
          message: 'Tournament not found'
        });
      }

      if (msg.includes('Tournament registration is closed') || msg.includes('deadline has passed') || msg.includes('already started')) {
        return res.status(400).json({
          success: false,
          message: msg
        });
      }

      if (msg.includes('Tournament is at maximum capacity') || msg.includes('chk_tournaments_capacity')) {
        return res.status(400).json({
          success: false,
          message: 'Tournament is at maximum capacity'
        });
      }

      if (msg.includes('already registered') || rpcError.code === '23505' || msg.includes('uq_tournament_participant')) {
        return res.status(409).json({
          success: false,
          message: 'User is already registered for this tournament'
        });
      }

      if (msg.includes('Insufficient GVT balance')) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient GVT balance for tournament entry fee'
        });
      }

      if (msg.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized caller identity'
        });
      }

      console.error('[TournamentController] RPC Error during registration:', rpcError);
      return res.status(500).json({
        success: false,
        message: 'Failed to register for tournament'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully registered for tournament',
      data: rpcResult
    });
  } catch (err) {
    console.error('[TournamentController] Unexpected error in registerTournament:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during tournament registration'
    });
  }
};

module.exports = {
  listTournaments,
  getTournamentDetails,
  registerTournament
};
