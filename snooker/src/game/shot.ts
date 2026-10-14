// Centralized tuning for the snooker shot and ball physics.
//
// Scale note: rendering, input, and pockets use pixels (table is ~1000px
// wide, ball radius is 15px); Rapier bodies live in scaled world units
// (WORLD_SCALE units per pixel), and Rapier linear velocity is in
// units/second. Convert at the physics boundary with toPhysics/toPixels.
//
// Two engine facts (both verified empirically against the project's
// @dimforge/rapier2d-compat 0.20.0 dependency) constrain the values below:
//  1. The engine clamps every rigid body's linear-velocity vector norm to
//     400 units/s on each step, preserving direction (verified for norms
//     401-50000, via both setLinvel and impulses). Rendering and input stay
//     in pixels, so physics runs in scaled world units: WORLD_SCALE converts
//     between them, mapping the 400 units/s cap to 1600 px/s.
//  2. Damping decays velocity exponentially, so travel distance is ~v0/d
//     and settle time is ~ln(v0/threshold)/d. BALL_LINEAR_DAMPING balances
//     a full-table powerful shot against a crisp stop. Damping is
//     time-based, so it is unaffected by the length-unit scale.

// Physics world units per pixel (1 unit = 4px). All Rapier positions,
// collider sizes, and velocities are stored in these units; rendering,
// input, and pockets stay in pixels. Convert at the boundary with
// toPhysics/toPixels (ball.ts, board.ts, stick.ts do this).
export const WORLD_SCALE = 0.25;

// Gentle tap: rolls ~250px, settles in ~5s free (faster with cushions/balls).
export const MIN_SHOT_SPEED = 150;
// Powerful snooker break: ~23px per 1/60s step (below the 30px ball
// diameter, so no tunnelling) and ~2300px of free roll plus cushion
// bounces. 1400 px/s = 350 units/s, safely below the 400 units/s cap.
export const MAX_SHOT_SPEED = 1600;

// Must stay below the engine's 400 units/s velocity-norm cap (see above).
export const ENGINE_VELOCITY_CAP = 400;
// Rapier linear damping for balls. Settles a full-power free roll in ~6s;
// collisions shorten this in practice. (0.5 left balls creeping ~9s.)
export const BALL_LINEAR_DAMPING = 1.0;
// A ball slower than this (px/s) is snapped to a full stop: 8px/s is
// ~0.13px per frame, i.e. imperceptible, so this never freezes visible
// motion but guarantees balls (and the turn handoff) settle crisply.
export const STOP_SPEED_THRESHOLD = 8;

// Clamp a raw pull-back amount to a 0-1 charge ratio. Guards against
// negative, NaN, infinite, or over-max inputs.
export function clampChargeRatio(
  pullBack: number,
  maxPullback: number,
): number {
  if (!Number.isFinite(pullBack) || !Number.isFinite(maxPullback)) {
    return 0;
  }
  if (maxPullback <= 0) {
    return 0;
  }
  const ratio = pullBack / maxPullback;
  if (ratio <= 0) {
    return 0;
  }
  if (ratio >= 1) {
    return 1;
  }
  return ratio;
}

// Map cue pull-back to a cue-ball launch speed (px/s). Linear: doubling the
// pull-back doubles the extra speed above the gentle minimum. The result
// always stays within [MIN_SHOT_SPEED, MAX_SHOT_SPEED], below the engine
// cap, so identical inputs always produce identical velocities.
export function computeShotSpeed(
  pullBack: number,
  maxPullback: number,
): number {
  const ratio = clampChargeRatio(pullBack, maxPullback);
  return MIN_SHOT_SPEED + ratio * (MAX_SHOT_SPEED - MIN_SHOT_SPEED);
}

// Magnitude of a 2D velocity vector. Units-agnostic: pass components in
// the same units and read back the magnitude in those units.
export function ballSpeed(vx: number, vy: number): number {
  if (!Number.isFinite(vx) || !Number.isFinite(vy)) {
    return 0;
  }
  return Math.sqrt(vx * vx + vy * vy);
}

// Pixels -> physics world units (positions, sizes, velocities).
export function toPhysics(pixels: number): number {
  if (!Number.isFinite(pixels)) {
    return 0;
  }
  return pixels * WORLD_SCALE;
}

// Physics world units -> pixels.
export function toPixels(units: number): number {
  if (!Number.isFinite(units)) {
    return 0;
  }
  return units / WORLD_SCALE;
}

// True when a ball is slow enough to count (and be snapped to) stopped.
// Takes a Rapier linear velocity (world units/s) and compares it against
// the pixel-space stop threshold.
export function isBallStopped(vx: number, vy: number): boolean {
  return toPixels(ballSpeed(vx, vy)) < STOP_SPEED_THRESHOLD;
}
