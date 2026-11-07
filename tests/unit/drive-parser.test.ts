import { parseGoogleDriveUrl } from "../../src/lib/drive-parser";

function runTest() {
  const sample1 = "https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i/view?usp=sharing";
  const result1 = parseGoogleDriveUrl(sample1);
  if (result1 !== "https://lh3.googleusercontent.com/d/1a2b3c4d5e6f7g8h9i") {
    throw new Error(`Test 1 Failed: Expected direct URL, got ${result1}`);
  }

  const sample2 = "https://drive.google.com/open?id=XYZ987654321";
  const result2 = parseGoogleDriveUrl(sample2);
  if (result2 !== "https://lh3.googleusercontent.com/d/XYZ987654321") {
    throw new Error(`Test 2 Failed: Expected direct URL, got ${result2}`);
  }

  const sample3 = "https://drive.google.com/uc?id=ABC123456789";
  const result3 = parseGoogleDriveUrl(sample3);
  if (result3 !== "https://lh3.googleusercontent.com/d/ABC123456789") {
    throw new Error(`Test 3 Failed: Expected direct URL, got ${result3}`);
  }

  // Multi-login URL (/file/u/0/d/...)
  const multiLoginSample = "https://drive.google.com/file/u/0/d/multiAccountFileId123/view";
  const multiLoginResult = parseGoogleDriveUrl(multiLoginSample);
  if (multiLoginResult !== "https://lh3.googleusercontent.com/d/multiAccountFileId123") {
    throw new Error(`Test Multi-Login Failed: Expected direct URL, got ${multiLoginResult}`);
  }

  // Short /d/{id} URL
  const shortDSample = "https://drive.google.com/d/shortDriveId999";
  const shortDResult = parseGoogleDriveUrl(shortDSample);
  if (shortDResult !== "https://lh3.googleusercontent.com/d/shortDriveId999") {
    throw new Error(`Test Short /d/ Failed: Expected direct URL, got ${shortDResult}`);
  }

  const normalUrl = "https://images.unsplash.com/photo-12345";
  if (parseGoogleDriveUrl(normalUrl) !== normalUrl) {
    throw new Error("Test 4 Failed: Normal URL should remain unchanged");
  }

  const emptyUrl = "";
  if (parseGoogleDriveUrl(emptyUrl) !== "") {
    throw new Error("Test 5 Failed: Empty string should remain empty string");
  }

  console.log("✅ drive-parser tests passed!");
}

runTest();
