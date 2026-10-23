# Phase 3: Match State Machine

## Purpose

Create authoritative match lifecycle management.

## Why It Exists

Winner determination and payout correctness depend on valid transitions between lifecycle states.

## Relation to Director Demo

Ensures the demonstrated end-to-end flow progresses through clear backend-controlled states without ambiguous or invalid transitions.

## Requirements

- Define canonical states and allowed transitions (queued, active, reconnecting, finished, forfeited, canceled).
- Enforce transition guards in backend logic.
- Persist transition metadata for auditability.
- Reject invalid transition attempts from clients or duplicate events.

## Audit Findings & Lifecycle State Machine

### 1. Canonical State & Sub-State Definitions

A match progresses through two coordinated state dimensions:
- **Primary Lifecycle State (`matches.status`):**
  - `active`: Live gameplay in progress. Clocks tick, moves are accepted.
  - `reconnecting`: A participant has lost connection. Clock is paused; a 60-second grace period is tracked by `disconnect_deadline`.
  - `finished`: Terminal state. Match is conclusively ended, winner or draw is recorded, locked balances are released/settled.
  *(Note: `forfeited` was historically used in early migrations; in modern schema, forfeits transition directly to `finished` with `authority_resolution_reason = 'player_forfeit'` or `'disconnect_forfeit'`)*.
- **Resolution State Guard (`matches.resolution_state`):**
  - `none`: Normal active gameplay. Moves can be submitted.
  - `pending`: A move resulted in a terminal position (e.g. `chess_checkmate`, `chess_stalemate`, `checkers_no_legal_moves`). Clocks and moves are paused. Awaiting client receipt submission via `submit_match_result` (or auto-finalization by Phase 4 sweeper after 45 seconds).
  - `resolved`: Match outcome has been committed by `finalize_match_outcome`. Payouts and refunds have been dispatched.

### 2. Complete State Transition Matrix

| Current State (`status`, `resolution_state`) | Event / Action | Next State | Guard / Authority Check | Side Effects |
| :--- | :--- | :--- | :--- | :--- |
| `[Queue: searching]` | Matchmaking pair found (`find_opponent`) | `[active, none]` | Atomic transaction, bucket advisory lock | Stake locked in `wallets.locked_balance`, row created in `matches`. |
| `[Queue: searching]` | Player cancels (`cancel_matchmaking`) | `[Queue: cancelled]` | User advisory lock | Queue row deleted, stake refunded via `unlock_stake`. |
| `[active, none]` | Non-terminal move (`apply_validated_game_move`) | `[active, none]` | `current_turn = player`, `expected_move = current_move` | Board updated, `game_move_number` incremented, `current_turn` switched. |
| `[active, none]` | Terminal move (`apply_validated_game_move`) | `[active, pending]` | Verified terminal board hash and reason | `terminal_reason`, `terminal_winner_id`, `terminal_position_hash` recorded. |
| `[active, none]` | Client disconnect (`handle_player_disconnection`) | `[reconnecting, none]` | Caller is match participant, `status = 'active'` | `disconnect_deadline = NOW() + 60s`, `disconnected_player_id` recorded. |
| `[reconnecting, none]` | Player reconnects (`handle_player_reconnection`) | `[active, none]` | Caller is match participant, within deadline | `disconnect_deadline` and `disconnected_player_id` cleared. |
| `[reconnecting, none]` | Disconnect deadline expires | `[finished, resolved]` | Sweeper (`sweep_expired_matches`) | Opponent awarded win (`disconnect_forfeit`), `release_winnings` called. |
| `[active, none]` | Turn clock expires | `[finished, resolved]` | `update_game_timers` or `sweep_expired_matches` | Opponent awarded win (`timeout`), `release_winnings` called. |
| `[active, none]` | In-game surrender (`forfeit_match`) | `[finished, resolved]` | Caller is participant, `resolution_state <> 'pending'` | Opponent awarded win (`player_forfeit`), `release_winnings` called. |
| `[active, none]` | Abandoned first move (15m, 0 moves) | `[finished, resolved]` | Sweeper (`sweep_expired_matches`) | Settled as draw (`abandoned_first_move`), `settle_match_draw` called. |
| `[active, pending]` | Valid receipt submitted (`submit_match_result`) | `[finished, resolved]` | Receipt matches `terminal_position_hash` | `match_result_submissions` logged, `finalize_match_outcome` invoked. |
| `[active, pending]` | Receipt timeout (45s elapsed) | `[finished, resolved]` | Sweeper (`sweep_expired_matches`) | Auto-finalizes outcome via recorded `terminal_winner_id` and `terminal_reason`. |
| `[finished, resolved]` | Any subsequent move/forfeit/timer call | `[finished, resolved]` (No-op) | Row status check (`status = 'finished'`) | Blocked immediately with `already_finished` or `Match not active`. |

### 3. Confirmed Defects & Remediation Plan

1. **Defect: API Over-reporting of Unsettled Draws in `userController.js` (`getRecentMatches`)**
   - *Problem:* In `userController.js` lines 393–401, draw matches unconditionally reported `settled: true` and `stakeReturned: stakeAmount`, even when `match_payouts` contained no ledger record (e.g. historical draws or matches where settlement was pending/failed). This misinformed clients that funds were returned when they were actually still locked.
   - *Remediation:* Guard draw reward calculation by checking `payout || stakeAmount === 0`. If `payout` is missing and `stakeAmount > 0`, report `settled: false` and `stakeReturned: 0.0`, matching the established contract for decisive winner payouts.
2. **Defect: Missing Test Coverage for Unsettled Draw Matches**
   - *Problem:* Backend test suites only exercised settled draws with active `match_payouts` rows.
   - *Remediation:* Add regression tests in `recentMatches.test.js` validating that unsettled draws return `settled: false` and `stakeReturned: 0.0`.

## Acceptance Criteria

- State transitions occur only through allowed backend paths.
- Invalid transition attempts are blocked and logged.
- Match completion state is consistent with authoritative winner outcome.
- API representations of match status, outcomes, and rewards strictly mirror the database ledger.

## Validation Requirements

- Transition matrix tests for all valid/invalid paths.
- Replay/duplicate event tests to prove transition safety.
- Evidence of deterministic final state after completion.

## Exit Criteria

- Lifecycle behavior is deterministic and auditable.
- Transition-related race conditions for core paths are resolved to acceptable POC confidence.

## Dependencies

- Phase 2 authoritative winner logic in place.
- Realtime and event persistence primitives available.
