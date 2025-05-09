import { test, expect } from '@playwright/test';
import { appRouter } from '../router/app';
import { Context, createCallerFactory } from '../lib/trpc';
import { initTRPC } from '@trpc/server';
import { db } from '../db';
import { finalizedEventParticipants, finalizedEvents, users, verificationCode } from '../db/schema';
import { eq } from 'drizzle-orm';
import { UserSession } from '../lib/auth/session';

const t = initTRPC.context<Context>().create(); //create the context

const createCaller = createCallerFactory(appRouter); //used to create callers of procedures on that route

const TESTER_EMAIL = ""; //change this to whoever is testing right now


//Suggested times tests
test('Give user suggested times based on non-empty existing date input where dates are all on the same day', async ({ request }) => {
    const session: UserSession = {
        sessionId: "1",
        userId: 1,
        userEmail: TESTER_EMAIL,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
    }; 

    const caller = createCaller({ session })
    
    //use UTC or else it will convert from my timezone and make test writing hard
    const sampleExistingDates: [Date, Date][] = [[new Date(Date.UTC(2025, 11, 17, 5, 0)), new Date(Date.UTC(2025, 11, 17, 6, 0))], 
        [new Date(Date.UTC(2025, 11, 17, 3, 0)), new Date(Date.UTC(2025, 11, 17, 4, 0))], [new Date(Date.UTC(2025, 11, 17, 8, 0)), new Date(Date.UTC(2025, 11, 17, 9, 0))]];

    const sampleEventInterval: [Date, Date] = [new Date(Date.UTC(2025, 11, 17, 0, 0)), new Date(Date.UTC(2025, 11, 17, 23, 59))];


    const expectedResult: [Date, Date][] = [[new Date(Date.UTC(2025, 11, 17, 0, 0)), new Date(Date.UTC(2025, 11, 17, 2, 59))], 
    [new Date(Date.UTC(2025, 11, 17, 4, 1)), new Date(Date.UTC(2025, 11, 17, 4, 59))], [new Date(Date.UTC(2025, 11, 17, 6, 1)), new Date(Date.UTC(2025, 11, 17, 7, 59))],
    [new Date(Date.UTC(2025, 11, 17, 9, 1)), new Date(Date.UTC(2025, 11, 17, 23, 59))]];

    
    const result = await caller.events.calcSuggestedTimes({existingTimes: sampleExistingDates, setEventInterval: sampleEventInterval});

    expect(result.success).toBeTruthy();
    expect(result.suggestedTimes).toEqual(expectedResult);
});

test('Give user suggested times based on non-empty existing date input where available interval ends before existing dates interval; all dates are on the same day', async ({ request }) => {
    const session: UserSession = {
        sessionId: "1",
        userId: 1,
        userEmail: TESTER_EMAIL,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
    }; 

    const caller = createCaller({ session })
    
    //use UTC or else it will convert from my timezone and make test writing hard
    const sampleExistingDates: [Date, Date][] = [[new Date(Date.UTC(2025, 11, 17, 20, 0)), new Date(Date.UTC(2025, 11, 17, 23, 0))]];

    const sampleEventInterval: [Date, Date] = [new Date(Date.UTC(2025, 11, 17, 0, 0)), new Date(Date.UTC(2025, 11, 17, 21, 0))];


    const expectedResult: [Date, Date][] = [[new Date(Date.UTC(2025, 11, 17, 0, 0)), new Date(Date.UTC(2025, 11, 17, 19, 59))]];
    
    const result = await caller.events.calcSuggestedTimes({existingTimes: sampleExistingDates, setEventInterval: sampleEventInterval});

    expect(result.success).toBeTruthy();
    expect(result.suggestedTimes).toEqual(expectedResult);
});

