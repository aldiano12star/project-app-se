import assert from "node:assert";
import { easeOutQuart, calculateInterpolatedValue } from "../useCountUp";

console.log("Running useCountUp math & easing tests...");

// Test 1: easeOutQuart boundaries
assert.strictEqual(easeOutQuart(0), 0, "Progress 0 must yield 0");
assert.strictEqual(easeOutQuart(1), 1, "Progress 1 must yield 1");
assert.ok(easeOutQuart(0.5) > 0.5, "Easing should accelerate fast at start");
assert.strictEqual(easeOutQuart(0.5), 1 - Math.pow(0.5, 4));

// Test 2: calculateInterpolatedValue with positive target
const start = 0;
const target = 1000000;
assert.strictEqual(calculateInterpolatedValue(start, target, 0), 0);
assert.strictEqual(calculateInterpolatedValue(start, target, 1), 1000000);

// Test 3: calculateInterpolatedValue with negative target (deficit / tunggakan)
const negTarget = -50000;
assert.strictEqual(calculateInterpolatedValue(0, negTarget, 0), 0);
assert.strictEqual(calculateInterpolatedValue(0, negTarget, 1), -50000);
const midVal = calculateInterpolatedValue(0, negTarget, 0.5);
assert.ok(midVal < 0 && midVal >= -50000, "Interpolated negative value should be negative");

// Test 4: NaN and zero safety
assert.strictEqual(calculateInterpolatedValue(0, 0, 0.5), 0, "Zero target should yield 0");
assert.strictEqual(calculateInterpolatedValue(NaN, 100, 0.5), 100, "NaN start should fallback to target");
assert.strictEqual(calculateInterpolatedValue(0, NaN as any, 0.5), 0, "NaN target should fallback to 0");

console.log("All useCountUp math tests passed successfully!");
