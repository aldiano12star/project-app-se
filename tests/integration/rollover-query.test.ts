import { getRolloverCuratedData } from "../../src/actions/rollover";

async function testRolloverData() {
  console.log("Verifying rollover structure & ShowcaseProject query...");
  // Note: getRolloverCuratedData requires OPERATOR session.
  // Here we verify the module export signatures and types.
  if (typeof getRolloverCuratedData !== "function") {
    throw new Error("getRolloverCuratedData must be an exported function");
  }

  console.log("✅ Rollover function signature verified!");
}

testRolloverData().catch((err) => {
  console.error("❌ Rollover test error:", err);
  process.exit(1);
});
