import assert from "node:assert";
import { haptic } from "../haptic";

console.log("Running haptic tests...");

// Test 1: SSR / Node environment safety without navigator.vibrate
assert.doesNotThrow(() => {
  haptic.tap();
  haptic.success();
  haptic.warning();
}, "haptic methods should not throw in SSR/Node environment without vibrate");

// Test 2: Browser environment simulation with navigator.vibrate
const calls: (number | number[])[] = [];

// Safely define vibrate on globalThis.navigator
Object.defineProperty(globalThis.navigator, "vibrate", {
  value: (pattern: number | number[]) => {
    calls.push(pattern);
    return true;
  },
  configurable: true,
  writable: true,
});

// Also define window
(globalThis as any).window = {};

haptic.tap();
assert.strictEqual(calls.length, 1);
assert.strictEqual(calls[0], 10, "tap should vibrate for 10ms");

haptic.success();
assert.strictEqual(calls.length, 2);
assert.deepStrictEqual(calls[1], [15, 40, 25], "success should vibrate with [15, 40, 25]");

haptic.warning();
assert.strictEqual(calls.length, 3);
assert.deepStrictEqual(calls[2], [20, 50, 20], "warning should vibrate with [20, 50, 20]");

console.log("All haptic tests passed successfully!");
