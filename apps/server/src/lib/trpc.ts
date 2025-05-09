import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { SESSION_COOKIE_NAME, UserSession, validateSessionToken } from "./auth/session";
import { getValueFromCookies } from "./cookie";
import superjson from 'superjson';

//make trpc endpoints exposable as REST endpoints
export const trpc = initTRPC.context<Context>().meta<OpenApiMeta>().create({transformer: superjson})
export const router = trpc.router

export const publicProcedure = trpc.procedure // open endpoints
export const protectedProcedure = publicProcedure.use(async (opts) => { // protected endpoints, 
  const { ctx } = opts;

  // console.log("opts: ", opts)

  // Context is created before this so if user doesn't exist, not authorized
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  // session cannot be null here

  return opts.next({ ctx: {...ctx } });
});

// Base router helpers
export const createTRPCRouter = trpc.router;
export const createCallerFactory = trpc.createCallerFactory;

// Procedure helpers

// Specify what you want Context to have here:
interface CreateContextOptions extends Partial<CreateExpressContextOptions> {
  session: UserSession | null,
}

/*
* Outer context: Will only be available in routers,
* includes req and res from router
*/
export const createTRPCContext = async (opts?: CreateExpressContextOptions) => {
  // here we can add stuff we want to share between requests
  // for example:
  // - database connection
  // - authentication info
  // - request specific info
  // ...

  let userSession: UserSession | null = null;

  if (opts && opts.req.cookies) {

    // req.cookies is provided by cookie-parser libarary middleware
    const cookies: Record<string, any> = opts.req.cookies
    const token: string | null = getValueFromCookies(cookies, SESSION_COOKIE_NAME);

    // console.log("Getting token from cookie", token)

    if (token) {
      userSession = await validateSessionToken(token);
      // console.log("user session found from token", userSession);
    } // if userId isn't set here, it will be null everywhere context exists
  } 

  // Use inner context to define this context
  // Pass in any opts needed according to CreateContextOptions
  const contextInner = await createInnerContext({ session: userSession })
  // console.log("session in context: ", contextInner.session)

  // Return inner context wrapped with req and res from request
  return {
    ...contextInner,
    req: opts?.req,
    res: opts?.res
  };
};


/*
Inner context: Will always be available in procedures,
useful for testing b/c don't need to mock req/res or for
serverSideHelpers (functions which can call
same server procedures) which don't have req/res.
*/
export const createInnerContext = async (opts?: CreateContextOptions)=> {
  if (opts?.session) {
    // console.log("Session is being set to: ", opts?.session)
  } else {
    console.log("Session was not passed")
  }
  return {
    ...opts
  }
}

export type Context = Awaited<ReturnType<typeof createInnerContext>>;
export type Router = typeof createTRPCRouter;