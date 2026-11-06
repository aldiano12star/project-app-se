import assert from "node:assert";
import { triggerMicroConfetti } from "../confetti";

console.log("Running confetti SSR & safety tests...");

// Test 1: SSR Environment safety (without window/document)
assert.doesNotThrow(() => {
  triggerMicroConfetti();
  triggerMicroConfetti({ originX: 0.5, originY: 0.7 });
}, "triggerMicroConfetti must not throw in SSR/Node without document");

console.log("Confetti safety tests passed successfully!");
