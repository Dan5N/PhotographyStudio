import { TRPCError } from "@trpc/server";

export const staffRoles = ["MANAGER", "RECEPTION", "PHOTOGRAPHER", "RETOUCHER"] as const;
export type StaffRole = (typeof staffRoles)[number];
export type Actor = { id: string; role: string };

export function requireRole(actor: Actor, roles: readonly string[]): void {
  if (!roles.includes(actor.role)) throw new TRPCError({ code: "FORBIDDEN", message: "This action is not permitted for your role." });
}

export function requireOffice(actor: Actor): void {
  requireRole(actor, ["MANAGER", "RECEPTION"]);
}

export function requireAssigned(actor: Actor, role: StaffRole, assigneeId: string | null): void {
  if (actor.role !== role || actor.id !== assigneeId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only the assigned staff member may perform this action." });
  }
}