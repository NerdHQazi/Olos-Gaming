import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { initialChessBoard, validateChessMove, type Square as ChessSquare } from "../_shared/chess-rules.ts";
import { initialCheckersBoard, validateCheckersMove, type Square as CheckersSquare } from "../_shared/checkers-rules.ts";
import { computeChessSystemReply, computeCheckersSystemReply } from "../_shared/system-move-reply.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function parseSquare(value: unknown): [number, number] {
  if (!Array.isArray(value) || value.length !== 2 || !value.every(Number.isInteger)) {
    throw new Error("from and to must be two integer coordinates");
  }
  return [value[0], value[1]];
}

async function hashPosition(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value)));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!url || !anonKey || !serviceRoleKey) throw new Error("Server configuration is incomplete");

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: request.headers.get("Authorization") ?? "" } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const { match_id: matchId, from, to, expected_move_number: expectedMoveNumber } = await request.json();
    if (typeof matchId !== "string" || !Number.isInteger(expectedMoveNumber)) {
      throw new Error("match_id and expected_move_number are required");
    }
    const fromSquare = parseSquare(from);
    const toSquare = parseSquare(to);

    const serviceClient = createClient(url, serviceRoleKey);
    const { data: match, error: matchError } = await serviceClient
      .from("matches")
      .select("id, player1_id, player2_id, game_type, status, resolution_state, authoritative_gameplay_enabled, board_state")
      .eq("id", matchId)
      .single();
    if (matchError || !match) throw new Error("Match not found");
    if (match.status !== "active" || match.resolution_state !== "none") throw new Error("Match is not accepting moves");
    if (user.id !== match.player1_id && user.id !== match.player2_id) throw new Error("Player not in match");
    if (!match.authoritative_gameplay_enabled) throw new Error("Legacy match cannot enter authoritative gameplay");

    const gameType = String(match.game_type).toLowerCase();
    let board: unknown;
    let nextPlayerId: string;
    let terminalReason: string | null = null;
    let terminalWinnerId: string | null = null;

    if (gameType === "chess") {
      const color = user.id === match.player1_id ? "w" : "b";
      const validated = validateChessMove(match.board_state ?? initialChessBoard(), color, fromSquare as ChessSquare, toSquare as ChessSquare);
      board = validated.board;
      nextPlayerId = validated.nextColor === "w" ? match.player1_id : match.player2_id;
      terminalReason = validated.terminal?.reason ?? null;
      terminalWinnerId = validated.terminal?.winnerColor === "w" ? match.player1_id : validated.terminal?.winnerColor === "b" ? match.player2_id : null;
    } else if (gameType === "checkers") {
      const color = user.id === match.player1_id ? "red" : "black";
      const validated = validateCheckersMove(match.board_state ?? initialCheckersBoard(), color, fromSquare as CheckersSquare, toSquare as CheckersSquare);
      board = validated.board;
      nextPlayerId = validated.nextColor === "red" ? match.player1_id : match.player2_id;
      terminalReason = validated.terminal?.reason ?? null;
      terminalWinnerId = validated.terminal?.winnerColor === "red" ? match.player1_id : validated.terminal?.winnerColor === "black" ? match.player2_id : null;
    } else {
      throw new Error("Unsupported game type");
    }

    const terminalPositionHash = terminalReason ? await hashPosition(board) : null;
    const { data, error } = await serviceClient.rpc("apply_validated_game_move", {
      p_match_id: matchId,
      p_player_id: user.id,
      p_expected_move_number: expectedMoveNumber,
      p_board_state: board,
      p_next_turn: nextPlayerId,
      p_terminal_reason: terminalReason,
      p_terminal_winner_id: terminalWinnerId,
      p_terminal_position_hash: terminalPositionHash,
      p_move_payload: { from: fromSquare, to: toSquare, game_type: gameType },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    const systemUserId = Deno.env.get("SYSTEM_USER_ID");
    if (!systemUserId || terminalReason || nextPlayerId !== systemUserId) {
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (systemUserId !== match.player1_id && systemUserId !== match.player2_id) {
      throw new Error("Configured System account is not a match participant");
    }

    const systemIsPlayer1 = systemUserId === match.player1_id;
    let systemReply;
    if (gameType === "chess") {
      systemReply = computeChessSystemReply(board, systemIsPlayer1 ? "w" : "b");
    } else if (gameType === "checkers") {
      systemReply = computeCheckersSystemReply(board, systemIsPlayer1 ? "red" : "black");
    } else {
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!systemReply) throw new Error("System has no legal move after an active human move");

    const systemNextPlayerId = systemReply.nextColor === "w" || systemReply.nextColor === "red"
      ? match.player1_id
      : match.player2_id;
    const systemTerminalReason = systemReply.terminal?.reason ?? null;
    const systemTerminalWinnerId = systemReply.terminal?.winnerColor === "w" || systemReply.terminal?.winnerColor === "red"
      ? match.player1_id
      : systemReply.terminal?.winnerColor === "b" || systemReply.terminal?.winnerColor === "black"
        ? match.player2_id
        : null;
    const systemTerminalPositionHash = systemTerminalReason ? await hashPosition(systemReply.board) : null;
    const { data: systemData, error: systemError } = await serviceClient.rpc("apply_validated_game_move", {
      p_match_id: matchId,
      p_player_id: systemUserId,
      p_expected_move_number: expectedMoveNumber + 1,
      p_board_state: systemReply.board,
      p_next_turn: systemNextPlayerId,
      p_terminal_reason: systemTerminalReason,
      p_terminal_winner_id: systemTerminalWinnerId,
      p_terminal_position_hash: systemTerminalPositionHash,
      p_move_payload: { from: systemReply.from, to: systemReply.to, game_type: gameType, actor: "system" },
    });
    if (systemError) throw systemError;
    if (systemData?.error) throw new Error(systemData.error);

    return new Response(JSON.stringify({ ...systemData, system_move: { from: systemReply.from, to: systemReply.to } }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});