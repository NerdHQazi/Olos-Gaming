"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useWallet } from "@/context/WalletContext";
import { useAuth } from "@/context/AuthContext";

type MatchmakingState = "SEARCHING" | "FOUND" | "WAITING" | "COUNTDOWN";

interface MatchmakingProps {
  game: {
    slug: string;
    title: string;
  };
  stake: number;
  winnerReceives: number;
  onCancel: () => void;
  onReady?: () => void;
  onComplete?: (matchId: string) => void;
}

export default function Matchmaking({
  game,
  stake,
  winnerReceives,
  onCancel,
  onReady,
  onComplete,
}: MatchmakingProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { balance, refreshBalance } = useWallet();

  const timelineSeqRef = useRef(0);
  const instanceIdRef = useRef(Math.random().toString(36).slice(2, 10));

  const logAudit = (event: string, extra: Record<string, unknown> = {}) => {
    timelineSeqRef.current += 1;
    const entry = {
      ts: new Date().toISOString(),
      seq: timelineSeqRef.current,
      instanceId: instanceIdRef.current,
      event,
      userId: user?.id ?? null,
      matchId: matchId ?? null,
      state: stateRef.current,
      playerReady,
      opponentReady,
      ...extra,
    };

    try {
      if (typeof window !== 'undefined') {
        const w = window as any;
        if (!Array.isArray(w.__MM_AUDIT_LOGS)) {
          w.__MM_AUDIT_LOGS = [];
        }
        w.__MM_AUDIT_LOGS.push(entry);
      }
    } catch {
      // no-op
    }

    console.log('[MM_AUDIT]', entry);
  };

  const [state, setState] = useState<MatchmakingState>("SEARCHING");
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(10);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<{ id: string; username: string } | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const stateRef = useRef<MatchmakingState>("SEARCHING");
  const startupInFlightRef = useRef(false);
  const startupGenerationRef = useRef(0);
  const activeStartupGenerationRef = useRef<number | null>(null);

  const invokeRpc = async <T,>(
    fnName: string,
    payload: Record<string, unknown>,
    timeoutMs: number
  ): Promise<{ data: T | null; error: Error | null; status?: number }> => {
    logAudit('rpc.start', { fnName, payload, timeoutMs });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      logAudit('rpc.config_missing', { fnName });
      return { data: null, error: new Error('Supabase config missing') };
    }

    let accessToken: string | null = null;

    try {
      const sessionResult = await Promise.race([
        supabase.auth.getSession(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('getSession timeout')), 1500);
        }),
      ]);

      accessToken = (sessionResult as any)?.data?.session?.access_token || null;
    } catch {
      // Fallback to locally persisted auth state when SDK session retrieval stalls.
      try {
        const rawSession = localStorage.getItem('olos_session');
        const parsedSession = rawSession ? JSON.parse(rawSession) : null;
        accessToken = parsedSession?.access_token || null;
      } catch {
        accessToken = null;
      }
    }

    if (!accessToken) {
      logAudit('rpc.no_auth_session', { fnName });
      return { data: null, error: new Error('No active auth session') };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${fnName}`, {
        method: 'POST',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const responseText = await response.text();
      const parsed = responseText ? JSON.parse(responseText) : null;

      if (!response.ok) {
        logAudit('rpc.http_error', { fnName, status: response.status, parsed });
        return {
          data: null,
          error: new Error(parsed?.message || `RPC ${fnName} failed with ${response.status}`),
          status: response.status,
        };
      }

      logAudit('rpc.success', { fnName, status: response.status, parsed });

      return { data: parsed as T, error: null, status: response.status };
    } catch (rpcErr: any) {
      logAudit('rpc.exception', {
        fnName,
        errorName: rpcErr?.name || null,
        message: rpcErr?.message || `${fnName} request failed`,
      });
      return {
        data: null,
        error: new Error(rpcErr?.name === 'AbortError' ? `${fnName} timed out after ${timeoutMs}ms` : (rpcErr?.message || `${fnName} request failed`)),
      };
    } finally {
      clearTimeout(timeout);
    }
  };

  useEffect(() => {
    stateRef.current = state;
    logAudit('state.transition', { nextState: state });
  }, [state]);

  useEffect(() => {
    logAudit('state.ready_flags', { playerReady, opponentReady });
  }, [playerReady, opponentReady]);

  useEffect(() => {
    logAudit('state.match_id', { nextMatchId: matchId });
  }, [matchId]);

  useEffect(() => {
    logAudit('lifecycle.mount');
    return () => {
      logAudit('lifecycle.unmount');
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      console.warn("[Matchmaking] No user found - is the user logged in?");
      setError("You must be logged in to play 1v1");
    } else {
    }
  }, [user, authLoading]);

  useEffect(() => {
    logAudit('effect.matchmaking.entry', {
      authLoading,
      hasUser: !!user?.id,
      game: game.slug,
      stake,
    });

    if (authLoading) return;

    const userId = user?.id;
    if (!userId) {
      logAudit('auth.missing_user', { authLoading });
      setError("Authentication not ready. Please return and retry matchmaking.");
      return;
    }

    let channel: any;
    let searchingPoll: ReturnType<typeof setInterval> | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    let initialHandshakeCompleted = false;

    const isActiveGeneration = (generation: number) => {
      return activeStartupGenerationRef.current === generation;
    };

    const startMatchmaking = async () => {
      if (stateRef.current !== "SEARCHING" || startupInFlightRef.current) {
        logAudit('startup.startMatchmaking.blocked', {
          startupInFlight: startupInFlightRef.current,
          stateAtBlock: stateRef.current,
        });
        return;
      }

      const generation = startupGenerationRef.current + 1;
      startupGenerationRef.current = generation;
      activeStartupGenerationRef.current = generation;

      logAudit('startup.startMatchmaking.invoked', {
        startupInFlight: startupInFlightRef.current,
        stateAtInvoke: stateRef.current,
        generation,
      });

      startupInFlightRef.current = true;
      logAudit('startup.inflight.set_true', { generation });
      
      logAudit('matchmaking.start', { game: game.slug, stake, balance, generation });
      setError(null);

      // Fail fast instead of leaving the player in an infinite searching state.
      timeoutHandle = setTimeout(() => {
        if (!initialHandshakeCompleted && stateRef.current === "SEARCHING") {
          console.error("[Matchmaking] Startup timeout while searching");
          logAudit('matchmaking.startup_timeout', { handshakeCompleted: initialHandshakeCompleted, generation });
          setError("Matchmaking timed out. Please try again.");
        }
      }, 15000);

      // 2. Call RPC (Postgres Function)
      try {
        // Defensive dedupe: clear stale queue row, but do not block matchmaking startup on it.
        try {
          const { error: cancelPreflightError } = await invokeRpc<any>(
            'cancel_matchmaking',
            { p_user_id: userId },
            3000
          );

          if (cancelPreflightError) {
            throw cancelPreflightError;
          }
          logAudit('matchmaking.preflight_cancel.ok', { generation });
        } catch (cancelErr: any) {
          console.warn('[Matchmaking] cancel_matchmaking preflight skipped:', cancelErr?.message || cancelErr);
          logAudit('matchmaking.preflight_cancel.skip', { message: cancelErr?.message || String(cancelErr), generation });
        }

        if (!isActiveGeneration(generation)) {
          logAudit('startup.generation.stale_after_cancel', { generation, activeGeneration: activeStartupGenerationRef.current });
          return;
        }

        const { data, error: rpcError } = await invokeRpc<any>(
          'find_opponent',
          {
            p_user_id: userId,
            p_game_type: game.slug,
            p_stake_amount: stake
          },
          12000
        );

        if (rpcError) throw rpcError;

        if (!isActiveGeneration(generation)) {
          logAudit('startup.generation.stale_after_find', { generation, activeGeneration: activeStartupGenerationRef.current });
          return;
        }

        initialHandshakeCompleted = true;
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
          timeoutHandle = null;
        }
        
        logAudit('matchmaking.find_opponent.response', { data, generation });

        if (data.status === 'matched') {
          setMatchId(data.match_id);
          setState("FOUND");
          fetchMatchDetails(data.match_id, userId);
        } else if (data.status === 'searching') {
          logAudit('matchmaking.searching_queued');
        } else if (data.error) {
          throw new Error(data.error);
        }
      } catch (err: any) {
        if (!isActiveGeneration(generation)) {
          logAudit('startup.generation.stale_error_ignored', { generation, activeGeneration: activeStartupGenerationRef.current });
          return;
        }
        console.error("[Matchmaking] Init Error:", err.message);
        logAudit('matchmaking.start.error', { message: err.message, generation });
        // Explicitly handle "Insufficient balance" with the back button we added
        setError(err.message);
      } finally {
        if (isActiveGeneration(generation)) {
          logAudit('matchmaking.start.finally', { generation });
          startupInFlightRef.current = false;
          activeStartupGenerationRef.current = null;
          logAudit('startup.inflight.reset', { source: 'startMatchmaking.finally', generation });
        } else {
          logAudit('startup.inflight.reset.skip_stale', { generation, activeGeneration: activeStartupGenerationRef.current });
        }
      }
    };

    const subscribeToMatches = (userId: string) => {
      channel = supabase
        .channel(`matchmaking:${userId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'matches'
        }, (payload) => {
          logAudit('realtime.matches.insert', {
            payloadMatchId: payload.new?.id ?? null,
            payloadPlayer1: payload.new?.player1_id ?? null,
            payloadPlayer2: payload.new?.player2_id ?? null,
          });
          // Check if we are part of this new match
          if (payload.new.player1_id === userId || payload.new.player2_id === userId) {
            logAudit('realtime.matches.accepted', { acceptedMatchId: payload.new?.id ?? null });
            handleMatchFound(payload.new, userId);
          }
        })
        .subscribe((status) => {
          logAudit('realtime.matches.status', { status });
        });
    };

    const handleMatchFound = (match: any, userId: string) => {
      logAudit('match.found', {
        foundMatchId: match?.id ?? null,
        player1: match?.player1_id ?? null,
        player2: match?.player2_id ?? null,
      });
      setMatchId(match.id);
      setState("FOUND");
      fetchMatchDetails(match.id, userId);
    };

    const pollForExistingMatch = async () => {
      if (stateRef.current !== "SEARCHING") return;

      const threshold = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: matchData, error: matchPollError } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'active')
        .eq('game_type', game.slug)
        .eq('stake_amount', stake)
        .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
        .gte('created_at', threshold)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (matchPollError) {
        console.error('[Matchmaking] Match poll failed:', matchPollError.message);
        logAudit('poll.match.error', { message: matchPollError.message });
        return;
      }

      if (matchData) {
        logAudit('poll.match.found', { pollMatchId: matchData.id });
        handleMatchFound(matchData, userId);
      } else {
        logAudit('poll.match.none');
      }
    };

    const fetchMatchDetails = async (id: string, userId: string) => {
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', id)
        .single();
      
      if (matchData) {
        const opponentId = matchData.player1_id === userId ? matchData.player2_id : matchData.player1_id;
        
        // Fetch opponent profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', opponentId)
          .single();

        setOpponent({ 
          id: opponentId, 
          username: profileData?.username || `Challenger ${opponentId.slice(0, 5)}` 
        });
        logAudit('match.details.loaded', {
          detailMatchId: matchData.id,
          player1: matchData.player1_id,
          player2: matchData.player2_id,
          status: matchData.status,
        });
      } else if (matchError) {
        console.error(`[Matchmaking] Detail fetch failed:`, matchError.message);
        logAudit('match.details.error', { message: matchError.message });
      }
    };

    // Subscribe per effect run so StrictMode effect re-runs keep realtime attached
    // even when startup is already owned by an in-flight generation.
    subscribeToMatches(userId);
    void startMatchmaking();
    searchingPoll = setInterval(pollForExistingMatch, 1200);

    const handleUnload = () => {
      if (userId && stateRef.current === "SEARCHING") {
        logAudit('lifecycle.beforeunload_cancel');
        supabase.rpc("cancel_matchmaking", { p_user_id: userId });
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      logAudit('effect.matchmaking.cleanup');
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
      window.removeEventListener("beforeunload", handleUnload);
      if (channel) {
        logAudit('lifecycle.cleanup.remove_matchmaking_channel');
        supabase.removeChannel(channel);
      }
      if (searchingPoll) {
        clearInterval(searchingPoll);
        logAudit('lifecycle.cleanup.stop_match_poll');
      }
    };
  }, [authLoading, game.slug, stake, user?.id]);

  const handleCancel = async () => {
    logAudit('ui.cancel_clicked');
    // Exit the screen immediately to avoid trapping users behind a stuck RPC.
    onCancel();

    if (user) {
      try {
        const { error: cancelError } = await invokeRpc<any>('cancel_matchmaking', { p_user_id: user.id }, 3000);
        if (cancelError) {
          throw cancelError;
        }
        logAudit('ui.cancel_rpc.ok');
        await refreshBalance();
      } catch (cancelError: any) {
        console.error('[Matchmaking] Cancel RPC failed:', cancelError?.message || cancelError);
        logAudit('ui.cancel_rpc.error', { message: cancelError?.message || String(cancelError) });
      }
    }
  };

  // Subscribe to match events for "Ready" status
  useEffect(() => {
    if (!matchId || !user) return;

    const syncReadyFromEvents = async () => {
      const { data, error: readyFetchError } = await supabase
        .from('match_events')
        .select('player_id')
        .eq('match_id', matchId)
        .eq('event_type', 'ready');

      if (readyFetchError) {
        console.error('[Matchmaking] Ready sync failed:', readyFetchError.message);
        logAudit('ready.sync.error', { message: readyFetchError.message });
        return;
      }

      const readyIds = new Set((data || []).map((row: any) => row.player_id));
      let iAmReady = readyIds.has(user.id);
      let oppReady = [...readyIds].some((id) => id !== user.id);

      // Fallback for occasional client-side desync: ask DB authority if both players are ready.
      if (!iAmReady || !oppReady) {
        const { data: bothReady, error: bothReadyError } = await supabase.rpc('are_both_players_ready', {
          p_match_id: matchId,
        });

        if (bothReadyError) {
          console.error('[Matchmaking] Authoritative ready check failed:', bothReadyError.message);
          logAudit('ready.authoritative.error', { message: bothReadyError.message });
        } else if (bothReady) {
          iAmReady = true;
          oppReady = true;
          logAudit('ready.authoritative.true');
        }
      }

      logAudit('ready.sync.result', {
        readyIds: [...readyIds],
        iAmReady,
        oppReady,
      });

      setPlayerReady(iAmReady);
      setOpponentReady(oppReady);

      if ((stateRef.current === 'FOUND' || stateRef.current === 'WAITING') && iAmReady) {
        setState('WAITING');
      }
    };

    syncReadyFromEvents();

    const channel = supabase
      .channel(`match_events:${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'match_events',
        filter: `match_id=eq.${matchId}`
      }, (payload) => {
        logAudit('realtime.match_events.insert', {
          eventType: payload.new?.event_type ?? null,
          eventPlayerId: payload.new?.player_id ?? null,
          eventMatchId: payload.new?.match_id ?? null,
        });
        if (payload.new.event_type === 'ready') {
          syncReadyFromEvents();
        }
      })
      .subscribe(async (status) => {
        logAudit('realtime.match_events.status', { status });
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });

    const readyPoll = setInterval(() => {
      if (stateRef.current === 'FOUND' || stateRef.current === 'WAITING') {
        syncReadyFromEvents();
      }
    }, 1500);

    return () => {
      clearInterval(readyPoll);
      supabase.removeChannel(channel);
    };
  }, [matchId, user]);

  // Effect for WAITING -> COUNTDOWN transition
  useEffect(() => {
    if (playerReady && opponentReady && matchId) {
      const syncCountdown = async () => {
        const { data } = await supabase
          .from('match_events')
          .select('created_at')
          .eq('match_id', matchId)
          .eq('event_type', 'ready')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          const startTime = new Date(data.created_at).getTime();
          const now = new Date().getTime();
          const elapsed = Math.floor((now - startTime) / 1000);
          setCountdown(Math.max(1, 10 - elapsed));
        }
        logAudit('countdown.start', {
          countdown,
          playerReady,
          opponentReady,
          matchId,
        });
        setState("COUNTDOWN");
      };
      
      syncCountdown();
    }
  }, [playerReady, opponentReady, matchId]);

  // Handle countdown timer
  useEffect(() => {
    if (state !== "COUNTDOWN") return;

    if (countdown > 0) {
      logAudit('countdown.tick', { countdown });
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      logAudit('countdown.complete_onComplete', { matchId });
      onComplete?.(matchId!);
    }
  }, [state, countdown, onComplete, matchId]);

  const handleReady = async () => {
    if (!user) return;

    let effectiveMatchId = matchId;

    // Recover from occasional FOUND-state desync where matchId was not set in client state.
    if (!effectiveMatchId) {
      const threshold = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: fallbackMatch, error: fallbackError } = await supabase
        .from('matches')
        .select('id')
        .eq('status', 'active')
        .eq('game_type', game.slug)
        .eq('stake_amount', stake)
        .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
        .gte('created_at', threshold)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallbackError) {
        console.error('[Matchmaking] Ready fallback match lookup failed:', fallbackError.message);
        logAudit('ready.fallback.error', { message: fallbackError.message });
        setError('Could not resolve active match. Please retry.');
        return;
      }

      if (!fallbackMatch?.id) {
        console.error('[Matchmaking] Ready fallback found no active match for user');
        logAudit('ready.fallback.none');
        setError('No active match found. Please retry matchmaking.');
        return;
      }

      effectiveMatchId = fallbackMatch.id;
      setMatchId(fallbackMatch.id);
    }

    // Send "ready" event
    const { error: readyError } = await supabase.from('match_events').insert({
      match_id: effectiveMatchId,
      player_id: user.id,
      event_type: 'ready'
    });

    if (readyError) {
      console.error('[Matchmaking] Ready insert failed:', readyError.message);
      logAudit('ready.insert.error', { message: readyError.message });
      setError(readyError.message);
      return;
    }

    setPlayerReady(true);
    setState("WAITING");
    logAudit('ready.insert.ok', { effectiveMatchId });
    onReady?.();
  };

  return (
    <div className="w-full max-w-[700px] aspect-[4/3] bg-[#0d1326] rounded-3xl border border-white/10 p-8 flex flex-col items-center justify-between shadow-2xl relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#3b82f6,transparent_70%)]" />
      </div>

      {/* Header Text */}
      <div className="text-center z-10">
        <h2 className={`text-xl font-black tracking-tight ${error ? 'text-red-500' : 'text-white'}`}>
          {error ? "Matchmaking Failed" : (
            state === "SEARCHING" ? "Finding Opponent...." :
            state === "FOUND" ? "Opponent found!" :
            "Match Starting!"
          )}
        </h2>
        {error && <p className="text-xs font-bold text-red-400/80 mt-1 uppercase tracking-widest">{error}</p>}
      </div>

      {/* Versus Section */}
      <div className="flex items-center justify-center gap-16 z-10 w-full">
        {/* Player */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            <span className="text-3xl font-black text-white">P</span>
          </div>
          <span className="text-xs font-black text-white uppercase tracking-wider">You</span>
        </div>

        {/* VS or Spinner/Countdown */}
        <div className="relative">
          {state !== "WAITING" && state !== "COUNTDOWN" && (
            <span className="text-4xl font-black text-gray-700 uppercase tracking-tighter">VS</span>
          )}
          {state === "WAITING" && (
            <div className="w-16 h-16 border-4 border-white/5 border-t-blue-500 rounded-full animate-spin" />
          )}
          {state === "COUNTDOWN" && (
            <div className="flex flex-col items-center">
              <span className="text-7xl font-black text-white leading-none">
                {countdown}<span className="text-blue-500">s</span>
              </span>
            </div>
          )}
        </div>

        {/* Opponent */}
        <div className="flex flex-col items-center gap-4">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
            state === "SEARCHING" 
              ? "bg-white/5 border-white/10" 
              : "bg-gray-700 border-transparent shadow-[0_0_30px_rgba(55,65,81,0.3)]"
          }`}>
            {state === "SEARCHING" ? (
              <svg className="w-8 h-8 text-white/20 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <span className="text-3xl font-black text-white">C</span>
            )}
          </div>
          <span className="text-xs font-black text-gray-500 uppercase tracking-wider">
            {state === "SEARCHING" ? "Searching" : (opponent?.username || "Challenger")}
          </span>
        </div>
      </div>

      {/* Status Message */}
      {(state === "WAITING" || state === "COUNTDOWN") && (
        <div className="text-center z-10 px-4">
          <p className="text-sm font-bold text-gray-400">
            {state === "WAITING" && "Waiting for the challenger to be ready!"}
            {state === "COUNTDOWN" && "Challenger is ready! Game starts in " + countdown + "s"}
          </p>
        </div>
      )}

      {/* Info Card */}
      <div className="w-full max-w-[500px] bg-blue-900/10 border border-blue-500/10 rounded-2xl p-6 z-10">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 font-bold uppercase tracking-widest">Game</span>
            <span className="text-white font-black">{game.title}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 font-bold uppercase tracking-widest">Stake</span>
            <span className="text-white font-black">{stake} GVT</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Winner receives</span>
            <span className="text-[#00d2ff] text-xl font-black">{winnerReceives} GVT</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="w-full max-w-[500px] z-10">
        {error ? (
          <button
            onClick={error.toLowerCase().includes("balance") ? onCancel : () => window.location.reload()}
            className="w-full py-4 rounded-xl bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 text-red-500 text-sm font-black transition-all active:scale-95"
          >
            {error.toLowerCase().includes("balance") ? "Back to Stake" : "Try Again"}
          </button>
        ) : (
          <>
            {state === "SEARCHING" && (
              <button
                onClick={handleCancel}
                className="w-full py-4 rounded-xl border border-white/10 hover:bg-white/5 text-white text-sm font-black transition-all active:scale-95"
              >
                Cancel
              </button>
            )}
            {state === "FOUND" && (
              <button
                data-testid="ready-button"
                onClick={handleReady}
                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black transition-all active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Ready
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
