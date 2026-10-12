import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    BALL_LINEAR_DAMPING,
    ENGINE_VELOCITY_CAP,
    MAX_SHOT_SPEED,
    MIN_SHOT_SPEED,
    STOP_SPEED_THRESHOLD,
    WORLD_SCALE,
    ballSpeed,
    clampChargeRatio,
    computeShotSpeed,
    isBallStopped,
    toPhysics,
    toPixels,
} from "../src/game/shot.ts";

const MAX_PULLBACK = 150;
const BALL_DIAMETER_PX = 30;

describe("clampChargeRatio", () => {
    it("clamps below-zero pull-back to 0", () => {
        assert.equal(clampChargeRatio(-10, MAX_PULLBACK), 0);
    });

    it("clamps over-max pull-back to 1", () => {
        assert.equal(clampChargeRatio(MAX_PULLBACK + 50, MAX_PULLBACK), 1);
    });

    it("maps half pull-back to 0.5", () => {
        assert.equal(clampChargeRatio(MAX_PULLBACK / 2, MAX_PULLBACK), 0.5);
    });

    it("returns 0 for non-finite or degenerate inputs", () => {
        assert.equal(clampChargeRatio(NaN, MAX_PULLBACK), 0);
        assert.equal(clampChargeRatio(Infinity, MAX_PULLBACK), 0);
        assert.equal(clampChargeRatio(10, 0), 0);
        assert.equal(clampChargeRatio(10, -5), 0);
        assert.equal(clampChargeRatio(10, NaN), 0);
    });
});

describe("world-unit conversions", () => {
    it("toPhysics and toPixels round-trip", () => {
        assert.equal(toPixels(toPhysics(123.5)), 123.5);
        assert.equal(toPhysics(toPixels(7.25)), 7.25);
    });

    it("returns 0 for non-finite inputs", () => {
        assert.equal(toPhysics(NaN), 0);
        assert.equal(toPhysics(Infinity), 0);
        assert.equal(toPixels(NaN), 0);
        assert.equal(toPixels(-Infinity), 0);
    });
});

describe("computeShotSpeed", () => {
    it("minimum charge produces the gentle minimum speed", () => {
        assert.equal(computeShotSpeed(0, MAX_PULLBACK), MIN_SHOT_SPEED);
        assert.ok(MIN_SHOT_SPEED > 0 && MIN_SHOT_SPEED < 1000);
    });

    it("maximum charge is powerful yet safe for the engine", () => {
        assert.equal(computeShotSpeed(MAX_PULLBACK, MAX_PULLBACK), MAX_SHOT_SPEED);
        assert.ok(MAX_SHOT_SPEED > MIN_SHOT_SPEED);
        // Must stay below the engine's velocity-norm cap (in world units)
        // or full charge would be silently clipped and charge feel lost.
        assert.ok(toPhysics(MAX_SHOT_SPEED) < ENGINE_VELOCITY_CAP);
        // Full-power single-step travel must stay below the ball diameter
        // to avoid tunnelling through balls/cushions.
        assert.ok(MAX_SHOT_SPEED / 60 < BALL_DIAMETER_PX);
    });

    it("increasing charge never decreases shot strength", () => {
        let previous = computeShotSpeed(0, MAX_PULLBACK);
        for (let pull = 1; pull <= MAX_PULLBACK; pull += 1) {
            const current = computeShotSpeed(pull, MAX_PULLBACK);
            assert.ok(current >= previous, `pull=${pull}: ${current} < ${previous}`);
            previous = current;
        }
    });

    it("is deterministic for identical inputs", () => {
        assert.equal(
            computeShotSpeed(77, MAX_PULLBACK),
            computeShotSpeed(77, MAX_PULLBACK),
        );
    });

    it("gives clearly separated light/medium/full speeds", () => {
        const light = computeShotSpeed(MAX_PULLBACK * 0.1, MAX_PULLBACK);
        const medium = computeShotSpeed(MAX_PULLBACK * 0.5, MAX_PULLBACK);
        const full = computeShotSpeed(MAX_PULLBACK, MAX_PULLBACK);
        assert.ok(light < medium && medium < full);
        assert.ok(full - light > 500);
    });

    it("never produces NaN, infinity, or negative speed", () => {
        const cases: Array<[number, number]> = [
            [0, MAX_PULLBACK],
            [MAX_PULLBACK, MAX_PULLBACK],
            [-20, MAX_PULLBACK],
            [9999, MAX_PULLBACK],
            [NaN, MAX_PULLBACK],
            [50, 0],
            [50, NaN],
            [Infinity, Infinity],
        ];
        for (const [pull, max] of cases) {
            const speed = computeShotSpeed(pull, max);
            assert.ok(Number.isFinite(speed), `pull=${pull} max=${max}: ${speed}`);
            assert.ok(speed >= 0, `pull=${pull} max=${max}: ${speed}`);
            assert.ok(
                speed >= MIN_SHOT_SPEED && speed <= MAX_SHOT_SPEED,
                `pull=${pull} max=${max}: ${speed}`,
            );
        }
    });
});

describe("stopping behaviour", () => {
    it("ballSpeed computes vector magnitude", () => {
        assert.equal(ballSpeed(3, 4), 5);
        assert.equal(ballSpeed(0, 0), 0);
    });

    it("treats a nearly stationary ball as stopped (world-unit inputs)", () => {
        // 0.5 units/s = 2px/s at WORLD_SCALE 0.25: well below threshold.
        assert.ok(isBallStopped(0.3, 0.4));
        // Boundary documents the strict `<`: exactly at the threshold is
        // not snapped, anything below it is.
        const atThreshold = STOP_SPEED_THRESHOLD * WORLD_SCALE;
        assert.ok(!isBallStopped(atThreshold, 0));
    });

    it("treats a visibly moving ball as not stopped", () => {
        assert.ok(!isBallStopped(toPhysics(30), toPhysics(40)));
        assert.ok(!isBallStopped(toPhysics(MIN_SHOT_SPEED), 0));
        assert.ok(!isBallStopped(toPhysics(MAX_SHOT_SPEED), 0));
    });

    it("stop threshold is imperceptible so snapping never freezes visible motion", () => {
        // 8px/s is ~0.13px per frame at 60fps.
        assert.ok(STOP_SPEED_THRESHOLD / 60 < 0.5);
    });
});

describe("tuning constants", () => {
    it("damping is positive so balls always settle", () => {
        assert.ok(BALL_LINEAR_DAMPING > 0);
    });
});
