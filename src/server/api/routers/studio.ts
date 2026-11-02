import { randomUUID } from "node:crypto";
import { OrderStage, Prisma } from "@prisma/client";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, managerProcedure } from "../trpc";
import { requireOffice, type Actor } from "@/server/permissions";
import { schedule, completeShoot, cancelOrder, selectPhotos, changeTask, sendDelivery, acknowledgeDelivery } from "@/server/workflow";

const officeProcedure = protectedProcedure.use(({ ctx, next }) => {
  requireOffice(ctx.session.user as Actor);
  return next({ ctx });
});
const customerInput = z.object({ name: z.string().trim().min(1).max(120), phone: z.string().trim().min(1).max(40), email: z.string().email().optional().or(z.literal("")), notes: z.string().max(4000).default(""), active: z.boolean().default(true) });
const packageInput = z.object({ name: z.string().trim().min(1).max(120), price: z.string().regex(/^\d{1,10}(\.\d{1,2})?$/), retouchLimit: z.number().int().min(1).max(1000), revisionLimit: z.number().int().min(0).max(100), active: z.boolean().default(true) });
const orderId = z.object({ orderId: z.string().min(1) });

export const studioRouter = createTRPCRouter({
  customers: officeProcedure.query(({ ctx }) => ctx.db.customer.findMany({ orderBy: { createdAt: "desc" }, take: 100 })),
  saveCustomer: officeProcedure.input(customerInput.extend({ id: z.string().optional() })).mutation(({ ctx, input }) => {
    const { id, ...data } = input;
    const record = { name: data.name, phone: data.phone, notes: data.notes, email: data.email || null, active: data.active };
    return id ? ctx.db.customer.update({ where: { id }, data: record }) : ctx.db.customer.create({ data: record });
  }),
  packages: officeProcedure.query(({ ctx }) => ctx.db.package.findMany({ orderBy: { createdAt: "desc" }, take: 100 })),
  savePackage: officeProcedure.input(packageInput.extend({ id: z.string().optional() })).mutation(({ ctx, input }) => {
    const { id } = input;
    const data = { name: input.name, price: new Prisma.Decimal(input.price), retouchLimit: input.retouchLimit, revisionLimit: input.revisionLimit, active: input.active };
    return id ? ctx.db.package.update({ where: { id }, data }) : ctx.db.package.create({ data });
  }),
  staff: officeProcedure.query(({ ctx }) => ctx.db.user.findMany({ where: { active: true }, select: { id: true, username: true, role: true } })),
  createOrder: officeProcedure.input(z.object({ customerId: z.string(), packageId: z.string(), requirements: z.string().trim().min(1).max(4000), deadline: z.date() })).mutation(async ({ ctx, input }) => {
    if (input.deadline <= new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "Delivery deadline must be in the future." });
    return ctx.db.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
      const pack = await tx.package.findUnique({ where: { id: input.packageId } });
      if (!customer?.active || !pack?.active) throw new TRPCError({ code: "BAD_REQUEST", message: "Select an active customer and package." });
      return tx.studioOrder.create({ data: { customerId: customer.id, packageId: pack.id, requirements: input.requirements, deadline: input.deadline, number: `PS-${randomUUID()}`, packageName: pack.name, price: pack.price, retouchLimit: pack.retouchLimit, revisionLimit: pack.revisionLimit, currency: process.env.APP_CURRENCY ?? "CNY" } });
    });
  }),
  orders: protectedProcedure.input(z.object({ search: z.string().max(100).default(""), stage: z.nativeEnum(OrderStage).optional(), page: z.number().int().min(1).default(1) }).default({})).query(async ({ ctx, input }) => {
    const actor = ctx.session.user;
    const scope: Prisma.StudioOrderWhereInput = actor.role === "PHOTOGRAPHER" ? { appointment: { photographerId: actor.id } } : actor.role === "RETOUCHER" ? { tasks: { some: { assigneeId: actor.id } } } : ["MANAGER", "RECEPTION"].includes(actor.role) ? {} : { id: "__denied__" };
    const where: Prisma.StudioOrderWhereInput = { AND: [scope, { stage: input.stage }, { OR: [{ number: { contains: input.search, mode: "insensitive" } }, { customer: { name: { contains: input.search, mode: "insensitive" } } }] }] };
    const records = await ctx.db.studioOrder.findMany({ where, orderBy: { createdAt: "desc" }, skip: (input.page - 1) * 20, take: 20, select: { id: true, number: true, stage: true, deadline: true, packageName: true, ...(actor.role === "MANAGER" || actor.role === "RECEPTION" ? { customer: { select: { name: true } } } : {}) } });
    return { records, total: await ctx.db.studioOrder.count({ where }) };
  }),
  order: protectedProcedure.input(orderId).query(async ({ ctx, input }) => {
    const actor = ctx.session.user;
    const scope: Prisma.StudioOrderWhereInput = actor.role === "PHOTOGRAPHER"
      ? { appointment: { photographerId: actor.id } }
      : actor.role === "RETOUCHER"
        ? { tasks: { some: { assigneeId: actor.id } } }
        : ["MANAGER", "RECEPTION"].includes(actor.role)
          ? {}
          : { id: "__denied__" };
    return ctx.db.studioOrder.findFirstOrThrow({ where: { AND: [{ id: input.orderId }, scope] }, include: { customer: true, appointment: true, photos: { include: { asset: { select: { id: true, originalName: true } } } }, selection: { include: { items: true } }, tasks: { include: { versions: { include: { asset: { select: { id: true, originalName: true } } }, orderBy: { number: "desc" } }, requests: true } }, delivery: { include: { items: true } } } });
  }),
  myShoots: protectedProcedure.query(({ ctx }) => ctx.db.appointment.findMany({ where: { photographerId: ctx.session.user.id }, include: { order: { select: { number: true, requirements: true, stage: true, deadline: true, customer: { select: { name: true } }, photos: { select: { id: true, assetId: true } } } } }, orderBy: { startsAt: "asc" }, take: 100 })),
  myTasks: protectedProcedure.query(({ ctx }) => ctx.db.retouchTask.findMany({ where: { assigneeId: ctx.session.user.id }, include: { order: { select: { number: true, stage: true } }, photo: { select: { assetId: true } }, versions: { select: { id: true, number: true, assetId: true }, orderBy: { number: "desc" } }, requests: true }, take: 100 })),
  schedule: officeProcedure.input(orderId.extend({ photographerId: z.string(), startsAt: z.date(), endsAt: z.date(), reason: z.string().max(2000).optional() })).mutation(({ ctx, input }) => schedule(ctx.db, ctx.session.user as Actor, input as Parameters<typeof schedule>[2])),
  completeShoot: protectedProcedure.input(orderId).mutation(({ ctx, input }) => completeShoot(ctx.db, ctx.session.user as Actor, input.orderId)),
  cancel: officeProcedure.input(orderId.extend({ reason: z.string().trim().min(1).max(2000) })).mutation(({ ctx, input }) => cancelOrder(ctx.db, ctx.session.user as Actor, input.orderId, input.reason)),
  select: officeProcedure.input(orderId.extend({ photoIds: z.array(z.string()).max(1000), confirm: z.boolean(), summary: z.string().max(4000) })).mutation(({ ctx, input }) => selectPhotos(ctx.db, ctx.session.user as Actor, input as Parameters<typeof selectPhotos>[2])),
  task: protectedProcedure.input(z.object({ taskId: z.string(), action: z.enum(["assign", "start", "request", "approve"]), assigneeId: z.string().optional(), deadline: z.date().optional(), summary: z.string().max(4000).optional(), versionId: z.string().optional() })).mutation(({ ctx, input }) => changeTask(ctx.db, ctx.session.user as Actor, input as Parameters<typeof changeTask>[2])),
  send: officeProcedure.input(orderId.extend({ channel: z.string().trim().min(1).max(100), reference: z.string().trim().min(1).max(1000) })).mutation(({ ctx, input }) => sendDelivery(ctx.db, ctx.session.user as Actor, input as Parameters<typeof sendDelivery>[2])),
  acknowledge: officeProcedure.input(orderId.extend({ summary: z.string().trim().min(1).max(4000) })).mutation(({ ctx, input }) => acknowledgeDelivery(ctx.db, ctx.session.user as Actor, input.orderId, input.summary)),
  audit: managerProcedure.input(z.object({ targetId: z.string().optional() }).default({})).query(({ ctx, input }) => ctx.db.auditEvent.findMany({ where: { targetId: input.targetId }, orderBy: { createdAt: "desc" }, take: 100 })),
  reports: managerProcedure.query(async ({ ctx }) => ({ stages: await ctx.db.studioOrder.groupBy({ by: ["stage"], _count: true }), overdue: await ctx.db.studioOrder.count({ where: { stage: { notIn: ["DELIVERED", "CANCELLED"] }, deadline: { lt: new Date() } } }), tasks: await ctx.db.retouchTask.groupBy({ by: ["assigneeId"], where: { status: { not: "APPROVED" } }, _count: true }), shoots: await ctx.db.appointment.groupBy({ by: ["photographerId"], where: { status: "SCHEDULED" }, _count: true }) })),
});