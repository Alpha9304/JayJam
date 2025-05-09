import { protectedProcedure, publicProcedure, router } from "../../lib/trpc";
import { z } from "zod"; //uses zod for input validation
import { loginUser, logoutUser, registerUser, resetPassword } from "../../lib/auth";
import { confirmPasswordSchema, emailSchema, loginSchema, registerSchema, resetPasswordSchema } from "../../validators/auth";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users, verificationCode } from "../../db/schema";
import { Resend } from "resend";
import dotenv from "dotenv";
import crypto from "crypto";
import { getUserUsingEmail } from "../../lib/auth/db";

dotenv.config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;


if(!RESEND_API_KEY){
  throw new TRPCError({code: 'FORBIDDEN', message: "Missing resend API key"})
}

const resend = new Resend(RESEND_API_KEY);

const BASE_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || `http://localhost:${process.env.PORT || '3002'}`;


export const authRouter = router({
  ping: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/auth/ping",
      },
    })
    .input(z.void())
    .output(z.object({
      userBasicInfo: z.object({ id: z.number(), email: z.string(), name: z.string(), pronouns: z.string(), major: z.string() }),
      userSession: z.string()
    }))
    .query(async ({ ctx }) => { // mutation for POST/PUT/DELETE
      const user = await getUserUsingEmail(ctx.session!.userEmail);

      if (!user) {
        throw new TRPCError({code: 'NOT_FOUND', message: "User not found by ping()"});
      }

      return {
        userBasicInfo: {id: user.id || 0, email: user.email || "", name: user.name || "", pronouns: user.pronouns || "", major: user.major || ""},
        userSession: JSON.stringify(ctx.session)
      }
    }),

  register: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/auth/register",
      },
    })
    .input(registerSchema)
    .output(z.object({ success: z.boolean(), message: z.string() }))
    .mutation(async ({ ctx, input }) => { // mutation for POST/PUT/DELETE
      try {
        const response = await registerUser(ctx, input.name, input.email, input.passwords)

        if (response) {
          return {
            success: true,
            message: `${input.email} has been registered successfully`,
          };
        } else {
          return {
            success: false,
            message: `${input.email} already exists`,
          };
        }
      } catch (error) {
        console.error(error)
        return {
          success: false,
          message: `Couldn't register ${input.email}`}
      }

    }),

  login: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/auth/login",
      },
    })
    .input(loginSchema)
    .output(z.object({ success: z.boolean(), message: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // All errors should bubble up and be caught here
      try {
        const userId = await loginUser(ctx, input.email, input.password)
        console.log("User id from login: ", userId);

        return {
          success: true,
          message: `${input.email} logged in successfully`,
        };

      } catch (error) {
        console.error(error)
        return {
          success: false,
          message: `Couldn't log in ${input.email}`}
      }
    }),

  logout: publicProcedure // Probably shouldn't keep this as public
    .meta({
      openapi: {
        method: "POST",
        path: "/auth/logout",
        protect: true
      }
    })
    .input(z.void())
    .output(z.object({ message: z.string() }))
    .mutation(({ctx}) => {

      try {
        logoutUser(ctx);
        return {
          success: true,
          message: `User logged out`
        }

      } catch (e) {
        console.error("Error while logging out: ", e);
        return {
          success: false,
          message: `User unable to be logged out bc: ${e}`
        }
      }
      
    }),

  resetPassword: publicProcedure // reset the password in the DB
    .meta({
      openapi: {
        method: "PUT",
        path: "/auth/reset-password",
        protect: true
      },
    })
    .input(resetPasswordSchema)
    .output(z.object({success: z.boolean()})) 
    .mutation(async ({ input }) => {

      const { password, email} = input;


      await resetPassword(email, password); 
      return {success: true};
    }),

  sendVerificationCode: publicProcedure
      .meta({ openapi: { method: 'POST', path: '/send-code' } }) //expose the procedure as a REST endpoint, so access at localhost:3001/send-code
      .input(z.object({placeholder: z.string()})) //input is required for testing to work, but we can just pass any string
      .output(z.object({success: z.boolean(), code: z.string()})) 
      .mutation(async ({ctx, input}) => { 
          
        //get the current session
        const session = ctx.session;
        if(!session) {
          throw new TRPCError({code: 'UNAUTHORIZED', message: "Invalid session when sending code"}); 
        }

        //generate the code
        const code = crypto.randomInt(100000, 999999).toString();
          
        //get the user information from the session
        const userId = session?.userId; 
        const email = session?.userEmail;

        //delete the old code
        await db
            .delete(verificationCode)
            .where(eq(verificationCode.userId, userId));
          

        //create a new code and insert it into the database
        await db
            .insert(verificationCode)
            .values({
                code,
                userId,
                expiresAt: Date.now() + 1000 * 60 * 5 //code expires in 5 minutes
            })
          
        //send the verification code; email should come from session.user.email
        await resend.emails.send({
            from: 'verification@derailedblog.com', 
            to: email, 
            subject: 'Welcome to JayJam Study App', 
            html: `<p>Your verification code is ${code}</p>`
        });
        return { success: true, code: code }; 
      }),
      
      verifyVerificationCode: protectedProcedure
      .meta({ openapi: { method: 'POST', path: '/verify-code' } }) //expose the procedure as a REST endpoint
      .input(z.object({code: z.string()})) 
      .output(z.object({success: z.boolean()})) 
      .mutation(async ({ctx, input}) => { 
        const { code } = input; //this code will come from the frontend, user input

        //get the sesssion
        const session = ctx.session;
        if(!session) {
          throw new TRPCError({code: 'UNAUTHORIZED', message: "Invalid session in when verifying code"}); 
        }

        //get the user information from the session
        const userId = session?.userId; 
 
        //find the code assigned to the user
        const matchingCode = await db
            .select()
            .from(verificationCode)
            .where(eq(verificationCode.userId, userId))
            .get();
          
        if(!matchingCode || matchingCode.code !== code) { 
          throw new TRPCError({code: 'UNAUTHORIZED', message: "Invalid verification code"}); 
        }

        const currentDate = new Date();
        if(matchingCode.expiresAt < Number(currentDate)) {
            throw new TRPCError({code: 'UNAUTHORIZED', message: "Verification code expired"});
        }

        //if successful set verified to true for user
        await db.update(users).set({verified: true}).where(eq(users.id, userId));

        return {success: true};
    }),
    sendResetCode: publicProcedure
      .meta({ openapi: { method: 'POST', path: '/send-reset' } }) //expose the procedure as a REST endpoint, so access at localhost:3001/send-code
      .input(z.object({email: z.string()})) //input is required for testing to work, but we can just pass any string
      .output(z.object({success: z.boolean(), code: z.string()})) 
      .mutation(async ({input}) => { 
          
        const { email } = input ;  

        //generate the code
        const code = crypto.randomInt(100000, 999999).toString();
         
        //get the user information using the email
        const userIdList = await db
                      .select({
                        id: users.id
                      })
                      .from(users)
                      .where(eq(users.email, email)).limit(1);
        if(!userIdList) {
          throw new TRPCError({code: 'NOT_FOUND', message: `User with email ${email} not found`}); 
        }

        const userId = userIdList[0].id;

        //delete the old code
        await db
            .delete(verificationCode)
            .where(eq(verificationCode.userId, userId));
          

        //create a new code and insert it into the database
        await db
            .insert(verificationCode)
            .values({
                code,
                userId,
                expiresAt: Date.now() + 1000 * 60 * 5 //code expires in 5 minutes
        })


        //send the verification code; email should come from session.user.email
        await resend.emails.send({
            from: 'verification@derailedblog.com', 
            to: email, 
            subject: 'JayJam Study App: Reset your password with this code:', 
            html: `<p>Enter this code on the reset page ${code}</p>`
        });
        return { success: true, code: code }; 
    }),
    verifyResetCode: publicProcedure
      .meta({ openapi: { method: 'POST', path: '/verify-reset-code' } }) //expose the procedure as a REST endpoint
      .input(z.object({code: z.string(), email: z.string()})) 
      .output(z.object({success: z.boolean()})) 
      .mutation(async ({input}) => { 
        const { code, email } = input; 
    
        //get the user information using the email
        const userIdList = await db
                      .select({
                        id: users.id
                      })
                      .from(users)
                      .where(eq(users.email, email)).limit(1);
        if(!userIdList) {
          throw new TRPCError({code: 'NOT_FOUND', message: `User with email ${email} not found`}); 
        }

        const userId = userIdList[0].id;
 
        //find the code assigned to the user
        const matchingCode = await db
            .select()
            .from(verificationCode)
            .where(eq(verificationCode.userId, userId))
            .get();
          
        if(!matchingCode || matchingCode.code !== code) { 
          throw new TRPCError({code: 'UNAUTHORIZED', message: "Invalid verification code"}); 
        }

        const currentDate = new Date();
        if(matchingCode.expiresAt < Number(currentDate)) {
            throw new TRPCError({code: 'UNAUTHORIZED', message: "Verification code expired"});
        }

        //if successful set verified to true for user
        await db.update(users).set({verified: true}).where(eq(users.id, userId));

        return {success: true};
    }),
    validateSession: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/validate' } }) //expose the procedure as a REST endpoint, so access at localhost:3001/send-code
      .input(z.object({placeholder: z.string()})) //input is required for testing to work, but we can just pass any string
      .output(z.object({success: z.boolean()})) 
      .query(({ctx, input}) => { 
        const session = ctx.session;
        console.log("validating session with context: ", ctx.session)
        if(!session) {
          return {success: false}
        }
        return {success: true}
      })
});

export type AuthRouter = typeof authRouter
