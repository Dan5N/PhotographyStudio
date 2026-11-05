import { type Prisma, type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { requireAssigned, requireOffice, type Actor } from "./permissions";

type Transaction = Prisma.TransactionClient;

function reject(message: string): never {
  throw new TRPCError({ code: "CONFLICT", message });
}

export async function orderTransaction<Result>(database: PrismaClient, orderId: string, work: (tx: Transaction) => Promise<Result>) {
  return database.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "StudioOrder" WHERE id = ${orderId} FOR UPDATE`;
    const order = await tx.studioOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new TRPCError({ code: "NOT_FOUND" });
    if (["CANCELLED", "DELIVERED", "AWAITING_ACKNOWLEDGEMENT"].includes(order.stage)) reject("This order is frozen.");
    return work(tx);
  });
}

async function audit(tx: Transaction, actor: Actor, targetId: string, action: string, detail: Prisma.InputJsonValue) {
  await tx.auditEvent.create({ data: { actorId: actor.id, targetId, action, detail } });
}

export async function schedule(database: PrismaClient, actor: Actor, input: { orderId: string; photographerId: string; startsAt: Date; endsAt: Date; reason?: string }) {
  requireOffice(actor);
  if (input.startsAt >= input.endsAt) reject("Appointment start must be before its end.");
  return orderTransaction(database, input.orderId, async (tx) => {
    const order = await tx.studioOrder.findUniqueOrThrow({ where: { id: input.orderId } });
    if (!["CREATED", "SCHEDULED"].includes(order.stage)) reject("Only an unfinished shoot can be scheduled.");
    const staff = await tx.user.findUnique({ where: { id: input.photographerId } });
    if (!staff?.active || staff.role !== "PHOTOGRAPHER") reject("Select an active photographer.");
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${input.photographerId}, 0))`;
    const previous = await tx.appointment.findUnique({ where: { orderId: input.orderId } });
    if (previous && !input.reason?.trim()) reject("A rescheduling reason is required.");
    const conflict = await tx.appointment.findFirst({ where: {
      photographerId: input.photographerId, status: { not: "CANCELLED" },
      orderId: { not: input.orderId }, startsAt: { lt: input.endsAt }, endsAt: { gt: input.startsAt },
    } });
    if (conflict) reject("The photographer has an overlapping appointment.");
    const data = { photographerId: input.photographerId, startsAt: input.startsAt, endsAt: input.endsAt };
    const appointment = await tx.appointment.upsert({ where: { orderId: input.orderId }, create: { orderId: input.orderId, ...data }, update: data });
    await tx.studioOrder.update({ where: { id: input.orderId }, data: { stage: "SCHEDULED" } });
    await audit(tx, actor, input.orderId, previous ? "RESCHEDULE" : "SCHEDULE", {
      reason: input.reason ?? "", before: previous ? { photographerId: previous.photographerId, start: previous.startsAt.toISOString(), end: previous.endsAt.toISOString() } : null,
      after: { ...data, startsAt: input.startsAt.toISOString(), endsAt: input.endsAt.toISOString() },
    });
    return appointment;
  });
}

export async function completeShoot(database: PrismaClient, actor: Actor, orderId: string) {
  return orderTransaction(database, orderId, async (tx) => {
    const appointment = await tx.appointment.findUniqueOrThrow({ where: { orderId } });
    requireAssigned(actor, "PHOTOGRAPHER", appointment.photographerId);
    if (appointment.status !== "SCHEDULED") reject("The shoot is not scheduled.");
    await tx.appointment.update({ where: { orderId }, data: { status: "COMPLETED", completedAt: new Date() } });
    await tx.studioOrder.update({ where: { id: orderId }, data: { stage: "AWAITING_SELECTION" } });
    await audit(tx, actor, orderId, "SHOOT_COMPLETED", {});
    return { success: true };
  });
}

