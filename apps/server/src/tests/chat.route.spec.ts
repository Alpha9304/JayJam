import test, { expect } from "@playwright/test";
import { db } from "../db";
import { channels, finalizedEvents, groups, pendingEvents, users } from "../db/schema";
import { initTRPC } from "@trpc/server";
import { Context, createCallerFactory } from "../lib/trpc";
import { appRouter } from "../router/app";
import { UserSession } from "../lib/auth/session";
import { eq } from "drizzle-orm";

const t = initTRPC.context<Context>().create(); //create the context

const createCaller = createCallerFactory(appRouter); //used to create callers of procedures on that route

const TESTER_EMAIL = ""; //change this to whoever is testing right now

let eventId : number | undefined;
let userId: number | undefined;
let pEventId : number | undefined;
let groupId: number | undefined;

test.afterEach(async ({}) => {
    //clean up hear because for some reason normal clean up is happening to early
    if(eventId) {
        await db.delete(channels).where(eq(channels.finalizedEventId, eventId));
        await db.delete(finalizedEvents).where(eq(finalizedEvents.id, eventId));
    }

    if(pEventId){
        await db.delete(channels).where(eq(channels.pendingEventId, pEventId));
        await db.delete(pendingEvents).where(eq(pendingEvents.id, pEventId));
    }

    if(groupId) {
        await db.delete(groups).where(eq(groups.id, groupId));
    }

    if(userId) {
        await db.delete(users).where(eq(users.id, userId));
    }

});

test('Create chat is successful with finalizedEventId not null and pendingEventId null', async () => {
   

    const caller = createCaller({});

    const user = await db.insert(users).values({
        name: "Tester1",
        email: TESTER_EMAIL,
        password: "Tester-Password1!",
        hashId: null,
        sisLink: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        verified: false
    }).returning().get();

    userId = user.id;

    const event = await db.insert(finalizedEvents).values({
        title: "Test Event",
        description: "Test Desc",
        eventCreatorId: user.id, // user who created the event,  null for class events
        location: "Test Loc",
        startTime: new Date(),
        endTime: new Date(),
        createdAt: new Date(),
    }).returning().get();

    eventId = event.id;



    await expect(caller.chats.createChat({finalizedEventId: event.id, pendingEventId: null})).toBeDefined(); //should return channel id    
})


test('Create chat is successful with pendingEventId not null and finalizedEventId null', async () => {
    const caller = createCaller({ });

    const user = await db.insert(users).values({
        name: "Tester1",
        email: TESTER_EMAIL,
        password: "Tester-Password1!",
        hashId: null,
        sisLink: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        verified: false
    }).returning().get();

    userId = user.id;

    const group = await db.insert(groups).values({
        title: "Test Group",
        numStudents: 1
    }).returning().get();

    groupId = group.id;

    const pEvent = await db.insert(pendingEvents).values({
        groupId: group.id,
        title: "Test P Event",
        description: "Test P Desc",
        eventCreatorId: user.id,
        participantLimit: 5,
        possibleStartTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
        possibleEndTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1000),
        registrationDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 50), 
        createdAt: new Date(),
        updatedAt: new Date()
    }).returning().get();

    pEventId = pEvent.id;

    await expect(caller.chats.createChat({finalizedEventId: null, pendingEventId: pEvent.id})).toBeDefined(); //should return channel id
})


test('Create chat is fails with pendingEventId null and finalizedEventId null', async () => {
    const caller = createCaller({ });


    await expect(caller.chats.createChat({finalizedEventId: null, pendingEventId: null})).rejects.toThrow(); 
})