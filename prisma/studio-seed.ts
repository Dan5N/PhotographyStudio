import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/server/passwords.ts";

const db = new PrismaClient();
try {
  const password = process.env.DEMO_PASSWORD;
  if (!password || password.length < 12) throw new Error("Set DEMO_PASSWORD with at least 12 characters.");
  for (const role of ["MANAGER", "RECEPTION", "PHOTOGRAPHER", "RETOUCHER"]) {
    const id = `demo-${role.toLowerCase()}`;
    const username = role === "MANAGER" ? "admin" : role.toLowerCase();
    const passwordHash = await hashPassword(role === "MANAGER" ? "123456" : password);
    await db.user.upsert({ where: { id }, update: role === "MANAGER" ? { username, password: passwordHash } : {}, create: { id, username, password: passwordHash, email: `${role.toLowerCase()}@studio.example`, role } });
    await db.role.upsert({ where: { roleKey: role }, update: {}, create: { roleKey: role, roleName: role, order: 1, status: "0" } });
    await db.roleMenu.upsert({ where: { id: `nav-${role}` }, update: {}, create: { id: `nav-${role}`, roleId: role, menuId: "/main" } });
  }
  await db.menu.upsert({ where: { key: "/main" }, update: {}, create: { label: "Studio", key: "/main", icon: "LayoutDashboard", order: 1, menuType: "M", status: "0" } });
  await db.customer.upsert({ where: { id: "demo-customer" }, update: {}, create: { id: "demo-customer", name: "Alex Chen", phone: "13800000000", email: "alex@example.com", notes: "Demonstration customer" } });
  await db.package.upsert({ where: { id: "demo-package" }, update: {}, create: { id: "demo-package", name: "Portrait Session", price: "680.00", retouchLimit: 3, revisionLimit: 2 } });
  console.log("Demo staff, customer and package initialized. Demo administrator credentials were reset; other existing records were preserved.");
} finally {
  await db.$disconnect();
}