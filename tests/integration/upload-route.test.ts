import { handleUploadBuffer } from "../../src/app/api/upload/uploader";

async function runTest() {
  console.log("Running upload logic tests...");

  // Test 1: Non-image rejection
  try {
    await handleUploadBuffer(Buffer.from("dummy text"), "document.pdf", "application/pdf");
    throw new Error("Test 1 Failed: Should have rejected non-image MIME type");
  } catch (err: any) {
    if (!err.message.includes("Tipe berkas tidak didukung")) {
      throw new Error(`Test 1 Failed with unexpected error: ${err.message}`);
    }
  }

  // Test 2: Fallback when CLOUDINARY_URL is empty
  const originalEnv = process.env.CLOUDINARY_URL;
  delete process.env.CLOUDINARY_URL;

  const sampleImageBuffer = Buffer.from("fake-webp-image-data");
  const result = await handleUploadBuffer(sampleImageBuffer, "image.webp", "image/webp");

  if (!result.success || !result.url.startsWith("data:image/webp;base64,")) {
    throw new Error("Test 2 Failed: Fallback should produce a data URL");
  }

  // Restore env
  if (originalEnv) process.env.CLOUDINARY_URL = originalEnv;

  console.log("✅ upload logic tests passed!");
}

runTest().catch((e) => {
  console.error("❌ Test failed:", e);
  process.exit(1);
});
