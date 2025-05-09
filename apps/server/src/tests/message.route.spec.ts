import test, { expect } from "@playwright/test";
import { db } from "../db";
import { channels, finalizedEvents, groups, messages, pendingEvents, users } from "../db/schema";
import { initTRPC } from "@trpc/server";
import { Context, createCallerFactory } from "../lib/trpc";
import { appRouter } from "../router/app";
import { UserSession } from "../lib/auth/session";
import { eq, or } from "drizzle-orm";

const t = initTRPC.context<Context>().create(); //create the context

const createCaller = createCallerFactory(appRouter); //used to create callers of procedures on that route

const TESTER_EMAIL = ""; //change this to whoever is testing right now


//Create message tests
test('Create message works correctly with correct input and non-null finalizedEventId', async () => {
    //note that testing event emission is done on client side bc that's where emitted events go
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

    const event = await db.insert(finalizedEvents).values({
            title: "Test Event",
            description: "Test Desc",
            eventCreatorId: user.id, // user who created the event,  null for class events
            location: "Test Loc",
            startTime: new Date(),
            endTime: new Date(),
            createdAt: new Date(),
        }).returning().get();
    
    const channel = await db.insert(channels).values({
        finalizedEventId: event.id,
        pendingEventId: null
    }).returning().get();
    
    const session: UserSession = {
        sessionId: "1",
        userId: user.id,
        userEmail: TESTER_EMAIL,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
    }; 

    const caller = createCaller({ session });

    const result = await caller.message.createMessage({channelId: channel.id, content: "Test Message"});

    expect(result.content).toEqual("Test Message");

    //clean up
    await db.delete(channels).where(eq(channels.id, channel.id));
    await db.delete(finalizedEvents).where(eq(finalizedEvents.id, event.id));
    await db.delete(users).where(eq(users.id, user.id));
})

//Create message tests
test('Create message works correctly with correct input and non-null pendingEventId', async () => {
    //note that testing event emission is done on client side bc that's where emitted events go
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

    const group = await db.insert(groups).values({
            title: "Test Group",
            numStudents: 1
        }).returning().get();

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
    
    const channel = await db.insert(channels).values({
        finalizedEventId: null,
        pendingEventId: pEvent.id
    }).returning().get();
    
    const session: UserSession = {
        sessionId: "1",
        userId: user.id,
        userEmail: TESTER_EMAIL,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
    }; 

    const caller = createCaller({ session });

    const result = await caller.message.createMessage({channelId: channel.id, content: "Test Message"});

    expect(result.content).toEqual("Test Message");

    //clean up
    await db.delete(channels).where(eq(channels.id, channel.id));
    await db.delete(pendingEvents).where(eq(pendingEvents.id, pEvent.id));
    await db.delete(groups).where(eq(groups.id, group.id));
    await db.delete(users).where(eq(users.id, user.id));
})

test('Create message fails when done by unauthorized user', async () => {
    //note that testing event emission is done on client side bc that's where emitted events go
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

    const event = await db.insert(finalizedEvents).values({
            title: "Test Event",
            description: "Test Desc",
            eventCreatorId: user.id, // user who created the event,  null for class events
            location: "Test Loc",
            startTime: new Date(),
            endTime: new Date(),
            createdAt: new Date(),
        }).returning().get();
    
    const channel = await db.insert(channels).values({
        finalizedEventId: event.id,
        pendingEventId: null
    }).returning().get();
    

    const caller = createCaller({ });

    await expect(caller.message.createMessage({channelId: channel.id, content: "Test Message"})).rejects.toThrow();

    //clean up
    await db.delete(channels).where(eq(channels.id, channel.id));
    await db.delete(finalizedEvents).where(eq(finalizedEvents.id, event.id));
    await db.delete(users).where(eq(users.id, user.id));
})

