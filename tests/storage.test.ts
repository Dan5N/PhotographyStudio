import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import { maximumFileSize, validateImage } from "../src/server/storage";

test("valid PNG/JPEG content is accepted; spoofed, truncated and oversized images are rejected", async () => {
  const image = sharp({ create: { width: 16, height: 16, channels: 3, background: "#127a66" } });
  assert.equal(await validateImage(await image.png().toBuffer()), "image/png");
  assert.equal(await validateImage(await image.jpeg().toBuffer()), "image/jpeg");
  await assert.rejects(validateImage(Buffer.from("not an image")));
  await assert.rejects(validateImage(Buffer.alloc(maximumFileSize + 1)));
  await assert.rejects(validateImage(Buffer.alloc(0)));
  const valid = await image.png().toBuffer();
  await assert.rejects(validateImage(valid.subarray(0, 20)));
});