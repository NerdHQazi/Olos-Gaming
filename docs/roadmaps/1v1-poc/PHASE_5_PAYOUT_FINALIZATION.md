# Phase 5: Payout Finalization

## Purpose

Finalize settlement behavior after authoritative match completion.

## Why It Exists

Financial outcomes must happen only after authoritative completion and must remain safe under retries or duplicated triggers.

## Relation to Director Demo

Supports full end-to-end completion proof, including final authoritative outcome effects.

## Requirements

- Settlement executes only from authoritative completion states.
- Idempotent payout ledger prevents duplicate payouts.
- Locked balances release and winner credit flow remain consistent.
- Payout observability supports audit and demo verification.

## Acceptance Criteria

- Exactly-once payout behavior for each match ID.
- No settlement on invalid or incomplete match states.
- Wallet and ledger outputs match deterministic expected results.

## Validation Requirements

- Before/after balance snapshots for settlement paths.
- Duplicate-trigger idempotency tests.
- Cross-check match result to payout ledger linkage.

## Exit Criteria

- Settlement behavior is reliable and audit-ready at POC confidence.

## Dependencies

- Phase 2 winner authority finalized.
- Phase 3 state machine constraints active.
- Phase 4 timeout/forfeit resolution integrated.
