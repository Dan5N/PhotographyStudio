import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "pnpm db:seed:studio" },
  datasource: { url: process.env.DATABASE_URL },
});