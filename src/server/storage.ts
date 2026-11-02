import path from "node:path";
import sharp from "sharp";

export const assetRoot = path.resolve(process.env.ASSET_ROOT ?? ".studio-assets");
export const maximumFileSize = 5 * 1024 * 1024;

export async function validateImage(buffer: Buffer) {
  if (!buffer.length || buffer.length > maximumFileSize) throw new Error("Images must be between 1 byte and 5 MiB.");
  const image = sharp(buffer, { limitInputPixels: 40_000_000, failOn: "warning" });
  const metadata = await image.metadata();
  if (!["jpeg", "png"].includes(metadata.format ?? "")) throw new Error("Only valid JPEG and PNG images are accepted.");
  await image.stats();
  return metadata.format === "jpeg" ? "image/jpeg" : "image/png";
}