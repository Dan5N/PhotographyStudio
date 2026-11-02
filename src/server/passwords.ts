import { randomBytes, scrypt as deriveKey, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(deriveKey);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, salt, digest] = encoded.split("$");
  if (algorithm !== "scrypt" || !salt || !digest || !/^[a-f0-9]{128}$/.test(digest)) return false;
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return timingSafeEqual(key, Buffer.from(digest, "hex"));
}