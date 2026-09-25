import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { validatePhoto } from "../src/lib/validation";
test("rejects truncated PNG headers and payloads above the deployed upload limit", async () => {
  assert.equal(
    await validatePhoto(
      new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
      "image/png",
    ),
    false,
  );
  const oversized = new Uint8Array(3145729);
  oversized.set([255, 216, 255]);
  assert.equal(await validatePhoto(oversized, "image/jpeg"), false);
});
test("accepts decodable JPEG PNG WebP and rejects mismatched MIME", async () => {
  const png = await sharp({
    create: { width: 8, height: 8, channels: 3, background: "#087e8b" },
  })
    .png()
    .toBuffer();
  assert.equal(await validatePhoto(png, "image/png"), true);
  assert.equal(await validatePhoto(png, "image/jpeg"), false);
  const jpeg = await sharp(png).jpeg().toBuffer();
  assert.equal(await validatePhoto(jpeg, "image/jpeg"), true);
  const webp = await sharp(png).webp().toBuffer();
  assert.equal(await validatePhoto(webp, "image/webp"), true);
});