//Delete message tests
test('Delete message works correctly with correct input in a finalized event channel', async () => {

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

    const event = await db.insert(finalizedEvents).values({
            title: "Test Event",
            description: "Test Desc",
            eventCreatorId: user.id, // user who created the event,  null for class events
            location: "Test Loc",
            startTime: new Date(),
            endTime: new Date(),
            createdAt: new Date(),
        }).returning().get();
    
    const channel = await db.insert(channels).values({
        finalizedEventId: event.id,
        pendingEventId: null
    }).returning().get();

    const message = await db.insert(messages).values({
        channelId: channel.id,
        userId: user.id,
        createdAt: new Date(),
        modifiedAt: new Date(),
        content: "New message"
    }).returning().get();
    
    const session: UserSession = {
        sessionId: "1",
        userId: user.id,
        userEmail: TESTER_EMAIL,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
    }; 

    const caller = createCaller({ session });

    const result = await caller.message.deleteMessage({id: message.id});

    expect(result.success).toEqual(true);
    expect(result.resText).toEqual("This message has been deleted.");

    //clean up
    await db.delete(channels).where(eq(channels.id, channel.id));
    await db.delete(finalizedEvents).where(eq(finalizedEvents.id, event.id));
    await db.delete(messages).where(eq(messages.id, message.id));
    await db.delete(users).where(eq(users.id, user.id));
})

test('Delete message works correctly with correct input in a pending event channel', async () => {

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

    const group = await db.insert(groups).values({
        title: "Test Group",
        numStudents: 1
    }).returning().get();
    
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
    
    const channel = await db.insert(channels).values({
        finalizedEventId: null,
        pendingEventId: pEvent.id
    }).returning().get();

    const message = await db.insert(messages).values({
        channelId: channel.id,
        userId: user.id,
        createdAt: new Date(),
        modifiedAt: new Date(),
        content: "New message"
    }).returning().get();
    
    const session: UserSession = {
        sessionId: "1",
        userId: user.id,
        userEmail: TESTER_EMAIL,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
    }; 

    const caller = createCaller({ session });

    const result = await caller.message.deleteMessage({id: message.id});

    expect(result.success).toEqual(true);
    expect(result.resText).toEqual("This message has been deleted.");

    //clean up
    await db.delete(channels).where(eq(channels.id, channel.id));
    await db.delete(pendingEvents).where(eq(pendingEvents.id, pEvent.id));
    await db.delete(groups).where(eq(groups.id, group.id));
    await db.delete(messages).where(eq(messages.id, message.id));
    await db.delete(users).where(eq(users.id, user.id));
})

test('Delete message fails with incorrect id input', async () => {

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

    const event = await db.insert(finalizedEvents).values({
            title: "Test Event",
            description: "Test Desc",
            eventCreatorId: user.id, // user who created the event,  null for class events
            location: "Test Loc",
            startTime: new Date(),
            endTime: new Date(),
            createdAt: new Date(),
        }).returning().get();
    
    const channel = await db.insert(channels).values({
        finalizedEventId: event.id,
        pendingEventId: null
    }).returning().get();

    const message = await db.insert(messages).values({
        channelId: channel.id,
        userId: user.id,
        createdAt: new Date(),
        modifiedAt: new Date(),
        content: "New message"
    }).returning().get();
    
    const session: UserSession = {
        sessionId: "1",
        userId: user.id,
        userEmail: TESTER_EMAIL,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
    }; 

    const caller = createCaller({ session });

    await expect(caller.message.deleteMessage({id: -1})).rejects.toThrow();
    //clean up
    await db.delete(channels).where(eq(channels.id, channel.id));
    await db.delete(finalizedEvents).where(eq(finalizedEvents.id, event.id));
    await db.delete(messages).where(eq(messages.id, message.id));
    await db.delete(users).where(eq(users.id, user.id));
})

