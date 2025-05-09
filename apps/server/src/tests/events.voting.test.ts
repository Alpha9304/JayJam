import { test, expect } from '@playwright/test';
import { createCallerFactory } from '../lib/trpc';
import { appRouter } from '../router/app';
import { UserSession } from '../lib/auth/session';

const createCaller = createCallerFactory(appRouter);

let pendingEventId: number;
let locationOptionId: number;
let timeOptionId: number;

test.beforeAll(async () => {
    const caller = createCaller({ session: { userId: 1, sessionId: "1" } as UserSession });

    // Step 1: Create a pending event
    const pendingEvent = await caller.events.createPendingEvent({
        groupId: 1,
        title: "Test Event",
        description: "A test event description",
        possibleStartTime: Date.now() + 172800000, // 2 days in the future,
        possibleEndTime: Date.now() + 176400000, // 2 days 1 hour in the future
        participantLimit: 2,
        registrationDeadline: Date.now() + 86400000, // 1 day in the future
    });
    expect(pendingEvent).toHaveProperty("id");
    pendingEventId = pendingEvent.id;  // Store event ID for later tests

    // Step 2: Add a location option
    const locationResponse = await caller.events.addLocationOption({
        eventId: pendingEventId,
        location: "Test Location"
    });
    expect(locationResponse).toHaveProperty("id");
    locationOptionId = locationResponse.id;  // Store location option ID

    // Step 3: Add a time option
    const timeResponse = await caller.events.addTimeOption({
        eventId: pendingEventId,
        startTime: Date.now() + 3600000, // +1 hour
        endTime: Date.now() + 7200000 // +2 hours
    });

    expect(timeResponse).toHaveProperty("id");
    timeOptionId = timeResponse.id;  // Store time option ID
});

test("Add a participant to the event", async () => {;
    const caller = createCaller({ session: { userId: 2, sessionId: "1" } as UserSession });

    const response = await caller.events.addPendingParticipant({
        eventId: pendingEventId
    });

    expect(response).toMatchObject({
        eventId: pendingEventId,
        userId: 2,
        createdAt: expect.any(Number)  // Validate timestamp
    });

    // Ensure ID exists
    expect(response.id).toBeDefined();
});

// time options and voting
test("Vote for a time option", async () => {
    const caller = createCaller({ session: { userId: 1, sessionId: "1" } as UserSession });
    const response = await caller.events.voteTime({
        eventId: pendingEventId,
        optionId: timeOptionId
    });

    expect(response).toEqual({ success: true });
});

// location options and voting
test("Vote for a location option", async () => {
    const caller = createCaller({ session: { userId: 1, sessionId: "1" } as UserSession });
    const response = await caller.events.voteLocation({
        eventId: pendingEventId,
        optionId: locationOptionId
    });

    expect(response).toEqual({ success: true });
});

test("Unvote for a location option", async () => {
    const caller = createCaller({ session: { userId: 1, sessionId: "1" } as UserSession });
    const response = await caller.events.unvoteLocation({
        optionId: locationOptionId
    });

    expect(response).toEqual({ success: true });
});

test("Get all location options for a pending event", async () => {
    const caller = createCaller({ session: { userId: 1, sessionId: "1" } as UserSession });
    const response = await caller.events.getLocationOptions({
        eventId: pendingEventId
    })

    expect(Array.isArray(response)).toBe(true); // check response is an array

    for (const option of response) { // check all location options have following properties
        expect(option).toHaveProperty("id");
        expect(option).toHaveProperty("location");
        expect(option).toHaveProperty("locationVoteCount");
        expect(option).toHaveProperty("hasVoted");
    }
})

test("Delete a location option", async () => {
    const caller = createCaller({ session: { userId: 1, sessionId: "1" } as UserSession });
    const locationResponse = await caller.events.addLocationOption({ // should work since we tested in "beforeAll"
        eventId: pendingEventId,
        location: "Test Location 2"
    });
    const locationId2 = locationResponse.id;

    const locDeleteResponse = await caller.events.deleteLocationOption({
        eventId: pendingEventId,
        locationId: locationId2
    })
    
    expect(locDeleteResponse).toEqual({ success: true});
})

// finalizing event
test("Finalize the event", async () => {
    const caller = createCaller({ session: { userId: 1, sessionId: "1" } as UserSession });
    const response = await caller.events.finalizeEvent({
        eventId: pendingEventId,
        locationOptionId,
        timeOptionId
    });

    expect(response).toHaveProperty("finalizedEventId");
});
