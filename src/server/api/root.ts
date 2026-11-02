import { createTRPCRouter } from "@/server/api/trpc";
import { userRouter } from "@/server/api/routers/user";
import { menuRouter } from "@/server/api/routers/menu";
import { roleRouter } from "@/server/api/routers/role";
import { studioRouter } from "@/server/api/routers/studio";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  studio: studioRouter,
  user: userRouter,
  menu: menuRouter,
  role: roleRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
