import { z } from "zod";
import {
  createTRPCRouter,
  managerProcedure,
} from "@/server/api/trpc";
import { hashPassword } from "@/server/passwords";
import { staffRoles } from "@/server/permissions";
import { TRPCError } from "@trpc/server";

const safeUser = { id: true, username: true, email: true, role: true, active: true, editable: true, image: true, emailVerified: true } as const;

export const userRouter = createTRPCRouter({
  register: managerProcedure
    .input(
      z.object({
        username: z.string().trim().min(2).max(80),
        password: z.string().min(12).max(128),
        email: z.string().email(),
        role: z.enum(staffRoles),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.create({
        data: { username: input.username, email: input.email, role: input.role, password: await hashPassword(input.password) },
        select: safeUser,
      });
    }),
  getUserList: managerProcedure
    .input(
      z.object({
        pageSize: z.number().int().min(1).max(100),
        pageNum: z.number().int().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const list = await ctx.db.user.findMany({
        select: safeUser,
        skip: input.pageSize * (input.pageNum - 1),
        take: input.pageSize,
      });
      const total = await ctx.db.user.count();
      return {
        list,
        total,
      };
    }),

  deleteUserById: managerProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.session.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot deactivate your own account." });
      const tasks = await ctx.db.retouchTask.count({ where: { assigneeId: input.id, status: { not: "APPROVED" } } });
      const shoots = await ctx.db.appointment.count({ where: { photographerId: input.id, status: "SCHEDULED" } });
      if (tasks + shoots > 0) throw new TRPCError({ code: "CONFLICT", message: "Reassign unfinished work first." });
      return ctx.db.user.update({
        where: { id: input.id },
        data: { active: false },
        select: safeUser,
      });
    }),

  findUserById: managerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.db.user.findFirst({
        where: input,
        select: safeUser,
      });
    }),

  upDateUserById: managerProcedure
    .input(
      z.object({
        id: z.string(),
        username: z.string().trim().min(2).max(80),
        password: z.string().max(128),
        role: z.enum(staffRoles),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUniqueOrThrow({ where: { id: input.id } });
      if (existing.role !== input.role) {
        if (input.id === ctx.session.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot change your own role." });
        const tasks = await ctx.db.retouchTask.count({ where: { assigneeId: input.id, status: { not: "APPROVED" } } });
        const shoots = await ctx.db.appointment.count({ where: { photographerId: input.id, status: "SCHEDULED" } });
        if (tasks + shoots > 0) throw new TRPCError({ code: "CONFLICT", message: "Reassign unfinished work first." });
      }
      if (input.password && input.password.length < 12) throw new TRPCError({ code: "BAD_REQUEST", message: "Password must have at least 12 characters." });
      return ctx.db.user.update({
        where: {
          id: input.id,
        },
        data: { username: input.username, role: input.role, ...(input.password ? { password: await hashPassword(input.password) } : {}) },
        select: safeUser,
      });
    }),
});
