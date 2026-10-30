"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const COLS = 20;
const ROWS = 20;
const CELL = 24;
const W = COLS * CELL;
const H = ROWS * CELL;

type Dir = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Pos = { x: number; y: number };

const DIR_VEC: Record<Dir, Pos> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

function rnd(max: number) {
  return Math.floor(Math.random() * max);
}

/* ------------------------------------------------------------------ */
/*  DRAWING HELPERS - this is where the new look lives                 */
/* ------------------------------------------------------------------ */

// Fixed little background sparkles (deterministic so they never jump around)
const SPARKLES = Array.from({ length: 45 }, (_, i) => ({
  x: (i * 97 + 13) % W,
  y: (i * 193 + 71) % H,
  r: 0.6 + (i % 3) * 0.4,
  a: 0.15 + (i % 5) * 0.07,
}));

// 1. Dark board with a faint purple grid
function drawBoard(ctx: CanvasRenderingContext2D) {
  const bg = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.75);
  bg.addColorStop(0, "#0b1226");
  bg.addColorStop(1, "#03050b");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(113,53,219,0.16)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL + 0.5, 0);
    ctx.lineTo(x * CELL + 0.5, H);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL + 0.5);
    ctx.lineTo(W, y * CELL + 0.5);
    ctx.stroke();
  }

  for (const s of SPARKLES) {
    ctx.fillStyle = `rgba(255,255,255,${s.a})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 2. Food: a glowing gold coin that gently pulses
function drawCoin(ctx: CanvasRenderingContext2D, cell: Pos, time: number) {
  const cx = cell.x * CELL + CELL / 2;
  const cy = cell.y * CELL + CELL / 2;
  const r = (CELL / 2 - 3) * (1 + Math.sin(time / 250) * 0.08);

  ctx.save();
  ctx.shadowColor = "#ffb020";
  ctx.shadowBlur = 16;
  const g = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, r);
  g.addColorStop(0, "#fff3b0");
  g.addColorStop(0.5, "#ffc233");
  g.addColorStop(1, "#d97706");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#b45309";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// 3. Snake: one glowing ball per grid cell, drawn tail -> head so the head ends up on top
function drawSnake(
  ctx: CanvasRenderingContext2D,
  snake: Pos[],
  dir: Dir,
  alive: boolean,
  time: number,
) {
  const n = snake.length;
  ctx.save();
  ctx.globalAlpha = alive ? 1 : 0.45;

  for (let i = n - 1; i >= 0; i--) {
    const cx = snake[i].x * CELL + CELL / 2;
    const cy = snake[i].y * CELL + CELL / 2;
    const isHead = i === 0;

    // body gets slightly thinner toward the tail
    const taper = n > 1 ? 1 - (i / n) * 0.35 : 1;
    const r = isHead ? CELL * 0.5 : CELL * 0.42 * taper;

    // alternate two greens so the body looks segmented
    const light = i % 2 === 0 ? "#9dff5a" : "#6fe63a";
    const dark = i % 2 === 0 ? "#2a9d12" : "#237f10";

    ctx.shadowColor = "rgba(80,255,60,0.55)";
    ctx.shadowBlur = isHead ? 16 : 10;

    const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    g.addColorStop(0, light);
    g.addColorStop(1, dark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Head details: tongue + eyes, rotated to face the direction of travel
  const head = snake[0];
  const hx = head.x * CELL + CELL / 2;
  const hy = head.y * CELL + CELL / 2;
  const f = DIR_VEC[dir]; // forward
  const p = { x: -f.y, y: f.x }; // sideways

  ctx.shadowBlur = 0;

  // tongue flicks in and out
  if (alive && Math.sin(time / 180) > 0) {
    const tx = hx + f.x * CELL * 0.5;
    const ty = hy + f.y * CELL * 0.5;
    ctx.strokeStyle = "#ff3b5c";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + f.x * 6, ty + f.y * 6);
    ctx.moveTo(tx + f.x * 6, ty + f.y * 6);
    ctx.lineTo(tx + f.x * 9 + p.x * 3, ty + f.y * 9 + p.y * 3);
    ctx.moveTo(tx + f.x * 6, ty + f.y * 6);
    ctx.lineTo(tx + f.x * 9 - p.x * 3, ty + f.y * 9 - p.y * 3);
    ctx.stroke();
  }

  for (const side of [-1, 1]) {
    const ex = hx + f.x * 3 + p.x * 5 * side;
    const ey = hy + f.y * 3 + p.y * 5 * side;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ex, ey, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0b0b14";
    ctx.beginPath();
    ctx.arc(ex + f.x * 1.2, ey + f.y * 1.2, 1.9, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/* ------------------------------------------------------------------ */

export default function SnakeScreen() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode") || "Solo";
  const matchId = searchParams.get("matchId");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    snake: [{ x: 10, y: 10 }] as Pos[],
    dir: "RIGHT" as Dir,
    nextDir: "RIGHT" as Dir,
    food: { x: 15, y: 10 } as Pos,
    score: 0,
    alive: true,
    started: false,
    opponentScore: 0,
    p1_time: 600,
    p2_time: 600,
  });

  const [score, setScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [p1Time, setP1Time] = useState(600);
  const [p2Time, setP2Time] = useState(600);
  const [alive, setAlive] = useState(true);
  const [started, setStarted] = useState(false);
  const [respawnTimer, setRespawnTimer] = useState(0);
  const [matchStatus, setMatchStatus] = useState<"active" | "finished">(
    "active",
  );
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [isPlayer1, setIsPlayer1] = useState(true);

  // Forfeit & Rematch state
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
  const [rematchStatus, setRematchStatus] = useState<
    "none" | "pending" | "invited" | "accepted"
  >("none");
  const [isForfeiting, setIsForfeiting] = useState(false);

  const loopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const respawnRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMatchState = useCallback(async () => {
    if (!matchId) return;
    const { data } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();
    if (data && user) {
      const s = stateRef.current;
      const amP1 = data.player1_id === user.id;
      setIsPlayer1(amP1);

      s.food = data.current_apple_pos;
      s.score = amP1 ? data.player1_score : data.player2_score;
      s.opponentScore = amP1 ? data.player2_score : data.player1_score;
      s.p1_time = data.player1_time_remaining;
      s.p2_time = data.player2_time_remaining;

      setScore(s.score);
      setOpponentScore(s.opponentScore);
      setP1Time(s.p1_time);
      setP2Time(s.p2_time);
    }
  }, [matchId]);

  useEffect(() => {
    if (mode === "1v1" && matchId) {
      fetchMatchState();

      // Subscribe to match updates
      const channel = supabase
        .channel(`game:${matchId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "matches",
            filter: `id=eq.${matchId}`,
          },
          (payload) => {
            const s = stateRef.current;
            const amP1 = payload.new.player1_id === user?.id;

            s.food = payload.new.current_apple_pos;
            s.score = amP1
              ? payload.new.player1_score
              : payload.new.player2_score;
            s.opponentScore = amP1
              ? payload.new.player2_score
              : payload.new.player1_score;
            s.p1_time = payload.new.player1_time_remaining;
            s.p2_time = payload.new.player2_time_remaining;

            setScore(s.score);
            setOpponentScore(s.opponentScore);
            setP1Time(s.p1_time);
            setP2Time(s.p2_time);

            if (payload.new.status === "finished") {
              s.alive = false;
              setAlive(false);
              setMatchStatus("finished");
              setWinnerId(payload.new.winner_id);
            } else if (
              payload.new.status === "active" &&
              payload.old &&
              payload.old.status === "finished"
            ) {
              // Rematch triggered
              s.snake = [{ x: 10, y: 10 }];
              s.dir = "RIGHT";
              s.nextDir = "RIGHT";
              s.score = 0;
              s.opponentScore = 0;
              s.alive = true;
              s.started = true;
              setScore(0);
              setOpponentScore(0);
              setAlive(true);
              setStarted(true);
              setMatchStatus("active");
              setWinnerId(null);
              setRematchStatus("none");
            }
          },
        )
        .subscribe();

      // Subscribe to match events (Rematch, Forfeit, etc)
      const eventsChannel = supabase
        .channel(`events:${matchId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "match_events",
            filter: `match_id=eq.${matchId}`,
          },
          (payload) => {
            if (
              payload.new.event_type === "rematch_request" &&
              payload.new.player_id !== user?.id
            ) {
              setRematchStatus("invited");
            }
            if (payload.new.event_type === "rematch_accepted") {
              setRematchStatus("accepted");
            }
            if (payload.new.event_type === "rematch_declined") {
              setRematchStatus("none");
            }
          },
        )
        .subscribe();

      // Periodic timer tick call (Phase 4B)
      const tickTimer = setInterval(async () => {
        await supabase.functions.invoke("game_tick", {
          body: { match_id: matchId },
        });
      }, 5000);

      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(eventsChannel);
        clearInterval(tickTimer);
      };
    }
  }, [mode, matchId, fetchMatchState, user?.id]);

  const randomFood = useCallback((snake: Pos[]): Pos => {
    let f: Pos;
    do {
      f = { x: rnd(COLS), y: rnd(ROWS) };
    } while (snake.some((s) => s.x === f.x && s.y === f.y));
    return f;
  }, []);

  const reset = useCallback(() => {
    if (mode === "1v1") return; // Cannot manual reset in 1v1
    const s = stateRef.current;
    s.snake = [{ x: 10, y: 10 }];
    s.dir = "RIGHT";
    s.nextDir = "RIGHT";
    s.food = randomFood(s.snake);
    s.score = 0;
    s.alive = true;
    s.started = true;
    setScore(0);
    setAlive(true);
    setStarted(true);
  }, [randomFood, mode]);

  // Draws one frame. Called ~60 times a second by the animation loop below.
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s = stateRef.current;
    const time = performance.now();

    drawBoard(ctx);
    drawCoin(ctx, s.food, time);
    drawSnake(ctx, s.snake, s.dir, s.alive, time);

    // Game Over overlay
    if (!s.alive && s.started) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px Outfit, sans-serif";
      ctx.fillText("GAME OVER", W / 2, H / 2 - 20);
    }

    // Start screen
    if (!s.started) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px Outfit, sans-serif";
      ctx.fillText(
        mode === "1v1" ? "Get ready..." : "Press Space or click to start",
        W / 2,
        H / 2,
      );
    }
  }, [mode]);

  const tick = useCallback(async () => {
    const s = stateRef.current;
    if (
      !s.alive ||
      (!s.started && mode !== "1v1") ||
      matchStatus === "finished"
    )
      return;

    // Auto-start 1v1 if not started
    if (mode === "1v1" && !s.started) {
      s.started = true;
      setStarted(true);
    }

    s.dir = s.nextDir;
    const head = s.snake[0];
    let nx = head.x;
    let ny = head.y;
    if (s.dir === "UP") ny--;
    if (s.dir === "DOWN") ny++;
    if (s.dir === "LEFT") nx--;
    if (s.dir === "RIGHT") nx++;

    // Wall or Self collision detection
    const hitWall = nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS;
    const hitSelf = s.snake.some((seg) => seg.x === nx && seg.y === ny);

    if (hitWall || hitSelf) {
      s.alive = false;
      setAlive(false);

      if (mode === "1v1" && matchStatus === "active") {
        // Start 5s respawn countdown
        setRespawnTimer(5);
        let count = 5;
        respawnRef.current = setInterval(() => {
          count--;
          setRespawnTimer(count);
          if (count <= 0) {
            clearInterval(respawnRef.current!);
            respawnRef.current = null;
            // Respawn
            s.snake = [{ x: 10, y: 10 }];
            s.dir = "RIGHT";
            s.nextDir = "RIGHT";
            s.alive = true;
            setAlive(true);
            setRespawnTimer(0);
          }
        }, 1000);
      }
      return;
    }

    const ate = nx === s.food.x && ny === s.food.y;
    s.snake = [{ x: nx, y: ny }, ...s.snake];

    if (!ate) {
      s.snake.pop();
    } else {
      if (mode === "Solo") {
        s.score += 10;
        setScore(s.score);
        s.food = randomFood(s.snake);
      } else {
        // 1v1: Validate with server (using user from scope)
        if (user && matchId) {
          await supabase.rpc("validate_apple_eaten", {
            p_match_id: matchId,
            p_player_id: user.id,
            p_x: nx,
            p_y: ny,
          });
        }
      }
    }
  }, [randomFood, mode, matchId, matchStatus, user]);

  // Animation loop: redraws every frame so the coin pulses and the tongue flicks.
  // (The game logic still only moves on the slower setInterval tick below.)
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [draw]);

  useEffect(() => {
    const speed = Math.max(80, 160 - Math.floor(score / 50) * 10);
    if (loopRef.current) clearInterval(loopRef.current);
    if (matchStatus === "active") {
      loopRef.current = setInterval(tick, speed);
    }
    return () => {
      if (loopRef.current) clearInterval(loopRef.current);
    };
  }, [tick, score, matchStatus]);

  // Client-side timer countdown for smooth UI
  useEffect(() => {
    if (mode !== "1v1" || matchStatus === "finished" || !started) return;

    const timer = setInterval(() => {
      setP1Time((prev) => Math.max(0, prev - 1));
      setP2Time((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, matchStatus, started]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;

      const map: Record<string, Dir> = {
        ArrowUp: "UP",
        KeyW: "UP",
        w: "UP",
        W: "UP",
        ArrowDown: "DOWN",
        KeyS: "DOWN",
        s: "DOWN",
        S: "DOWN",
        ArrowLeft: "LEFT",
        KeyA: "LEFT",
        a: "LEFT",
        A: "LEFT",
        ArrowRight: "RIGHT",
        KeyD: "RIGHT",
        d: "RIGHT",
        D: "RIGHT",
      };

      if (e.code === "Space") {
        e.preventDefault();
        if (!s.started || !s.alive) reset();
        return;
      }

      const d = map[e.code] || map[e.key];
      if (!d) return;

      // Prevent scrolling for game keys
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(
          e.code,
        ) ||
        ["w", "a", "s", "d", "W", "A", "S", "D"].includes(e.key)
      ) {
        e.preventDefault();
      }

      const opp: Record<Dir, Dir> = {
        UP: "DOWN",
        DOWN: "UP",
        LEFT: "RIGHT",
        RIGHT: "LEFT",
      };

      if (opp[d] !== s.dir) {
        s.nextDir = d;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reset]);

  const handleForfeit = async () => {
    if (!matchId || !user) return;
    setIsForfeiting(true);
    try {
      await supabase.rpc("forfeit_match", {
        p_match_id: matchId,
        p_player_id: user.id,
      });
      router.push("/dashboard/games");
    } catch (err) {
      console.error("Forfeit error:", err);
    } finally {
      setShowForfeitConfirm(false);
      setIsForfeiting(false);
    }
  };

  const handleRematchRequest = async () => {
    if (!matchId || !user) return;
    setRematchStatus("pending");
    await supabase.from("match_events").insert({
      match_id: matchId,
      player_id: user.id,
      event_type: "rematch_request",
    });
  };

  const handleAcceptRematch = async () => {
    if (!matchId || !user) return;
    await supabase.from("match_events").insert({
      match_id: matchId,
      player_id: user.id,
      event_type: "rematch_accepted",
    });
    // Trigger actual reset in DB (only P1 needs to call RPC)
    if (isPlayer1) {
      await supabase.rpc("trigger_rematch", { p_match_id: matchId });
    }
  };

  const handleDeclineRematch = async () => {
    if (!matchId || !user) return;
    await supabase.from("match_events").insert({
      match_id: matchId,
      player_id: user.id,
      event_type: "rematch_declined",
    });
    setRematchStatus("none");
  };

  return (
    <div className="min-h-screen bg-[#05080F] text-white font-outfit">
      <div className="flex flex-col items-center pt-24 pb-16 px-4">
        {/* Sub-header Bar */}
        <div className="w-full max-w-[1200px] flex items-center justify-between py-4 border-y border-white/5 mb-8">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard/games/snake/details"
              aria-label="Back to game details"
              className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Link>
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-white leading-none">
                Snake <span className="text-amber-500">Battle</span>
              </h1>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                {mode === "1v1" ? "1v1 Mode" : "Practice Mode"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-2 bg-[#1A232E]/30 border border-white/5 rounded-xl">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-olos-blue"
            >
              <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
              <path d="M18 12H22" />
            </svg>
            <span className="text-[13px] font-black text-white">1000</span>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-[800px] mb-10">
          <div className="bg-[#0D131C] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 aspect-[4/3]">
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
              Score
            </span>
            <span className="text-4xl font-black text-olos-blue">{score}</span>
          </div>
          <div className="bg-[#0D131C] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 aspect-[4/3]">
            <span className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.2em]">
              Match Time
            </span>
            <span className="text-4xl font-black text-cyan-400">
              {Math.floor(p1Time / 60)
                .toString()
                .padStart(2, "0")}
              :{(p1Time % 60).toString().padStart(2, "0")}
            </span>
          </div>
          <div className="bg-[#0D131C] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 aspect-[4/3]">
            <span className="text-[11px] font-black text-red-500 uppercase tracking-[0.2em]">
              Challenger
            </span>
            <span className="text-4xl font-black text-red-500">
              {opponentScore}
            </span>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-[#7135DB]/10 rounded-[40px] blur-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="relative p-1 bg-gradient-to-b from-[#7135DB]/60 to-transparent rounded-[32px] overflow-hidden shadow-2xl shadow-black/50">
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              className="block rounded-[28px] max-w-full h-auto"
              onClick={() => {
                const s = stateRef.current;
                if (!s.started || !s.alive) reset();
              }}
            />

            {/* Death / Respawn Overlay */}
            {!alive && matchStatus === "active" && respawnTimer > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-[28px] animate-in fade-in duration-300">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">
                  Respawning in
                </span>
                <span className="text-7xl font-black text-white tabular-nums">
                  {respawnTimer}
                </span>
              </div>
            )}

            {/* Match Finished Overlay */}
            {matchStatus === "finished" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-[28px] animate-in zoom-in duration-500 text-center px-4">
                <span className="text-sm font-black text-olos-blue uppercase tracking-widest mb-2">
                  Match Finished
                </span>
                <h2 className="text-4xl font-black text-white mb-6">
                  {winnerId === null
                    ? "DRAW!"
                    : winnerId === user?.id
                      ? "YOU WIN!"
                      : "YOU LOSE!"}
                </h2>
                <div className="flex gap-4">
                  <Link
                    href="/dashboard/games"
                    className="px-8 py-3 rounded-xl bg-olos-blue text-white text-[13px] font-black hover:scale-105 transition-all"
                  >
                    Leave Match
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Rematch Invitation Banner */}
          {rematchStatus === "invited" && (
            <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[400px] bg-[#0D131C] border border-olos-blue/30 rounded-2xl p-4 flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom-4 duration-500 z-20">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-olos-blue uppercase tracking-widest">
                  Rematch?
                </span>
                <span className="text-xs text-white/60 font-medium">
                  Opponent wants a rematch
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDeclineRematch}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[11px] font-black transition-all"
                >
                  Decline
                </button>
                <button
                  onClick={handleAcceptRematch}
                  className="px-4 py-2 rounded-lg bg-olos-blue hover:bg-blue-500 text-white text-[11px] font-black transition-all shadow-lg shadow-blue-500/20"
                >
                  Accept
                </button>
              </div>
            </div>
          )}
        </div>

        {/* On-screen Controls */}
        <div className="mt-8 flex flex-col items-center gap-4 lg:hidden">
          <div className="flex flex-col items-center gap-2">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                const s = stateRef.current;
                if (s.dir !== "DOWN") s.nextDir = "UP";
              }}
              className="w-16 h-16 rounded-2xl bg-[#0D131C] border border-white/5 flex items-center justify-center text-white active:bg-olos-blue active:scale-90 transition-all shadow-xl"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
            <div className="flex gap-2">
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  const s = stateRef.current;
                  if (s.dir !== "RIGHT") s.nextDir = "LEFT";
                }}
                className="w-16 h-14 rounded-2xl bg-[#0D131C] border border-white/5 flex items-center justify-center text-white active:bg-olos-blue active:scale-90 transition-all shadow-xl"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  const s = stateRef.current;
                  if (s.dir !== "UP") s.nextDir = "DOWN";
                }}
                className="w-16 h-14 rounded-2xl bg-[#0D131C] border border-white/5 flex items-center justify-center text-white active:bg-olos-blue active:scale-90 transition-all shadow-xl"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  const s = stateRef.current;
                  if (s.dir !== "LEFT") s.nextDir = "RIGHT";
                }}
                className="w-16 h-14 rounded-2xl bg-[#0D131C] border border-white/5 flex items-center justify-center text-white active:bg-olos-blue active:scale-90 transition-all shadow-xl"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-6">
          <div className="flex gap-4">
            <button
              onClick={() => {
                if (mode === "1v1" && matchStatus === "active") {
                  setShowForfeitConfirm(true);
                }
              }}
              disabled={matchStatus !== "active" || mode !== "1v1"}
              className="px-10 py-3 rounded-xl border border-red-500/30 text-red-500 text-[13px] font-black flex items-center gap-3 hover:bg-red-500/10 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              Cancel Game
            </button>
            <button
              onClick={() => {
                if (mode === "Solo") reset();
                else handleRematchRequest();
              }}
              disabled={
                mode === "1v1" &&
                (matchStatus === "active" ||
                  rematchStatus === "pending" ||
                  rematchStatus === "accepted")
              }
              className="px-10 py-3 rounded-xl border border-white/10 text-white text-[13px] font-black flex items-center gap-3 hover:bg-white/5 transition-all active:scale-95 disabled:opacity-50"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              {rematchStatus === "pending"
                ? "Pending..."
                : mode === "1v1"
                  ? "Request Rematch"
                  : "Reset"}
            </button>
          </div>

          {/* Forfeit Confirmation Modal */}
          {showForfeitConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-300">
              <div className="bg-[#0D131C] border border-white/10 rounded-[32px] p-8 w-full max-w-[400px] text-center shadow-2xl shadow-black relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50" />
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-6">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3 className="text-xl font-black text-white mb-2">
                  Forfeit Match?
                </h3>
                <p className="text-gray-400 text-sm font-medium mb-8 leading-relaxed">
                  Are you sure you want to cancel? You will{" "}
                  <span className="text-red-500 font-bold">
                    lose your stake
                  </span>{" "}
                  and the game will be forfeited to your opponent.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleForfeit}
                    disabled={isForfeiting}
                    className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-black transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isForfeiting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Yes, Forfeit"
                    )}
                  </button>
                  <button
                    onClick={() => setShowForfeitConfirm(false)}
                    className="w-full py-4 rounded-xl border border-white/10 hover:bg-white/5 text-white text-sm font-black transition-all"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          )}

          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
            Use arrow keys or WASD to move
          </span>

          {/* Rules Section */}
          <div className="w-full max-w-[580px] bg-[#0D131C] border border-white/5 rounded-2xl p-8 mt-12 animate-fade-in">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-olos-blue/10 flex items-center justify-center text-olos-blue text-[10px]">
                ?
              </span>
              Game Rules
            </h3>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-1 h-1 rounded-full bg-olos-blue mt-2.5 shrink-0" />
                <div>
                  <h4 className="text-[11px] font-black text-olos-blue uppercase mb-1">
                    How to Play
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed font-medium">
                    Control the snake using Arrow keys or WASD. Eat the golden
                    coins to grow and increase your score.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-1 h-1 rounded-full bg-olos-blue mt-2.5 shrink-0" />
                <div>
                  <h4 className="text-[11px] font-black text-olos-blue uppercase mb-1">
                    1v1 Competition
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed font-medium">
                    In 1v1 mode, you compete for the highest score within the
                    time limit. If you hit a wall or yourself, you respawn after
                    5 seconds.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/5">
                <div className="w-1 h-1 rounded-full bg-red-500 mt-2.5 shrink-0" />
                <div>
                  <h4 className="text-[11px] font-black text-red-500 uppercase mb-1">
                    Winning
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed font-medium">
                    The player with the highest score at the end of the match
                    wins the total pot (minus 10% fee).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
