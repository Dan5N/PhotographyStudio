import { access, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import { db } from "@/server/db";
import { assetRoot } from "@/server/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    await mkdir(assetRoot, { recursive: true });
    await access(assetRoot, constants.W_OK);
    return Response.json({ status: "ready" });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}