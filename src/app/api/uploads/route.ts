import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";
import { assetRoot, maximumFileSize, validateImage } from "@/server/storage";
import { orderTransaction } from "@/server/workflow";
import { requireAssigned } from "@/server/permissions";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  const user = session?.user.id ? await db.user.findUnique({ where: { id: session.user.id } }) : null;
  if (!user?.active) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (request.headers.get("origin") !== new URL(process.env.NEXTAUTH_URL ?? request.url).origin) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? maximumFileSize + 65537) > maximumFileSize + 65536) return Response.json({ error: "Image exceeds 5 MiB." }, { status: 413 });
  let storedPath: string | undefined;
  try {
    const form = await request.formData();
    const file = form.get("file");
    const target = String(form.get("target") ?? "");
    const kind = String(form.get("kind") ?? "");
    if (!(file instanceof File) || !target || !["original", "version"].includes(kind)) throw new Error("Choose an image and a valid destination.");
    if (file.size > maximumFileSize) throw new Error("Image exceeds 5 MiB.");
    const task = kind === "version" ? await db.retouchTask.findUniqueOrThrow({ where: { id: target } }) : null;
    const orderId = task?.orderId ?? target;
    if (task) requireAssigned(user, "RETOUCHER", task.assigneeId);
    else {
      const appointment = await db.appointment.findUniqueOrThrow({ where: { orderId } });
      requireAssigned(user, "PHOTOGRAPHER", appointment.photographerId);
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = await validateImage(buffer);
    const key = randomUUID();
    await mkdir(assetRoot, { recursive: true });
    storedPath = path.join(assetRoot, key);
    await writeFile(storedPath, buffer, { flag: "wx" });
    const result = await orderTransaction(db, orderId, async (tx) => {
      const data = { key, mime, size: buffer.length, originalName: path.basename(file.name).slice(0, 250), uploaderId: user.id };
      const activeUser = await tx.user.findUniqueOrThrow({ where: { id: user.id } });
      if (!activeUser.active) throw new Error("Account is inactive.");
      if (kind === "original") {
        const appointment = await tx.appointment.findUniqueOrThrow({ where: { orderId } });
        requireAssigned(activeUser, "PHOTOGRAPHER", appointment.photographerId);
        const selection = await tx.selection.findUnique({ where: { orderId } });
        if (selection?.confirmedAt) throw new Error("Confirmed selection is frozen.");
        return tx.photo.create({ data: { order: { connect: { id: orderId } }, asset: { create: data } }, select: { id: true, assetId: true } });
      }
      const current = await tx.retouchTask.findUniqueOrThrow({ where: { id: target }, include: { versions: { orderBy: { number: "desc" }, take: 1 }, requests: { where: { resolvedAt: null } } } });
      requireAssigned(activeUser, "RETOUCHER", current.assigneeId);
      if (!["IN_PROGRESS", "CHANGES_REQUESTED"].includes(current.status) || !current.deadline) throw new Error("Start the assigned task or respond to requested changes before submitting.");
      const version = await tx.photoVersion.create({ data: { task: { connect: { id: current.id } }, number: (current.versions[0]?.number ?? 0) + 1, submitterId: user.id, asset: { create: data } }, select: { id: true, number: true, assetId: true } });
      if (current.status === "CHANGES_REQUESTED") {
        const revision = current.requests[0];
        if (!revision) throw new Error("No unresolved revision request exists.");
        await tx.revisionRequest.update({ where: { id: revision.id }, data: { responseVersionId: version.id, resolvedAt: new Date() } });
      }
      await tx.retouchTask.update({ where: { id: current.id }, data: { status: "SUBMITTED" } });
      return version;
    });
    storedPath = undefined;
    return Response.json(result, { status: 201 });
  } catch (error) {
    if (storedPath) await unlink(storedPath).catch(() => undefined);
    return Response.json({ error: error instanceof Error && !error.message.includes("prisma") ? error.message : "Upload rejected." }, { status: 400 });
  }
}