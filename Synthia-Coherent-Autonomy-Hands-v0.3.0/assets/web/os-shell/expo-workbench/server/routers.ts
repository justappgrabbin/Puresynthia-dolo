import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { synthiaBridge } from "./synthia-bridge";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  synthia: router({
    release: publicProcedure.query(() => ({ ok: true, release: "Synthia r21.19 Native Klein Wired (archive/tests authoritative)" })),
    openProject: publicProcedure.input(z.object({ project: z.record(z.string(), z.unknown()) })).mutation(({ input }) => synthiaBridge.openProject(input.project as never)),
    inspect: publicProcedure.input(z.object({ artifact: z.record(z.string(), z.unknown()) })).mutation(({ input }) => synthiaBridge.inspect(input.artifact as never)),
    execute: publicProcedure.input(z.object({ artifact: z.record(z.string(), z.unknown()), input: z.unknown() })).mutation(({ input }) => synthiaBridge.execute(input.artifact as never, input.input)),
    applyMutation: publicProcedure.input(z.object({ project: z.record(z.string(), z.unknown()), change: z.unknown() })).mutation(({ input }) => synthiaBridge.applyMutation(input.project as never, input.change)),
    getState: publicProcedure.query(() => synthiaBridge.getState()),
    getTools: publicProcedure.input(z.object({ artifact: z.record(z.string(), z.unknown()).optional() }).optional()).query(({ input }) => synthiaBridge.getTools(input?.artifact as never)),
    validate: publicProcedure.input(z.object({ project: z.record(z.string(), z.unknown()) })).mutation(({ input }) => synthiaBridge.validate(input.project as never)),
  }),
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
