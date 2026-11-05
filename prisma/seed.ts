import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { menus, roles, users, ruleMenus } from "./data";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 }) });

async function main() {
  await Promise.all(
    users.map(async (user) => {
      await prisma.user.create({
        data: user,
      });
    }),
  );

  await Promise.all(
    menus.map(async (menu) => {
      await prisma.menu.create({
        data: menu,
      });
    }),
  );

  await Promise.all(
    roles.map(async (role) => {
      await prisma.role.create({
        data: role,
      });
    }),
  );

  await Promise.all(
    ruleMenus.map(async (roleMenu) => {
      await prisma.roleMenu.create({
        data: roleMenu,
      });
    }),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