test('Give user suggested times based on non-empty existing date input where both sets of dates are not on the same day', async ({ request }) => {
    const session: UserSession = {
        sessionId: "1",
        userId: 1,
        userEmail: TESTER_EMAIL,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
    }; 

    const caller = createCaller({ session });
    
    //use UTC or else it will convert from my timezone and make test writing hard
    const sampleExistingDates: [Date, Date][] = [[new Date(Date.UTC(2025, 11, 17, 0, 0)), new Date(Date.UTC(2025, 11, 17, 2, 0))], 
        [new Date(Date.UTC(2025, 11, 17, 5, 0)), new Date(Date.UTC(2025, 11, 17, 7, 0))], [new Date(Date.UTC(2025, 11, 18, 6, 0)), new Date(Date.UTC(2025, 11, 18, 8, 0))]];

    const sampleEventInterval: [Date, Date] = [new Date(Date.UTC(2025, 11, 17, 0, 0)), new Date(Date.UTC(2025, 11, 18, 23, 59))];


    const expectedResult: [Date, Date][] = [[new Date(Date.UTC(2025, 11, 17, 2, 1)), new Date(Date.UTC(2025, 11, 17, 4, 59))], 
    [new Date(Date.UTC(2025, 11, 17, 7, 1)), new Date(Date.UTC(2025, 11, 18, 5, 59))],
    [new Date(Date.UTC(2025, 11, 18, 8, 1)), new Date(Date.UTC(2025, 11, 18, 23, 59))]];

    
    const result = await caller.events.calcSuggestedTimes({existingTimes: sampleExistingDates, setEventInterval: sampleEventInterval});

    expect(result.success).toBeTruthy();
    expect(result.suggestedTimes).toEqual(expectedResult);
});

test('Randomly generated case 1', async ({ request }) => {
    const session: UserSession = {
        sessionId: "1",
        userId: 1,
        userEmail: TESTER_EMAIL,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
    }; 

    const caller = createCaller({ session });
    
    //use UTC or else it will convert from my timezone and make test writing hard
    const sampleExistingDates: [Date, Date][] = [[new Date(Date.UTC(2025, 2, 9, 22, 52)), new Date(Date.UTC(2025, 2, 10, 8, 49))], 
        [new Date(Date.UTC(2025, 2, 10, 19, 44)), new Date(Date.UTC(2025, 2, 11, 13, 48))], [new Date(Date.UTC(2025, 2, 10, 9, 18)), new Date(Date.UTC(2025, 2, 11, 8, 23))],
        [new Date(Date.UTC(2025, 2, 10, 4, 31)), new Date(Date.UTC(2025, 2, 10, 20, 18))], [new Date(Date.UTC(2025, 2, 10, 0, 45)), new Date(Date.UTC(2025, 2, 10, 12, 23))],
        [new Date(Date.UTC(2025, 2, 10, 0, 29)), new Date(Date.UTC(2025, 2, 10, 1, 25))], [new Date(Date.UTC(2025, 2, 10, 0, 53)), new Date(Date.UTC(2025, 2, 10, 11, 2))],
        [new Date(Date.UTC(2025, 2, 10, 18, 42)), new Date(Date.UTC(2025, 2, 11, 14, 50))], [new Date(Date.UTC(2025, 2, 10, 3, 9)), new Date(Date.UTC(2025, 2, 11, 3, 9))]];

    //console.log("existing dates: ", sampleExistingDates);

    const sampleEventInterval: [Date, Date] = [new Date(Date.UTC(2025, 2, 9, 0, 0)), new Date(Date.UTC(2025, 2, 10, 23, 59))];

    //console.log("event interval: ", sampleEventInterval)


    const expectedResult: [Date, Date][] = [[new Date(Date.UTC(2025, 2, 9, 0, 0)), new Date(Date.UTC(2025, 2, 9, 22, 51))]];

    
    const result = await caller.events.calcSuggestedTimes({existingTimes: sampleExistingDates, setEventInterval: sampleEventInterval});

    expect(result.success).toBeTruthy();
    expect(result.suggestedTimes).toEqual(expectedResult);
});

test('Random case 2', async ({ request }) => {
    const session: UserSession = {
        sessionId: "1",
        userId: 1,
        userEmail: TESTER_EMAIL,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
    }; 

    const caller = createCaller({ session })
    
    //use UTC or else it will convert from my timezone and make test writing hard
    const sampleExistingDates: [Date, Date][] = [];

    const sampleEventInterval: [Date, Date] = [new Date(Date.UTC(2025, 2, 17, 0, 0)), new Date(Date.UTC(2025, 2, 18, 0, 0))];


    const expectedResult: [Date, Date][] = [sampleEventInterval];
    
    const result = await caller.events.calcSuggestedTimes({existingTimes: sampleExistingDates, setEventInterval: sampleEventInterval});

    expect(result.success).toBeTruthy();
    expect(result.suggestedTimes).toEqual(expectedResult);
});