test('Delete message fails with invalid session', async () => {

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

    const event = await db.insert(finalizedEvents).values({
            title: "Test Event",
            description: "Test Desc",
            eventCreatorId: user.id, // user who created the event,  null for class events
            location: "Test Loc",
            startTime: new Date(),
            endTime: new Date(),
            createdAt: new Date(),
        }).returning().get();
    
    const channel = await db.insert(channels).values({
        finalizedEventId: event.id,
        pendingEventId: null
    }).returning().get();

    const message = await db.insert(messages).values({
        channelId: channel.id,
        userId: user.id,
        createdAt: new Date(),
        modifiedAt: new Date(),
        content: "New message"
    }).returning().get();
     

    const caller = createCaller({ });

    await expect(caller.message.deleteMessage({id: -1})).rejects.toThrow();
    //clean up
    await db.delete(channels).where(eq(channels.id, channel.id));
    await db.delete(finalizedEvents).where(eq(finalizedEvents.id, event.id));
    await db.delete(messages).where(eq(messages.id, message.id));
    await db.delete(users).where(eq(users.id, user.id));
})

test('Delete message fails with creator user mismatch', async () => {

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

    const eventCreator = await db.insert(users).values({
                name: "Tester2",
                email: `C${TESTER_EMAIL}`,
                password: "Tester-Password1!",
                hashId: null,
                sisLink: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                verified: false
            }).returning().get();

    const event = await db.insert(finalizedEvents).values({
            title: "Test Event",
            description: "Test Desc",
            eventCreatorId: eventCreator.id,
            location: "Test Loc",
            startTime: new Date(),
            endTime: new Date(),
            createdAt: new Date(),
        }).returning().get();
    
    const channel = await db.insert(channels).values({
        finalizedEventId: event.id,
        pendingEventId: null
    }).returning().get();

    const message = await db.insert(messages).values({
        channelId: channel.id,
        userId: eventCreator.id,
        createdAt: new Date(),
        modifiedAt: new Date(),
        content: "New message"
    }).returning().get();
     
    const session: UserSession = {
        sessionId: "1",
        userId: user.id,
        userEmail: TESTER_EMAIL,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
    }; 

    const caller = createCaller({ session });

    await expect(caller.message.deleteMessage({id: message.id})).rejects.toThrow();
    //clean up
    await db.delete(channels).where(eq(channels.id, channel.id));
    await db.delete(finalizedEvents).where(eq(finalizedEvents.id, event.id));
    await db.delete(messages).where(eq(messages.id, message.id));
    await db.delete(users).where(eq(users.id, user.id));
    await db.delete(users).where(eq(users.id, eventCreator.id));
})

test('Delete message succeeds with creator user mismatch but user is event creator', async () => {

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


    const eventCreator = await db.insert(users).values({
                name: "Tester2",
                email: `C${TESTER_EMAIL}`,
                password: "Tester-Password1!",
                hashId: null,
                sisLink: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                verified: false
            }).returning().get();

    const event = await db.insert(finalizedEvents).values({
            title: "Test Event",
            description: "Test Desc",
            eventCreatorId: eventCreator.id, // user who created the event,  null for class events
            location: "Test Loc",
            startTime: new Date(),
            endTime: new Date(),
            createdAt: new Date(),
        }).returning().get();
    
    const channel = await db.insert(channels).values({
        finalizedEventId: event.id,
        pendingEventId: null
    }).returning().get();

    const message = await db.insert(messages).values({
        channelId: channel.id,
        userId: user.id,
        createdAt: new Date(),
        modifiedAt: new Date(),
        content: "New message"
    }).returning().get();
     
    const session: UserSession = {
        sessionId: "1",
        userId: eventCreator.id,
        userEmail: `C${TESTER_EMAIL}`,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
    }; 

    const caller = createCaller({ session });

    const result = await caller.message.deleteMessage({id: message.id});

    expect(result.success).toEqual(true);
    expect(result.resText).toEqual("This message has been deleted.");

    //clean up
    await db.delete(channels).where(eq(channels.id, channel.id));
    await db.delete(finalizedEvents).where(eq(finalizedEvents.id, event.id));
    await db.delete(messages).where(eq(messages.id, message.id));
    await db.delete(users).where(or(eq(users.id, user.id), eq(users.id, eventCreator.id)));
    await db.delete(users).where(eq(users.id, eventCreator.id));
})