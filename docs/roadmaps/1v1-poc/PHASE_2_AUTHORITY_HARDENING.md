# Phase 2: Authority Hardening

## Purpose

Ensure backend becomes the source of truth for match outcomes and winner selection.

## Why It Exists

Realtime and gameplay updates are insufficient unless the backend, not clients, decides and records authoritative outcomes.

## Relation to Director Demo

Directly satisfies the Director expectation for server-authoritative winner selection and backend-validated end-to-end completion.

## Requirements

- Define authoritative outcome submission contract for both players.
- Validate payload integrity, participant identity, and match-state eligibility server-side.
- Add deterministic backend winner-resolution rules.
- Persist authoritative result and expose it to both clients via secure read path.
- Prevent client-only winner declarations from finalizing a match.

## Audit Findings: Authoritative Gameplay & Winner Decision Architecture

### 1. Authoritative Move Submission Pipeline

All board-game mutations flow through a two-tier authority boundary:
1. **Edge Function Validation Layer (`submit_game_move`):**
   - Validates caller authentication via Supabase JWT (`auth.getUser()`).
   - Verifies match state: `status = 'active'`, `resolution_state = 'none'`, `authoritative_gameplay_enabled = true`.
   - Derives player color and executes deterministic server-side rules:
     - **Chess:** `validateChessMove` (`_shared/chess-rules.ts`) enforces turn, piece geometry, obstacles, king in check, and terminal states (checkmate/stalemate).
     - **Checkers:** `validateCheckersMove` (`_shared/checkers-rules.ts`) enforces diagonal paths, mandatory multi-jumps, king promotion, and no-legal-moves terminal states.
   - Computes SHA-256 position hash on terminal outcomes.
   - Invokes `public.apply_validated_game_move` using `service_role` credentials.
2. **Database Mutation Layer (`public.apply_validated_game_move`):**
   - `SECURITY DEFINER` with search path `public, pg_temp`. Direct execution strictly revoked from `PUBLIC`, `anon`, and `authenticated`.
   - Serializes updates using `SELECT ... FOR UPDATE` on `matches`.
   - Enforces turn ownership: `IF current_turn <> p_player_id THEN RETURN 'Not your turn'`.
   - Move sequencing & replay protection: `IF expected_move_number <> game_move_number THEN RETURN 'Stale move'`.
   - Transitions `resolution_state` to `'pending'` on terminal moves, locking board moves and turn clocks.
   - Records audit event in `match_events` (`validated_move` or `validated_terminal_move`).

### 2. Terminal State & Winner Finalization Guard

1. **Receipt Verification (`public.submit_match_result`):**
   - Direct execution of `finalize_match_outcome` is revoked from clients.
   - Authenticated participants submit a receipt containing `terminal_position_hash` and `terminal_move_number`.
   - Database verifies the receipt strictly matches stored server values before inserting into `match_result_submissions` and invoking `finalize_match_outcome`.
2. **Dual-Path Resolution & Payout Routing (`finalize_match_outcome`):**
   - Idempotently verifies `status <> 'finished'`.
   - Decisive wins (`winner_id IS NOT NULL`) call `public.release_winnings(match_id, winner_id)`.
   - Stalemate / draws (`winner_id IS NULL`) call `public.settle_match_draw(match_id)` (deployed in Phase 5).
3. **Automated Timeout Sweeper (Phase 4):**
   - If a client fails to submit a receipt after a terminal move, the sweeper auto-finalizes the match after 45 seconds using the pre-recorded server-side `terminal_winner_id` and `terminal_reason`.

### 3. Game Type Breakdown & Authority Coverage

| Game Type | Move Engine Validation | Terminal State Authority | Bypass Possible? | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Chess** | Server-authoritative (`chess-rules.ts`) | Server-determined (`chess_checkmate`, `chess_stalemate`) | **No** | Full server validation; move numbers and hashes enforced. |
| **Checkers** | Server-authoritative (`checkers-rules.ts`) | Server-determined (`checkers_no_legal_moves`) | **No** | Full server validation; mandatory jumps enforced. |
| **Snake** | **Arcade Simulation (Client-side)** | Timer / Score comparison (`timer_expired`) | **Partial (Score manipulation risk)** | `submit_game_move` explicitly rejects Snake. Gameplay runs locally; apple collection is scored via `validate_apple_eaten(x, y)` which verifies coordinates against `current_apple_pos`. Path geometry and collision speed are not validated by a server engine. |

### 4. Migration Tracking Audit

* **Repository Status:** `supabase/migrations/20260814_phase2_perform_game_move_authority.sql` is currently **untracked in git** (`??`).
* **Live Database Status:** Verified against the connected Supabase PostgreSQL instance:
  - All columns added by `20260814` (`game_move_number`, `resolution_state`, `authoritative_gameplay_enabled`, `terminal_position_hash`, `terminal_move_number`, `terminal_reason`, `terminal_winner_id`) **are deployed and active**.
  - `public.match_result_submissions` table is deployed and active.
  - All permissions and revoked privileges on `apply_validated_game_move`, `finalize_match_outcome`, and `perform_game_move` are enforced.
* **Risk:** The local untracked migration file must be formally tracked/committed in git during release hygiene so fresh deployment environments can reproduce the database schema.

### 5. Remaining Risks & Remediation Plan

1. **Snake Arcade Model Hardening:**
   - *Risk:* Snake operates outside the `submit_game_move` authority pipeline. While apple coordinates are validated by `validate_apple_eaten`, rapid automated calls could theoretically inflate scores if a client intercepts apple coordinates.
   - *Remediation Plan:* Introduce minimum tick interval validation and server-side velocity clamping in `validate_apple_eaten` for competitive high-stake snake matches.
2. **Git Tracking Hygiene:**
   - *Risk:* 9 untracked migrations exist in `supabase/migrations/`.
   - *Remediation Plan:* Stage and commit the migration files when authorized by the operator.

## Acceptance Criteria

- Backend determines final winner under defined rules.
- Conflicting or asymmetric client submissions are handled deterministically.
- Unauthorized or malformed submissions are rejected with traceable errors.
- Authoritative match result is persisted and publishable to both players.
- Turn ownership, sequencing, and receipt verification prevent unilateral client outcomes.

## Validation Requirements

- Two-player test matrix covering matching, normal completion, conflicting submissions, and invalid submission attempts.
- SQL/API evidence that winner is backend-assigned.
- Realtime verification that authoritative result reaches both clients.

## Exit Criteria

- All authority decision paths are backend-controlled and validated.
- No client path can finalize winner state unilaterally.
- Demo sequence for authoritative winner selection is repeatable.

## Dependencies

- Phase 1 security boundaries complete and verified.
- Match schema supports authoritative result fields.
- Realtime channel and event structures available for result broadcast.