test('Get user schedules based on the eventID where the event has participants', async ({ request }) => {
    const userCreator = await db.insert(users).values({
        name: "Tester1",
        email: `1${TESTER_EMAIL}`,
        password: "Tester-Password1!",
        hashId: null,
        sisLink: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        verified: false
    }).returning().get();

    const user = await db.insert(users).values({
            name: "Tester2",
            email: TESTER_EMAIL,
            password: "Tester-Password1!",
            hashId: null,
            sisLink: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            verified: false
        }).returning().get();


    const session: UserSession = {
        sessionId: "1",
        userId: user.id,
        userEmail: TESTER_EMAIL,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
    }; 

    const event = await db.insert(finalizedEvents).values({
        title: "Test Event",
        description: "Test Desc",
        eventCreatorId: userCreator.id, // user who created the event,  null for class events
        location: "Test Loc",
        startTime: new Date(),
        endTime: new Date(),
        createdAt: new Date(),
    }).returning().get();

    await db.insert(finalizedEventParticipants).values({
        eventId: event.id,
        userId: userCreator.id,
        createdAt: new Date()
    })

    await db.insert(finalizedEventParticipants).values({
        eventId: event.id,
        userId: user.id,
        createdAt: new Date()
    })

    const caller = createCaller({ session });

    const result = await caller.events.returnAttendeesSchedule({eventId: event.id});
    expect(result.success).toBeTruthy();
    expect(result.existingTimes.length).toBeGreaterThan(0);

    //clean up
    await db.delete(finalizedEvents).where(eq(finalizedEvents.id, event.id));
    await db.delete(users).where(eq(users.id, user.id));
    await db.delete(users).where(eq(users.id, userCreator.id));
});

//removeEventParticipant tests
test('Remove event participant successfully', async ({ request }) => {
    const userCreator = await db.insert(users).values({
            name: "Tester1",
            email: `new_email${TESTER_EMAIL}`,
            password: "Tester-Password1!",
            hashId: null,
            sisLink: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            verified: false
        }).returning().get();


    const user = await db.insert(users).values({
            name: "Tester2",
            email: TESTER_EMAIL,
            password: "Tester-Password2!",
            hashId: null,
            sisLink: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            verified: false
        }).returning().get();


    const session: UserSession = {
        sessionId: "1",
        userId: user.id,
        userEmail: TESTER_EMAIL,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
    }; 

    const event = await db.insert(finalizedEvents).values({
        title: "Test Event",
        description: "Test Desc",
        eventCreatorId: userCreator.id, // user who created the event,  null for class events
        location: "Test Loc",
        startTime: new Date(),
        endTime: new Date(),
        createdAt: new Date(),
    }).returning().get();

    await db.insert(finalizedEventParticipants).values({
        eventId: event.id,
        userId: userCreator.id,
        createdAt: new Date()
    })

    await db.insert(finalizedEventParticipants).values({
        eventId: event.id,
        userId: user.id,
        createdAt: new Date()
    })

    const caller = createCaller({ session });

    const result = await caller.events.removeEventParticipant({eventId: event.id});
    expect(result.success).toBeTruthy();

    //clean up
    await db.delete(finalizedEvents).where(eq(finalizedEvents.id, event.id));
    await db.delete(users).where(eq(users.id, user.id));
    await db.delete(users).where(eq(users.id, userCreator.id));
});