export async function cancelOrder(database: PrismaClient, actor: Actor, orderId: string, reason: string) {
  requireOffice(actor);
  if (!reason.trim()) reject("A cancellation reason is required.");
  return orderTransaction(database, orderId, async (tx) => {
    const selection = await tx.selection.findUnique({ where: { orderId } });
    if (selection?.confirmedAt) reject("Confirmed selections cannot be cancelled.");
    await tx.appointment.updateMany({ where: { orderId, status: "SCHEDULED" }, data: { status: "CANCELLED" } });
    await tx.studioOrder.update({ where: { id: orderId }, data: { stage: "CANCELLED", cancellationReason: reason, cancelledAt: new Date() } });
    await audit(tx, actor, orderId, "CANCEL", { reason });
    return { success: true };
  });
}

export async function selectPhotos(database: PrismaClient, actor: Actor, input: { orderId: string; photoIds: string[]; confirm: boolean; summary: string }) {
  requireOffice(actor);
  return orderTransaction(database, input.orderId, async (tx) => {
    const order = await tx.studioOrder.findUniqueOrThrow({ where: { id: input.orderId } });
    const existing = await tx.selection.findUnique({ where: { orderId: input.orderId }, include: { items: true } });
    if (existing?.confirmedAt) {
      const same = input.photoIds.length === existing.items.length && existing.items.every((item) => input.photoIds.includes(item.photoId));
      if (input.confirm && same) return existing;
      reject("The confirmed selection is frozen.");
    }
    if (order.stage !== "AWAITING_SELECTION") reject("Complete the shoot before selecting originals.");
    if (new Set(input.photoIds).size !== input.photoIds.length) reject("Duplicate photos are not permitted.");
    if (input.photoIds.length > order.retouchLimit) reject("The selection exceeds the agreed allowance.");
    const count = await tx.photo.count({ where: { id: { in: input.photoIds }, orderId: input.orderId } });
    if (count !== input.photoIds.length) reject("Every selected original must belong to this order.");
    if (input.confirm && (!count || !input.summary.trim())) reject("Select at least one photo and record the customer communication.");
    const selection = await tx.selection.upsert({ where: { orderId: input.orderId }, create: { orderId: input.orderId }, update: {} });
    await tx.selectionItem.deleteMany({ where: { selectionId: selection.id } });
    await tx.selectionItem.createMany({ data: input.photoIds.map((photoId) => ({ selectionId: selection.id, photoId })) });
    if (input.confirm) {
      await tx.selection.update({ where: { id: selection.id }, data: { confirmedAt: new Date(), confirmedBy: actor.id, summary: input.summary } });
      await tx.retouchTask.createMany({ data: input.photoIds.map((photoId) => ({ orderId: input.orderId, photoId })) });
      await tx.studioOrder.update({ where: { id: input.orderId }, data: { stage: "RETOUCHING" } });
      await audit(tx, actor, input.orderId, "SELECTION_CONFIRMED", { photoIds: input.photoIds, summary: input.summary });
    }
    return tx.selection.findUniqueOrThrow({ where: { id: selection.id }, include: { items: true } });
  });
}

