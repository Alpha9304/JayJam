import { z } from "zod";
import { publicProcedure, router } from "../lib/trpc";
import { db } from "../db";
import { channels, finalizedEventParticipants, finalizedEvents, messages, sessions, users, verificationCode } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { insertNewUserIntoDb } from "../lib/auth/db";

//useful procedures to use during testing
export const testToolsRouter = router({
    createUserUnverified: publicProcedure
    .meta({ openapi: { method: 'POST', path: '/create-user-unverified' } }) //expose the procedure as a REST endpoint, so access at localhost:3001/create-user
    .input(z.object({name: z.string(), email: z.string(), password: z.string()}))
    .output(z.object({userId: z.number()}))
    .mutation(async ({ input }) => {
    
        //create a sample user in the db
        const  { name, email, password } = input;
        const hasUser = await db.select().from(users).where(eq(users.email, email));
        if(hasUser.length > 0) {
            const found = hasUser[0];
            return {userId: found.id};
        }
        const user = await insertNewUserIntoDb(name, email, password);

        return {userId: user.id};
    }),
    createUserVerified: publicProcedure
    .meta({ openapi: { method: 'POST', path: '/create-user-verified' } }) //expose the procedure as a REST endpoint, so access at localhost:3001/create-user
    .input(z.object({name: z.string(), email: z.string(), password: z.string()}))
    .output(z.object({userId: z.number()}))
    .mutation(async ({ input }) => {
    
        //create a sample user in the db
        const  { name, email, password } = input;

        //await db.delete(users).where(eq(users.email, email)); //delete users if it already is there
        const hasUser = await db.select().from(users).where(eq(users.email, email));
        if(hasUser.length > 0) {
            const found = hasUser[0];
            return {userId: found.id};
        }
        const user = await insertNewUserIntoDb(name, email, password);

        await db //make user verfied
        .update(users)
        .set({verified: true })
        .where(eq(users.id, user.id));
        console.log(user);
        return {userId: user.id};
    }),

    deleteUser: publicProcedure
    .meta({ openapi: { method: 'POST', path: '/delete-user' } })
    .input(z.object({email: z.string()}))
    .output(z.object({success: z.boolean()}))
    .mutation(async ({ input }) => {
        
        const  { email } = input;
        await db.delete(sessions).where(eq(sessions.userEmail, email));
        const user = db.select().from(users).where(eq(users.email, email));
        console.log("user", user);
        await db.delete(users).where(eq(users.email, email));
        
        return {success: true};
    }),

    getVerificationCode: publicProcedure
    .meta({ openapi: { method: 'POST', path: '/get-verification-code' } })
    .input(z.object({userId: z.number()}))
    .output(z.object({code: z.string()}))
    .query(async ({ input }) => {
        
        const  { userId } = input;
        const data = await db.select().from(verificationCode).where(eq(verificationCode.userId, userId)).get();
        const code = data!.code;
        if(!data) {
            throw new TRPCError({code: "INTERNAL_SERVER_ERROR", message: `Something went wrong data: ${data}`})
        }

        if(!code) {
            throw new TRPCError({code: "INTERNAL_SERVER_ERROR", message: `Something went wrong code: ${code}`})
        }
        return {code: code}
    }),

    createFinalizedEvent: publicProcedure
    .meta({ openapi: { method: 'POST', path: '/create-finalized-event' } }) 
    .input(z.object({userId: z.number()}))
    .output(z.object({eventTitle: z.string(), eventDesc: z.string(), eventId: z.number()}))
    .mutation(async ({ input }) => {
        //create a sample user in the db
        const  { userId } = input;
        
        const hasEvent = await db.select().from(finalizedEvents).where(eq(finalizedEvents.eventCreatorId, userId));
        if(hasEvent.length > 0) {
            const found = hasEvent[0];
            return {eventTitle: found.title, eventDesc: found.description || "", eventId: found.id};
        }
        const event = await db.insert(finalizedEvents).values({
            title: "Test Event Title",
            description: "Test Event Description",
            eventCreatorId: userId,
            location: "Test Event Location",
            startTime: new Date(),
            endTime: new Date(),
            createdAt: new Date()
        }).returning().get();

        await db.insert(finalizedEventParticipants).values({
            eventId: event.id,
            userId,
            createdAt: new Date()
        })

        return {eventTitle: event.title, eventDesc: event.description || "", eventId: event.id};
    }),

    deleteFinalizedEvent: publicProcedure
    .meta({ openapi: { method: 'POST', path: '/delete-finalized-event' } }) //expose the procedure as a REST endpoint, so access at localhost:3001/create-user
    .input(z.object({eventId: z.number(), userId: z.number()}))
    .output(z.object({success: z.boolean()}))
    .mutation(async ({ input }) => {
        //create a sample user in the db
        const  { eventId, userId } = input;
        
        await db.delete(finalizedEvents).where(eq(finalizedEvents.id, eventId));
        await db.delete(finalizedEventParticipants).where(and(eq(finalizedEventParticipants.userId, userId), eq(finalizedEventParticipants.eventId, eventId)));

        return {success: true};
    }),
    createFinalizedChat: publicProcedure
    .meta({ openapi: { method: 'POST', path: '/create-finalized-chat' } }) 
    .input(z.object({fEventId: z.number()}))
    .output(z.object({channelId: z.number()}))
    .mutation(async ({ input }) => {
        const { fEventId } = input;

        const hasChannel = await db.select().from(channels).where(eq(channels.finalizedEventId, fEventId));
        if(hasChannel.length > 0) {
            const found = hasChannel[0];
            return {channelId: found.id};
        }
        const channel = await db.insert(channels).values({
                finalizedEventId: fEventId,
                pendingEventId: null
        }).returning().get(); 

        return {channelId: channel.id};   
    }),

    deleteChat: publicProcedure
    .meta({ openapi: { method: 'POST', path: '/delete-chat' } }) 
    .input(z.object({channelId: z.number()}))
    .output(z.object({success: z.boolean()}))
    .mutation(async ({ input }) => {
        const { channelId } = input;

        await db.delete(channels).where(eq(channels.id, channelId));

        return {success: true};   
    }),

    createMessage: publicProcedure
    .meta({ openapi: { method: 'POST', path: '/create-message' } }) 
    .input(z.object({channelId: z.number(), userId: z.number(), content: z.string()}))
    .output(z.object({messageId: z.number()}))
    .mutation(async ({ input }) => {
        const { channelId, userId, content } = input;
        
        const message = await db.insert(messages).values({
            channelId,
            userId,
            createdAt: new Date(),
            modifiedAt: new Date(),
            content
        }).returning().get();


        return ({messageId: message.id});
    }),

    deleteMessage: publicProcedure
    .meta({ openapi: { method: 'POST', path: '/delete-message' } }) 
    .input(z.object({userId: z.number()}))
    .output(z.object({success: z.boolean()}))
    .mutation(async ({ input }) => {
        const { userId } = input;

        await db.delete(messages).where(eq(messages.userId, userId));

        return {success: true};   
    }),
})

export type TestToolsRouter = typeof testToolsRouter