test('Remove event participant fails due to non-existent event', async ({ request }) => {
    const userCreator = await db.insert(users).values({
            name: "Tester1",
            email: `1${TESTER_EMAIL}`,
            password: "Tester-Password1!",
            hashId: null,
            sisLink: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            verified: false
        }).returning().get();

    const user = await db.insert(users).values({
            name: "Tester2",
            email: TESTER_EMAIL,
            password: "Tester-Password2!",
            hashId: null,
            sisLink: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            verified: false
        }).returning().get();


    const session: UserSession = {
        sessionId: "1",
        userId: user.id,
        userEmail: TESTER_EMAIL,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
    }; 

    const event = await db.insert(finalizedEvents).values({
        title: "Test Event",
        description: "Test Desc",
        eventCreatorId: userCreator.id, // user who created the event,  null for class events
        location: "Test Loc",
        startTime: new Date(),
        endTime: new Date(),
        createdAt: new Date(),
    }).returning().get();

    await db.insert(finalizedEventParticipants).values({
        eventId: event.id,
        userId: userCreator.id,
        createdAt: new Date()
    })

    await db.insert(finalizedEventParticipants).values({
        eventId: event.id,
        userId: user.id,
        createdAt: new Date()
    })

    const caller = createCaller({ session });

    await db.delete(finalizedEvents).where(eq(finalizedEvents.id, event.id)); //event now DNE!

    expect(caller.events.removeEventParticipant({eventId: event.id})).rejects.toThrow();

    //clean up
    await db.delete(users).where(eq(users.id, user.id));
    await db.delete(users).where(eq(users.id, userCreator.id));
    
});

test('Remove event participant fails due to invalid session', async ({ request }) => {
    const userCreator = await db.insert(users).values({
            name: "Tester1",
            email: `1${TESTER_EMAIL}`,
            password: "Tester-Password1!",
            hashId: null,
            sisLink: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            verified: false
        }).returning().get();


    const user = await db.insert(users).values({
            name: "Tester2",
            email: TESTER_EMAIL,
            password: "Tester-Password2!",
            hashId: null,
            sisLink: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            verified: false
        }).returning().get();


    const event = await db.insert(finalizedEvents).values({
        title: "Test Event",
        description: "Test Desc",
        eventCreatorId: userCreator.id, // user who created the event,  null for class events
        location: "Test Loc",
        startTime: new Date(),
        endTime: new Date(),
        createdAt: new Date(),
    }).returning().get();

    await db.insert(finalizedEventParticipants).values({
        eventId: event.id,
        userId: userCreator.id,
        createdAt: new Date()
    })

    await db.insert(finalizedEventParticipants).values({
        eventId: event.id,
        userId: user.id,
        createdAt: new Date()
    })

    const caller = createCaller({  }); //no session!

    expect(caller.events.removeEventParticipant({eventId: event.id})).rejects.toThrow();

    //clean up
    await db.delete(finalizedEvents).where(eq(finalizedEvents.id, event.id));
    await db.delete(users).where(eq(users.id, user.id));
    await db.delete(users).where(eq(users.id, userCreator.id));
});

test('Remove event participant fails due to something that should never happen', async ({ request }) => {
    const userCreator = await db.insert(users).values({
            name: "Tester1",
            email: `1${TESTER_EMAIL}`,
            password: "Tester-Password1!",
            hashId: null,
            sisLink: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            verified: false
        }).returning().get();

    const user = await db.insert(users).values({
            name: "Tester2",
            email: TESTER_EMAIL,
            password: "Tester-Password2!",
            hashId: null,
            sisLink: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            verified: false
        }).returning().get();


    const session: UserSession = {
        sessionId: "1",
        userId: user.id, 
        userEmail: TESTER_EMAIL,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
    }; 

    const event = await db.insert(finalizedEvents).values({
        title: "Test Event",
        description: "Test Desc",
        eventCreatorId: userCreator.id, // user who created the event,  null for class events
        location: "Test Loc",
        startTime: new Date(),
        endTime: new Date(),
        createdAt: new Date(),
    }).returning().get();

    await db.insert(finalizedEventParticipants).values({
        eventId: event.id,
        userId: userCreator.id,
        createdAt: new Date()
    })

    await db.insert(finalizedEventParticipants).values({
        eventId: event.id,
        userId: user.id,
        createdAt: new Date()
    })

    const caller = createCaller({ session });

    expect(caller.events.removeEventParticipant({eventId: event.id + 5})).rejects.toThrow();

    //clean up
    await db.delete(finalizedEvents).where(eq(finalizedEvents.id, event.id));
    await db.delete(users).where(eq(users.id, user.id));
    await db.delete(users).where(eq(users.id, userCreator.id));
});