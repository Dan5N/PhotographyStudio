import { readFile } from "node:fs/promises";
import path from "node:path";
import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
import { assetRoot } from "@/server/storage";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();
  const user = session?.user.id ? await db.user.findUnique({ where: { id: session.user.id } }) : null;
  if (!user?.active) return new Response("Sign in required", { status: 401 });
  const { id } = await context.params;
  const asset = await db.storedAsset.findUnique({ where: { id }, include: { photo: { include: { order: { include: { appointment: true } }, task: true } }, version: { include: { task: true } } } });
  if (!asset) return new Response("Not found", { status: 404 });
  const office = ["MANAGER", "RECEPTION"].includes(user.role);
  const permitted = office || (user.role === "PHOTOGRAPHER" && asset.photo?.order.appointment?.photographerId === user.id) || (user.role === "RETOUCHER" && (asset.photo?.task?.assigneeId === user.id || asset.version?.task.assigneeId === user.id));
  if (!permitted) return new Response("Forbidden", { status: 403 });
  try {
    const content = await readFile(path.join(assetRoot, asset.key));
    return new Response(new Uint8Array(content), { headers: { "Content-Type": asset.mime, "Content-Length": String(content.length), "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Disposition": `${new URL(request.url).searchParams.has("download") ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(asset.originalName)}` } });
  } catch {
    return new Response("File unavailable", { status: 404 });
  }
}