export async function changeTask(database: PrismaClient, actor: Actor, input: { taskId: string; action: "assign" | "start" | "request" | "approve"; assigneeId?: string; deadline?: Date; summary?: string; versionId?: string }) {
  const initial = await database.retouchTask.findUniqueOrThrow({ where: { id: input.taskId } });
  return orderTransaction(database, initial.orderId, async (tx) => {
    const task = await tx.retouchTask.findUniqueOrThrow({ where: { id: input.taskId }, include: { order: true, versions: { orderBy: { number: "desc" } }, requests: true } });
    if (task.status === "APPROVED") reject("Approved tasks cannot be changed.");
    const current = task.versions[0];
    if (input.action === "start") {
      requireAssigned(actor, "RETOUCHER", task.assigneeId);
      if (task.status !== "TODO" || !task.deadline) reject("The task must be assigned and scheduled before work starts.");
      return tx.retouchTask.update({ where: { id: task.id }, data: { status: "IN_PROGRESS" } });
    }
    requireOffice(actor);
    if (input.action === "assign") {
      const staff = input.assigneeId ? await tx.user.findUnique({ where: { id: input.assigneeId } }) : null;
      if (!staff?.active || staff?.role !== "RETOUCHER" || !input.deadline || input.deadline > task.order.deadline) reject("Choose an active retoucher and a task deadline no later than the order deadline.");
      if (task.assigneeId && !input.summary?.trim()) reject("A reassignment reason is required.");
      await audit(tx, actor, task.orderId, "TASK_ASSIGNED", { taskId: task.id, before: task.assigneeId, after: staff.id, deadline: input.deadline.toISOString(), reason: input.summary ?? "" });
      return tx.retouchTask.update({ where: { id: task.id }, data: { assigneeId: staff.id, deadline: input.deadline } });
    }
    if (!current) reject("No submitted version exists.");
    if (task.status !== "SUBMITTED" || current.id !== input.versionId || !input.summary?.trim()) reject("Review the current submitted version and record customer feedback.");
    if (input.action === "request") {
      if (task.requests.some((request) => !request.resolvedAt)) reject("Resolve the outstanding revision first.");
      if (task.requests.length >= task.order.revisionLimit) reject("The per-photo revision allowance is exhausted.");
      await tx.revisionRequest.create({ data: { taskId: task.id, versionId: current.id, feedback: input.summary, requestedBy: actor.id } });
      await audit(tx, actor, task.orderId, "REVISION_REQUESTED", { taskId: task.id, versionId: current.id, feedback: input.summary });
      return tx.retouchTask.update({ where: { id: task.id }, data: { status: "CHANGES_REQUESTED" } });
    }
    const approved = await tx.retouchTask.update({ where: { id: task.id }, data: { status: "APPROVED", approvedVersionId: current.id, approvedBy: actor.id, approvedAt: new Date(), approvalSummary: input.summary } });
    const outstanding = await tx.retouchTask.count({ where: { orderId: task.orderId, status: { not: "APPROVED" } } });
    if (!outstanding) await tx.studioOrder.update({ where: { id: task.orderId }, data: { stage: "READY_FOR_DELIVERY" } });
    await audit(tx, actor, task.orderId, "APPROVED", { taskId: task.id, versionId: current.id, summary: input.summary });
    return approved;
  });
}

export async function sendDelivery(database: PrismaClient, actor: Actor, input: { orderId: string; channel: string; reference: string }) {
  requireOffice(actor);
  return database.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "StudioOrder" WHERE id = ${input.orderId} FOR UPDATE`;
    const existing = await tx.delivery.findUnique({ where: { orderId: input.orderId } });
    if (existing) return existing;
    const order = await tx.studioOrder.findUniqueOrThrow({ where: { id: input.orderId }, include: { tasks: true, selection: { include: { items: true } } } });
    const selected = order.selection?.items ?? [];
    if (order.stage !== "READY_FOR_DELIVERY" || !selected.length || selected.length !== order.tasks.length || !selected.every((item) => order.tasks.some((task) => task.photoId === item.photoId && task.status === "APPROVED" && task.approvedVersionId))) reject("Delivery requires the exact fully approved confirmed selection.");
    const delivery = await tx.delivery.create({ data: {
      orderId: order.id, senderId: actor.id, channel: input.channel, reference: input.reference,
      items: { create: order.tasks.map((task) => ({ photoId: task.photoId, versionId: task.approvedVersionId })) },
    } });
    await tx.studioOrder.update({ where: { id: order.id }, data: { stage: "AWAITING_ACKNOWLEDGEMENT" } });
    await audit(tx, actor, order.id, "DELIVERY_SENT", { deliveryId: delivery.id, channel: input.channel, reference: input.reference });
    return delivery;
  });
}

export async function acknowledgeDelivery(database: PrismaClient, actor: Actor, orderId: string, summary: string) {
  requireOffice(actor);
  return database.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "StudioOrder" WHERE id = ${orderId} FOR UPDATE`;
    const delivery = await tx.delivery.findUnique({ where: { orderId } });
    if (!delivery) reject("Record successful delivery before acknowledgement.");
    if (delivery.acknowledgedAt) return delivery;
    const result = await tx.delivery.update({ where: { id: delivery.id }, data: { acknowledgedAt: new Date(), acknowledgedBy: actor.id, acknowledgementSummary: summary } });
    await tx.studioOrder.update({ where: { id: orderId }, data: { stage: "DELIVERED" } });
    await audit(tx, actor, orderId, "DELIVERY_ACKNOWLEDGED", { summary });
    return result;
  });
}