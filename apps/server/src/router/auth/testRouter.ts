import { z } from "zod";
import { publicProcedure, router } from "../../lib/trpc";

export const testRouter = router({

  testPost: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/test/post",
      },
    })
    .input(z.object({ input: z.string() }))
    .output(z.object({ success: z.boolean(), message: z.string() }))
    .query(async ({ ctx, input }) => { // mutation for POST/PUT/DELETE
      const inp = JSON.stringify(input);
      const msg = ""

      console.log("redirecting...")

      // 307 is temp redirect
      // 302 is found
      // 308 is permanent redirect
      ctx.res?.redirect(308, "http://google.com");

      console.log("Test input", inp);
      return {
        success: true,
        message: msg
      }
    }),
})

export type TestRouter = typeof testRouter
