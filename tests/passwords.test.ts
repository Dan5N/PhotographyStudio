import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPassword, verifyPassword } from "../src/server/passwords.ts";

test("password hashes are salted and verify only the correct password", async () => {
  const first = await hashPassword("example-password");
  const second = await hashPassword("example-password");
  assert.notEqual(first, second);
  assert.equal(await verifyPassword("example-password", first), true);
  assert.equal(await verifyPassword("incorrect", first), false);
  assert.equal(await verifyPassword("example-password", "invalid"), false);
});