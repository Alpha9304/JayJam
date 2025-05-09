import { z } from "zod";
import { calcSuggestion } from "../lib/events";
import { protectedProcedure, publicProcedure, router } from "../lib/trpc";
import { calculateSuggestedTimesInputSchema, calculateSuggestedTimesOutputSchema } from "../validators/events-schema";
import { db } from "../db";
import { finalizedEvents, finalizedEventParticipants, pendingEventParticipants, pendingEvents, pendingLocationOptions, pendingTimeOptions, users, PendingEvent, locationVotes, timeVotes, channels } from "../db/schema";
import { eq, and, sql, or, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { addLocationOptionSchema, addTimeOptionSchema, createPendingEventSchema, createPersonalEventSchema } from "@team-03/shared/schema/event-schema";

/*
* ---------------------------------------------------
* Helper Functions
* ---------------------------------------------------
*/
const checkPendingEventExists = async (eventId: number) => {
    const event = await db.select().from(pendingEvents).where(eq(pendingEvents.id, eventId)).get();
    if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Pending event not found" });
    return event;
};

/*
* ---------------------------------------------------
* pendingEvents CRUD
* ---------------------------------------------------
*/

// Create a pending event
export const createPendingEvent = protectedProcedure
    .meta({ openapi: { method: 'POST', path: '/pending-events' } })
    .input(createPendingEventSchema)
    .output(z.object({
        id: z.number(),
        groupId: z.number(),
        title: z.string(),
        description: z.string().nullable(),
        eventCreatorId: z.number(),
        participantLimit: z.number(),
        registrationDeadline: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
        const { title, description, participantLimit, possibleStartTime, possibleEndTime, registrationDeadline, groupId } = input;
        const eventCreatorId = ctx.session!.userId;

        // Validate title
        if (!title.trim()) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Title cannot be empty" });
        }

        // Validate eventCreatorId to make it never null
        if (eventCreatorId === null) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "eventCreatorId cannot be null" });
        }
        // Validate & Convert deadline to Date
        if (registrationDeadline <= Date.now()) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid deadline timestamp" });
        }

        // Convert timestamps to Date
        const createdAt = Date.now();
        const updatedAt = Date.now();

        // Console log the input for debugging
        // console.log("Creating event with:", {
        //     title,
        //     description,
        //     eventCreatorId,
        //     participantLimit,
        //     registrationDeadline: new Date(registrationDeadline).toISOString()
        // });

        // console.log("inserted start backend", (new Date (possibleStartTime)).toISOString()); //wrong here as well
        // console.log("inserted end backend", (new Date (possibleEndTime)).toISOString());

        // Insert into `pendingEvents` table directly
        const [newPendingEvent] = await db.insert(pendingEvents)
            .values({
                groupId: groupId,
                title: title,
                description: description ?? null,
                eventCreatorId: eventCreatorId,
                participantLimit: participantLimit,
                possibleStartTime: new Date(possibleStartTime),
                possibleEndTime: new Date(possibleEndTime),
                registrationDeadline: new Date(registrationDeadline),
                createdAt: new Date(createdAt),
                updatedAt: new Date(updatedAt),
            })
            .returning();


        if (!newPendingEvent) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create pending event" });
        }

        // console.log("Pending event created successfully:", newPendingEvent);

        // also add creator as participant to the event
        await db.insert(pendingEventParticipants).values({
            eventId: newPendingEvent.id,
            userId: eventCreatorId,
            createdAt: new Date()
        });

        return {
            id: newPendingEvent.id,
            groupId: newPendingEvent.groupId,
            title: newPendingEvent.title,
            description: newPendingEvent.description,
            eventCreatorId: newPendingEvent.eventCreatorId ?? 0,
            participantLimit: newPendingEvent.participantLimit ?? 0,
            registrationDeadline: newPendingEvent.registrationDeadline.toISOString(),
            createdAt: newPendingEvent.createdAt.toISOString(),
            updatedAt: newPendingEvent.updatedAt.toISOString()
        };
    });

// Create a personal event
export const createPersonalEvent = protectedProcedure
    .meta({ openapi: { method: 'POST', path: '/personal-events' } })
    .input(createPersonalEventSchema)
    .output(z.object({
        id: z.number(),
        title: z.string(),
        description: z.string().nullable(),
        eventCreatorId: z.number(),
        createdAt: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
        const { title, description, startTime, endTime } = input;
        const eventCreatorId = ctx.session!.userId;

        // Validate title
        if (!title.trim()) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Title cannot be empty" });
        }

        // Validate eventCreatorId to make it never null
        if (eventCreatorId === null) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "eventCreatorId cannot be null" });
        }

        // Convert timestamps to Date
        const createdAt = Date.now();
        const updatedAt = Date.now();

        // Console log the input for debugging
        // console.log("Creating event with:", {
        //     title,
        //     description,
        //     eventCreatorId
        // });

        // Insert into `finalizedEvents` table directly
        const [newPersonalEvent] = await db.insert(finalizedEvents)
            .values({
                title: title,
                description: description ?? null,
                eventCreatorId: eventCreatorId,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                createdAt: new Date(createdAt),
            })
            .returning();


        if (!newPersonalEvent) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create personal event" });
        }

        // console.log("Pending event created successfully:", newPersonalEvent);

        return {
            id: newPersonalEvent.id,
            title: newPersonalEvent.title,
            description: newPersonalEvent.description,
            eventCreatorId: newPersonalEvent.eventCreatorId ?? 0,
            createdAt: newPersonalEvent.createdAt.toISOString()
        };
    });


// Retrieve all pending events for a user
export const getPendingEvents = protectedProcedure
    .meta({ openapi: { method: 'GET', path: '/pending-events' } })
    .input(z.object({
        groupId: z.number().optional()
    }))
    .output(z.array(z.object({
        id: z.number(),
        title: z.string(),
        description: z.string().nullable(),
        eventCreatorId: z.number(),
        participantLimit: z.number(),
        possibleStartTime: z.string(),
        possibleEndTime: z.string(),
        registrationDeadline: z.string(),
        isParticipant: z.boolean()
    })))
    .query(async ({ ctx, input }) => {
        const userId = ctx.session!.userId;
        const pendingEventsResult: PendingEvent[] = await db.select()
            .from(pendingEvents)
            .where(input.groupId ? eq(pendingEvents.groupId, input.groupId) : undefined);

        // Get all events where the user is a participant
        const participantEvents = await db.select({
            eventId: pendingEventParticipants.eventId
        })
            .from(pendingEventParticipants)
            .where(eq(pendingEventParticipants.userId, userId))
            .all();

        const participantEventIds = new Set(participantEvents.map(p => p.eventId));

        return pendingEventsResult.map(event => ({
            id: event.id,
            title: event.title,
            description: event.description,
            eventCreatorId: event.eventCreatorId ?? 0,
            participantLimit: event.participantLimit ?? 0,
            possibleStartTime: event.possibleStartTime.toISOString(),
            possibleEndTime: event.possibleEndTime.toISOString(),
            registrationDeadline: event.registrationDeadline.toISOString(),
            isParticipant: participantEventIds.has(event.id)
        }));
    });

// Get pending events by groupId
export const getPendingEventsByGroup = protectedProcedure
    .meta({ openapi: { method: 'GET', path: '/pending-events/group/:groupId' } })
    .input(z.object({
        groupId: z.number()
    }))
    .output(z.array(z.object({
        id: z.number(),
        title: z.string(),
        description: z.string().nullable(),
        eventCreatorId: z.number(),
        participantLimit: z.number(),
        possibleStartTime: z.string(),
        possibleEndTime: z.string(),
        registrationDeadline: z.string(),
        isParticipant: z.boolean()
    })))
    .query(async ({ ctx, input }) => {
        const userId = ctx.session!.userId;
        const pendingEventsResult: PendingEvent[] = await db.select()
            .from(pendingEvents)
            .where(eq(pendingEvents.groupId, input.groupId));

        // Get all events where the user is a participant
        const participantEvents = await db.select({
            eventId: pendingEventParticipants.eventId
        })
            .from(pendingEventParticipants)
            .where(eq(pendingEventParticipants.userId, userId))
            .all();

        const participantEventIds = new Set(participantEvents.map(p => p.eventId));

        return pendingEventsResult.map(event => ({
            id: event.id,
            title: event.title,
            description: event.description,
            eventCreatorId: event.eventCreatorId ?? 0,
            participantLimit: event.participantLimit ?? 0,
            possibleStartTime: event.possibleStartTime.toISOString(),
            possibleEndTime: event.possibleEndTime.toISOString(),
            registrationDeadline: event.registrationDeadline.toISOString(),
            isParticipant: participantEventIds.has(event.id)
        }));
    });

export const getEventsUnderClass = protectedProcedure
    .meta({ openapi: { method: 'GET', path: '/events' } })
    .input(z.void())
    .output(z.array(
        z.object({
            id: z.string(),
            title: z.string(),
            // description: z.string().nullable(),
            // location: z.string(),
            start: z.string(),
            end: z.string()
        })
    ))
    .query(async ({ ctx }) => {
        const userId = ctx.session?.userId!;

        const userEvents = await db
            .select({
                id: finalizedEvents.id,
                title: finalizedEvents.title,
                description: finalizedEvents.description,
                location: finalizedEvents.location,
                start: finalizedEvents.startTime,
                end: finalizedEvents.endTime,
            })
            .from(finalizedEvents)
            .where(eq(finalizedEvents.eventCreatorId, userId));

        // Transform the events to match the CalendarEvent schema
        const result = userEvents.map(event => ({
            id: String(event.id),
            title: event.title,
            // description: event.description,
            // location: event.location,
            start: new Date(event.start).toISOString(),
            end: new Date(event.end).toISOString(),
            // Add default styling for class events
            // backgroundColor: '#3788d8',
            // borderColor: '#3788d8',
            // textColor: '#ffffff',
            // editable: false,
        }));
        // console.log("backend getEvents() result:", result);
        return result;
});


// Delete a pending event
export const deletePendingEvent = protectedProcedure
    .meta({ openapi: { method: 'DELETE', path: '/pending-events/:eventId' } })
    .input(z.object({ eventId: z.number() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
        const { eventId } = input;
        // Check if the pending event exists
        await checkPendingEventExists(eventId);

        // Check if the user is the creator of the event
        const userId = ctx.session!.userId;
        const eventCreatorId = await db.select().from(pendingEvents).where(eq(pendingEvents.id, eventId)).get()?.eventCreatorId;
        if (eventCreatorId !== userId) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You are not the creator of this event" });
        }
        
        // Delete related chat channel first, if it exists
        const chatChannel = await db.select().from(channels).where(eq(channels.pendingEventId, eventId)).get();
        if (chatChannel) {
            await db.delete(channels).where(eq(channels.id, chatChannel.id));
        }

        // Delete the pending event
        await db.delete(pendingEvents).where(eq(pendingEvents.id, eventId));
        return { success: true };
    });

/*
* ---------------------------------------------------
* pendingEventParticipant C&D
* ---------------------------------------------------
*/
// Add a participant to a pending event
export const addPendingParticipant = protectedProcedure
    .meta({ openapi: { method: 'POST', path: '/pending-events/:eventId/participants' } })
    .input(z.object({
        eventId: z.number(),
    }))
    .output(z.object({
        id: z.number(),
        eventId: z.number(),
        userId: z.number(),
        createdAt: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
        const { eventId } = input;
        const userId = ctx.session!.userId;

        // Console log the input for debugging
        // console.log("Adding participant to pending event:", { eventId, userId });

        // Check if the pending event exists
        await checkPendingEventExists(eventId);

        // Check if the user exists
        if (userId === null) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "User ID is null, which should never happen" });
        }

        // Check if the user is already a participant of the pending event
        const existingParticipant = await db.select()
            .from(pendingEventParticipants)
            .where(
                and(
                    eq(pendingEventParticipants.eventId, eventId),
                    eq(pendingEventParticipants.userId, userId)
                )
            )
            .get();
        

        // // Check for null values and throw error if they exist
        // if (existingParticipant === null) {
        //     throw new TRPCError({
        //         code: "INTERNAL_SERVER_ERROR",
        //         message: "Participant, event or user ID is null, which should never happen"
        //     });
        // }
        // if (existingParticipant.eventId === null) {
        //     throw new TRPCError({
        //         code: "INTERNAL_SERVER_ERROR",
        //         message: "Event ID is null, which should never happen"
        //     });
        // }
        // if (existingParticipant.userId === null) {
        //     throw new TRPCError({
        //         code: "INTERNAL_SERVER_ERROR",
        //         message: "User ID is null, which should never happen"
        //     });
        // }

        if (existingParticipant) {
            return {
                id: existingParticipant.id,
                eventId: existingParticipant.eventId ?? 0,
                userId: existingParticipant.userId ?? 0,
                createdAt: Number(existingParticipant.createdAt)
            };  // Return existing participant ID instead of throwing an error
        }

        // Add participant
        const [newParticipant] = await db.insert(pendingEventParticipants)
            .values({
                eventId: eventId,
                userId: userId,
                createdAt: new Date(),
            })
            .returning();

        if (!newParticipant) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to add participant" });
        }

        // Check for null values and throw error if they exist
        if (newParticipant.eventId === null || newParticipant.userId === null) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Event or user ID is null, which should never happen"
            });
        }

        // Console log the input for debugging
        console.log("Participant added successfully:", newParticipant);
        return {
            id: newParticipant.id,
            createdAt: Number(newParticipant.createdAt),
            eventId: newParticipant.eventId ?? 0,
            userId: newParticipant.userId ?? 0,
        };
    });

// Remove a participant from a pending event
export const removePendingParticipant = protectedProcedure
    .meta({ openapi: { method: 'DELETE', path: '/pending-events/:eventId/participants/:userId' } })
    .input(z.object({
        eventId: z.number(),
        userId: z.number()
    }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
        const { eventId, userId } = input;

        // Check if the pending event exists
        const event = await checkPendingEventExists(eventId);

        // Check if the user is authorized
              
        if(ctx.session!.userId !== userId && ctx.session!.userId !== event.eventCreatorId) {
            throw new TRPCError({code: 'FORBIDDEN', message: "You are not allowed to remove this particapant"});
          }

        // Remove the participant
        await db.delete(pendingEventParticipants)
            .where(and(
                eq(pendingEventParticipants.eventId, eventId),
                eq(pendingEventParticipants.userId, userId)
            ));

        return { success: true };
    });

/*
* ---------------------------------------------------
* pendingLocationOptions Operations CRUD
* ---------------------------------------------------
*/
// Add a location option for a pending event
export const addLocationOption = protectedProcedure
    .meta({ openapi: { method: 'POST', path: '/pending-events/:eventId/locations' } })
    .input(addLocationOptionSchema)
    .output(z.object({
        id: z.number(),
        eventId: z.number(),
        location: z.string(),
        locationVoteCount: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
        const { eventId, location } = input;

        // Check if the pending event exists
        await checkPendingEventExists(eventId);

        // Check if the user is the creator of the event
        const eventCreatorId = await db.select().from(pendingEvents).where(eq(pendingEvents.id, eventId)).get()?.eventCreatorId;
        if (!eventCreatorId) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Event creator not found" });
        }

        // Check if the user is the creator of the event
        const userId = ctx.session!.userId;
        if (eventCreatorId !== userId) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You are not the creator of this event" });
        }


        // console.log("Adding location option:", { eventId, location });

        // Check if the location already exists for this event
        const existingLocation = await db.select()
            .from(pendingLocationOptions)
            .where(and(eq(pendingLocationOptions.eventId, eventId), eq(pendingLocationOptions.location, location)))
            .get();

        if (existingLocation) {
            throw new TRPCError({ code: "CONFLICT", message: "Location option already exists for this event" });
        }

        // Add location option
        const [newLocationOption] = await db.insert(pendingLocationOptions)
            .values({
                eventId,
                location,
                locationVoteCount: 0
            })
            .returning();

        if (!newLocationOption) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Server error: Failed to add location option" });
        }

        // console.log("Location option added successfully:", newLocationOption);
        return newLocationOption;
    });

// Get location options for a pending event
export const getLocationOptions = protectedProcedure
    .meta({ openapi: { method: 'GET', path: '/pending-events/:eventId/locations' } })
    .input(z.object({
        eventId: z.number()
    }))
    .output(z.array(z.object({
        id: z.number(),
        location: z.string(),
        locationVoteCount: z.number(),
        hasVoted: z.boolean()
    })))
    .query(async ({ ctx, input }) => {
        const { eventId } = input;
        const userId = ctx.session!.userId;

        // Get all location options
        const options = await db.select({
            id: pendingLocationOptions.id,
            location: pendingLocationOptions.location,
            locationVoteCount: pendingLocationOptions.locationVoteCount
        })
            .from(pendingLocationOptions)
            .where(eq(pendingLocationOptions.eventId, eventId));

        // Get user's votes for these options
        const userVotes = await db.select({
            optionId: locationVotes.optionId
        })
            .from(locationVotes)
            .where(eq(locationVotes.userId, userId));

        const votedOptionIds = new Set(userVotes.map(v => v.optionId));

        // Add hasVoted field to each option
        return options.map(option => ({
            ...option,
            hasVoted: votedOptionIds.has(option.id)
        }));
    });

// Vote for a LocationOption
export const voteLocation = protectedProcedure
    .meta({ openapi: { method: 'POST', path: '/events/:eventId/vote/location' } })
    .input(z.object({
        eventId: z.number(),
        optionId: z.number()
    }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
        const { optionId } = input;
        const userId = ctx.session!.userId;

        // Check if user has already voted for this option
        const existingVote = await db.select()
            .from(locationVotes)
            .where(and(
                eq(locationVotes.userId, userId),
                eq(locationVotes.optionId, optionId)
            ))
            .get();

        if (existingVote) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "You have already voted for this location" });
        }

        // Add vote record
        await db.insert(locationVotes)
            .values({
                userId,
                optionId,
                createdAt: new Date()
            });

        // Update vote count
        await db.update(pendingLocationOptions)
            .set({ locationVoteCount: sql`${pendingLocationOptions.locationVoteCount} + 1` })
            .where(eq(pendingLocationOptions.id, optionId));

        return { success: true };
    });

// Unvote for a location option
export const unvoteLocation = protectedProcedure
    .meta({ openapi: { method: 'DELETE', path: '/events/:eventId/vote/location' } })
    .input(z.object({
        optionId: z.number()
    }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
        const { optionId } = input;
        const userId = ctx.session!.userId;

        // Check if user has already voted for this option
        const existingVote = await db.select()
            .from(locationVotes)
            .where(and(
                eq(locationVotes.userId, userId),
                eq(locationVotes.optionId, optionId)
            ))
            .get();
        if (!existingVote) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "You did not vote for this location previously" });
        }

        // Delete vote record
        await db
            .delete(locationVotes)
            .where(and(
                eq(locationVotes.userId, userId),
                eq(locationVotes.optionId, optionId)
            ))

        // Update vote count
        await db
            .update(pendingLocationOptions)
            .set({ locationVoteCount: sql`${pendingLocationOptions.locationVoteCount} - 1` })
            .where(eq(pendingLocationOptions.id, optionId));

        return { success: true };
});

// Delete a location option
export const deleteLocationOption = protectedProcedure
    .meta({ openapi: { method: 'DELETE', path: '/pending-events/:eventId/locations/:locationId' } })
    .input(z.object({
        eventId: z.number(),
        locationId: z.number()
    }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
        const { eventId, locationId } = input;

        // Check if the pending event exists
        await checkPendingEventExists(eventId);

        // Check if the user is the creator of the event
        const eventCreatorId = await db.select().from(pendingEvents).where(eq(pendingEvents.id, eventId)).get()?.eventCreatorId;
        if (!eventCreatorId) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Event creator not found" });
        }

        // Check if the user is the creator of the event
        const userId = ctx.session!.userId;
        if (eventCreatorId !== userId) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You are not the creator of this event" });
        }

        // Delete the location option
        const result = await db.delete(pendingLocationOptions)
            .where(and(
                eq(pendingLocationOptions.id, locationId),
                eq(pendingLocationOptions.eventId, eventId)
            ));

        return { success: result.changes > 0 };
    });

/*
* ---------------------------------------------------
* pendingTimeOptions Operations CRUD
* ---------------------------------------------------
*/
// Add a time option for a pending event
export const addTimeOption = protectedProcedure
    .meta({ openapi: { method: 'POST', path: '/pending-events/:eventId/times' } })
    .input(addTimeOptionSchema)
    .output(z.object({
        id: z.number(),
        eventId: z.number(),
        startTime: z.string(),
        endTime: z.string(),
        timeVoteCount: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
        const { eventId, startTime, endTime } = input;
        // Check if the pending event exists
        await checkPendingEventExists(eventId);

        // Check if creator id exists
        const eventCreatorId = await db.select().from(pendingEvents).where(eq(pendingEvents.id, eventId)).get()?.eventCreatorId;
        if (!eventCreatorId) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Event creator not found" });
        }

        // Check if the user is the creator of the event
        const userId = ctx.session!.userId;
        if (eventCreatorId !== userId) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You are not the creator of this event" });
        }


        // console.log("Adding time option:", { eventId, startTime, endTime });

        // Validate & Convert timestamps to Date
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid startTime or endTime" });
        }

        // Check if the time option already exists
        const existingTimeOption = await db.select()
            .from(pendingTimeOptions)
            .where(and(
                eq(pendingTimeOptions.eventId, eventId),
                eq(pendingTimeOptions.startTime, start),
                eq(pendingTimeOptions.endTime, end)
            ))
            .get();

        if (existingTimeOption) {
            throw new TRPCError({ code: "CONFLICT", message: "Time option already exists for this event" });
        }

        // Add time option
        const [newTimeOption] = await db.insert(pendingTimeOptions)
            .values({
                eventId: eventId,
                startTime: start,
                endTime: end,
                timeVoteCount: 0
            })
            .returning();

        if (!newTimeOption) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to add time option" });
        }

        console.log("Time option added successfully:", newTimeOption);
        return {
            id: newTimeOption.id,
            eventId: newTimeOption.eventId,
            startTime: newTimeOption.startTime.toISOString(),
            endTime: newTimeOption.endTime.toISOString(),
            timeVoteCount: newTimeOption.timeVoteCount
        };
    });

// Get time options for a pending event
export const getTimeOptions = protectedProcedure
    .meta({ openapi: { method: 'GET', path: '/pending-events/:eventId/times' } })
    .input(z.object({
        eventId: z.number()
    }))
    .output(z.array(z.object({
        id: z.number(),
        startTime: z.string(),
        endTime: z.string(),
        timeVoteCount: z.number(),
        hasVoted: z.boolean()
    })))
    .query(async ({ ctx, input }) => {
        const { eventId } = input;
        const userId = ctx.session!.userId;

        // Get all time options
        const options = await db.select({
            id: pendingTimeOptions.id,
            startTime: pendingTimeOptions.startTime,
            endTime: pendingTimeOptions.endTime,
            timeVoteCount: pendingTimeOptions.timeVoteCount
        })
            .from(pendingTimeOptions)
            .where(eq(pendingTimeOptions.eventId, eventId));

        // Get user's votes for these options
        const userVotes = await db.select({
            optionId: timeVotes.optionId
        })
            .from(timeVotes)
            .where(eq(timeVotes.userId, userId));

        const votedOptionIds = new Set(userVotes.map(v => v.optionId));

        // Add hasVoted field to each option
        return options.map(opt => ({
            ...opt,
            startTime: opt.startTime.toISOString(),
            endTime: opt.endTime.toISOString(),
            hasVoted: votedOptionIds.has(opt.id)
        }));
    });

// Vote for a TimeOption
export const voteTime = protectedProcedure
    .meta({ openapi: { method: 'POST', path: '/events/:eventId/vote/time' } })
    .input(z.object({
        eventId: z.number(),
        optionId: z.number()
    }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
        const { eventId, optionId } = input;
        const userId = ctx.session!.userId;

        // Check if user has already voted for this option
        const existingVote = await db.select()
            .from(timeVotes)
            .where(and(
                eq(timeVotes.userId, userId),
                eq(timeVotes.optionId, optionId)
            ))
            .get();

        if (existingVote) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "You have already voted for this time slot" });
        }

        // Add vote record
        await db.insert(timeVotes)
            .values({
                userId,
                optionId,
                createdAt: new Date()
            });

        // Update vote count
        await db.update(pendingTimeOptions)
            .set({ timeVoteCount: sql`${pendingTimeOptions.timeVoteCount} + 1` })
            .where(eq(pendingTimeOptions.id, optionId));

        return { success: true };
    });

// Unvote for a location option
export const unvoteTime = protectedProcedure
    .meta({ openapi: { method: 'DELETE', path: '/events/:eventId/vote/time' } })
    .input(z.object({
        optionId: z.number()
    }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
        const { optionId } = input;
        const userId = ctx.session!.userId;

        // Check if user has already voted for this option
        const existingVote = await db.select()
            .from(timeVotes)
            .where(and(
                eq(timeVotes.userId, userId),
                eq(timeVotes.optionId, optionId)
            ))
            .get();
        if (!existingVote) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "You did not vote for this time previously" });
        }

        // Delete vote record
        await db
            .delete(timeVotes)
            .where(and(
                eq(timeVotes.userId, userId),
                eq(timeVotes.optionId, optionId)
            ))

        // Update vote count
        await db
            .update(pendingTimeOptions)
            .set({ timeVoteCount: sql`${pendingTimeOptions.timeVoteCount} - 1` })
            .where(eq(pendingTimeOptions.id, optionId));

        return { success: true };
});

// Delete a time option
export const deleteTimeOption = protectedProcedure
        .meta({ openapi: { method: 'DELETE', path: '/pending-events/:eventId/times/:timeId' } })
        .input(z.object({
            eventId: z.number(),
            timeId: z.number()
        }))
        .output(z.object({ success: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
            const { eventId, timeId } = input;
    
            // Check if the pending event exists
            await checkPendingEventExists(eventId);
    
            // Check if the user is the creator of the event
            const eventCreatorId = await db.select().from(pendingEvents).where(eq(pendingEvents.id, eventId)).get()?.eventCreatorId;
            if (!eventCreatorId) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Event creator not found" });
            }
    
            // Check if the user is the creator of the event
            const userId = ctx.session!.userId;
            if (eventCreatorId !== userId) {
                throw new TRPCError({ code: "FORBIDDEN", message: "You are not the creator of this event" });
            }
    
            // Delete the time option
            await db.delete(pendingTimeOptions)
                .where(and(
                    eq(pendingTimeOptions.id, timeId),
                    eq(pendingTimeOptions.eventId, eventId)
                ));
    
            return { success: true };
        });

/*
* ---------------------------------------------------
* Pending to finalizedEvents and finalizedEvent CRUD
* ---------------------------------------------------
*/
// Finalize a pending event by creating a new event entry
export const finalizePendingEvent = protectedProcedure
    .meta({ openapi: { method: 'POST', path: '/pending-events/:eventId/finalize' } })
    .input(z.object({
        eventId: z.number(),
        locationOptionId: z.number(),
        timeOptionId: z.number()
    }))
    .output(z.object({ finalizedEventId: z.number() }))
    .mutation(async ({ input, ctx }) => {
        const { eventId, locationOptionId, timeOptionId } = input;
        const userId = ctx.session!.userId;

        // Check if the pending event exists
        const pendingEvent = await db.select().from(pendingEvents).where(eq(pendingEvents.id, eventId)).get();
        if (!pendingEvent) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Pending event not found" });
        }

        // Check the user is the creator
        const eventCreatorId = await db.select().from(pendingEvents).where(eq(pendingEvents.id, eventId)).get()?.eventCreatorId;
        if (eventCreatorId !== userId) {
            throw new TRPCError({ code: "FORBIDDEN", message: "You are not the creator of this event" });
        }

        // Validate location option belongs to the pending event
        const locationOption = await db.select()
            .from(pendingLocationOptions)
            .where(and(eq(pendingLocationOptions.id, locationOptionId), eq(pendingLocationOptions.eventId, eventId)))
            .get();

        if (!locationOption) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid location option" });
        }

        // Validate time option belongs to the pending event
        const timeOption = await db.select()
            .from(pendingTimeOptions)
            .where(and(eq(pendingTimeOptions.id, timeOptionId), eq(pendingTimeOptions.eventId, eventId)))
            .get();

        if (!timeOption) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid time option" });
        }

        /*
        // Check if event is already finalized
        const existingFinalized = await db.select()
            .from(finalizedEvents)
            .where(eq(finalizedEvents.id, eventId))
            .get();

        if (existingFinalized) {
            throw new TRPCError({ code: "CONFLICT", message: "Event has already been finalized" });
        }
            */

        // console.log("Finalizing pending event:", { eventId, locationOptionId, timeOptionId });

        // Retrieve all participants from `pendingEventParticipants`
        const pendingParticipants = await db.select()
            .from(pendingEventParticipants)
            .where(eq(pendingEventParticipants.eventId, eventId))
            .all();

        // Extract user IDs
        const participantUserIds = pendingParticipants.map(p => p.userId);

        // Create a new event based on pending event details
        const [newEvent] = await db.insert(finalizedEvents)
            .values({
                title: pendingEvent.title,
                description: pendingEvent.description,
                eventCreatorId: pendingEvent.eventCreatorId ? pendingEvent.eventCreatorId : 0,
                location: locationOption.location,
                startTime: timeOption.startTime,
                endTime: timeOption.endTime,
                createdAt: new Date(),
                type: 'custom', // All events created through the app are custom events
            })
            .returning();

        if (!newEvent) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create finalized event" });
        }

        // Make sure creator is in the participants list
        if (!participantUserIds.includes(pendingEvent.eventCreatorId!)) {
            participantUserIds.push(pendingEvent.eventCreatorId!);
        }

        // Insert all pending participants into `eventParticipants`, linking to the new event
        if (participantUserIds.length > 0) {
            await db.insert(finalizedEventParticipants).values(
                participantUserIds.filter(userId => userId !== null).map(userId => ({
                    eventId: newEvent.id,
                    userId: userId as number,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }))
            );
        }

        // move the binding chat channel to new finalized event
        const chatChannel = await db.select().from(channels).where(eq(channels.pendingEventId, eventId)).get();
        if (chatChannel) {
            await db.update(channels)
                .set({
                    finalizedEventId: newEvent.id,
                    pendingEventId: null
                })
                .where(eq(channels.id, chatChannel.id));
        }
        
        // console.log("Finalized event created successfully:", newEvent);
        // clean up pending event after finalized
        await db.delete(pendingEvents).where(eq(pendingEvents.id, eventId));
        return { finalizedEventId: newEvent.id };
    });

    // Retrieve all finalized events for a user
    export const getFinalizedEvents = protectedProcedure
      .meta({ openapi: { method: 'GET', path: '/finalized-events' } })
      .input(z.void())
      .output(
        z.array(
          z.object({
            id: z.number(),
            title: z.string(),
            description: z.string().nullable(),
            eventCreatorId: z.number(),
            location: z.string().nullable(),
            startTime: z.string(),
            endTime: z.string(),
            createdAt: z.string(),
            isParticipant: z.boolean(),
            type: z.enum(['custom', 'class', 'google']),
          }),
        ),
      )
      .query(async ({ ctx }) => {
        const userId = ctx.session!.userId;
    
        // Fetch event IDs where the user is a participant
        const participantEvents = await db
          .select({ eventId: finalizedEventParticipants.eventId })
          .from(finalizedEventParticipants)
          .where(eq(finalizedEventParticipants.userId, userId));
    
        const participantEventIds = participantEvents.map((p) => p.eventId);
    
        // Fetch finalized events where:
        // 1. The event is a custom event AND
        // 2. The user is only a participant
        const finalizedEventsResult = await db
          .select()
          .from(finalizedEvents)
          .where(
            and(
              eq(finalizedEvents.type, 'custom'),
              or(
                // eq(finalizedEvents.eventCreatorId, userId),
                participantEventIds.length > 0
                  ? inArray(finalizedEvents.id, participantEventIds)
                  : eq(finalizedEvents.id, -1), // ensures valid query if no participant events
              ),
            ),
          );
    
        const participantEventIdsSet = new Set(participantEventIds);
    
        return finalizedEventsResult.map((event) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          eventCreatorId: event.eventCreatorId,
          location: event.location ?? null,
          startTime: event.startTime.toISOString(),
          endTime: event.endTime.toISOString(),
          createdAt: event.createdAt.toISOString(),
          // Consider the user a participant if they're either in the participants table OR they're the creator
          isParticipant: participantEventIdsSet.has(event.id) || event.eventCreatorId === userId,
          type: event.type as 'custom' | 'class' | 'google',
        }));
      });
    

// Delete a finalized event
export const deleteFinalizedEvent = protectedProcedure
  .meta({ openapi: { method: 'DELETE', path: '/finalized-events/:id' } })
  .input(z.object({
    finalizedEventId: z.number()
  }))
  .output(z.object({ success: z.boolean() }))
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session!.userId;
    const { finalizedEventId: id } = input;

    // Fetch the event to ensure it exists and belongs to the user
    const event = await db.query.finalizedEvents.findFirst({
      where: eq(finalizedEvents.id, id)
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // only the creator can delete the event
    if (event.eventCreatorId !== userId) {
      throw new Error('Unauthorized to delete this event');
    }
    
    // TODO: delete message in that chat channel?

    // Delete the event (participants will be deleted due to ON DELETE CASCADE)
    await db.delete(finalizedEvents).where(eq(finalizedEvents.id, id));

    return { success: true };
  });



/*
* ---------------------------------------------------
* finalizedEventsParticipant Delete
* ---------------------------------------------------
*/
// Remove the user from a finalized event
export const removeFinalizedEventParticipant = protectedProcedure
    .meta({ openapi: { method: 'DELETE', path: '/events/:eventId/participants/:userId' } })
    .input(z.object({
        eventId: z.number()
    }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
        const { eventId } = input;
        // console.log("Attempting to remove participant from event:", { eventId });

        //get the sesssion
        const session = ctx.session;
        if(!session) {
            // console.log("No session found");
            throw new TRPCError({code: 'UNAUTHORIZED', message: "Invalid session in when verifying code"}); 
        }
        
        //get the user information from the session
        const userId = session?.userId;
        // console.log("User attempting to leave:", { userId });

        // First check if the event exists
        const event = await db
            .select()
            .from(finalizedEvents)
            .where(eq(finalizedEvents.id, eventId))
            .get();

        // console.log("Found event:", event);

        if(!event) {
            // console.log("Event not found:", { eventId });
            throw new TRPCError({code: "NOT_FOUND", message: "Event not found"});
        }

        // Check if the participant exists
        const participant = await db
            .select()
            .from(finalizedEventParticipants)
            .where(and(
                eq(finalizedEventParticipants.eventId, eventId),
                eq(finalizedEventParticipants.userId, userId)
            ))
            .get();

        // console.log("Found participant:", participant);

        if (!participant) {
            // console.log("Participant not found:", { userId, eventId });
            throw new TRPCError({code: "NOT_FOUND", message: "Participant not found in this event"});
        }

        // console.log("Attempting to delete participant with query:", {
        //     eventId,
        //     userId,
        //     query: `DELETE FROM finalizedEventParticipants WHERE eventId = ${eventId} AND userId = ${userId}`
        // });

        // Remove the participant without using returning() since SQLite might not support it well in this context
        const result = await db
            .delete(finalizedEventParticipants)
            .where(and(
                eq(finalizedEventParticipants.eventId, eventId),
                eq(finalizedEventParticipants.userId, userId)
            ));

        // console.log("Delete operation result:", result);

        // Verify the deletion by checking if the participant still exists
        const verifyDeletion = await db
            .select()
            .from(finalizedEventParticipants)
            .where(and(
                eq(finalizedEventParticipants.eventId, eventId),
                eq(finalizedEventParticipants.userId, userId)
            ))
            .get();

        if (verifyDeletion) {
            // console.log("Failed to delete participant:", { userId, eventId });
            throw new TRPCError({code: "INTERNAL_SERVER_ERROR", message: `Participant ${userId} could not be deleted from event ${eventId}`}); 
        }

        // console.log("Successfully removed participant:", { userId, eventId });
        return { success: true };
    });

/*
* ---------------------------------------------------
* Time Suggesstion
* ---------------------------------------------------
*/

//get students based on the created event, who is in it; then get events happening in the created event range...
export const returnAttendeesSchedule = publicProcedure
    .meta({ openapi: { method: 'GET', path: '/return-attendees' } })
    .input(z.object({ eventId: z.number() }))
    .output(z.object({ existingTimes: z.array(z.tuple([z.date(), z.date()])), success: z.boolean() }))
    .query(async ({ input }) => {
        const { eventId } = input;

        const existingStartEndTimes = await db
            .select({
                startTime: finalizedEvents.startTime,
                endTime: finalizedEvents.endTime
            })
            .from(finalizedEvents)
            .innerJoin(finalizedEventParticipants, eq(finalizedEvents.id, finalizedEventParticipants.eventId))
            .where(eq(finalizedEventParticipants.eventId, eventId));
        

        if (!existingStartEndTimes) {
            throw new TRPCError({ code: 'NOT_FOUND', message: "User has no events on their calendar." });
        }

        const existingTimes: [Date, Date][] = [];

        for (let i = 0; i < existingStartEndTimes.length; i++) {
            const { startTime, endTime } = existingStartEndTimes[i];
            existingTimes.push([new Date(startTime), new Date(endTime)]);
        }

        return { existingTimes: existingTimes, success: true };

    });

//calculate the suggested meeting times using the proposed meeting dates and the availability of students who have joined the evens
export const calcSuggestedTimes = publicProcedure
    .meta({ openapi: { method: 'POST', path: '/calculate' } })
    .input(calculateSuggestedTimesInputSchema)
    .output(calculateSuggestedTimesOutputSchema)
    .mutation(({ input }) => {

        const { existingTimes, setEventInterval } = input;

        const suggestedTimes = calcSuggestion(existingTimes, setEventInterval);

        return { suggestedTimes: suggestedTimes, success: true };

    });

// Get the participants in a pending event from the eventId
export const getPendingParticipants = publicProcedure
    .meta({ openapi: { method: 'GET', path: '/pending-participants' } })
    .input(z.object({ eventId: z.number() }))
    .output(z.array(
        z.object({
            id: z.number(),
            name: z.string(),
            email: z.string(),
            password: z.string(),
            hashId: z.string().nullable(),
            sisLink: z.string().nullable(),
            createdAt: z.date(),
            updatedAt: z.date(),
            verified: z.boolean(),
            profilePic: z.any().nullable(),
            pronouns: z.string().nullable(),
            major: z.string().nullable(),
            settingsId: z.number().nullable()
          })
      ))
    .query(async ({ input }) => {

        const participants = await db.select()
            .from(pendingEventParticipants)
            .where(eq(pendingEventParticipants.eventId, input.eventId))
            .all();

        if (!participants) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Event participants not found" });
        }

        const userIds = participants
            .map(p => p.userId)
            .filter((id): id is number => id !== null);

        const userArray = await db.select()
            .from(users)
            .where(inArray(users.id, userIds))
            .all();

        return userArray

    });

    export const getMutedPendingParticipants = publicProcedure
    .meta({ openapi: { method: 'GET', path: '/pending-muted' } })
    .input(z.object({ eventId: z.number() }))
    .output(z.array(
        z.object({
            userId: z.number().nullable(),
          })
      ))
    .query(async ({ input }) => {

        const participants = await db.select({
            userId: pendingEventParticipants.userId,
        })
            .from(pendingEventParticipants)
            .where(and(
                eq(pendingEventParticipants.eventId, input.eventId),
                eq(pendingEventParticipants.muted, true)
            ))
            .all();

            console.log("participants id at 0: " + participants.at(0)?.userId)

            if (!participants) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Event participants not found" });
            }

        
        return participants;
    });


    export const getMutedFinalizedParticipants = publicProcedure
    .meta({ openapi: { method: 'GET', path: '/finalized-muted' } })
    .input(z.object({ eventId: z.number() }))
    .output(z.array(
        z.object({
            userId: z.number().nullable(),
          })
      ))
    .query(async ({ input }) => {

        const participants = await db.select({
            userId: finalizedEventParticipants.userId,
    })
            .from(finalizedEventParticipants)
            .where(and(
                eq(finalizedEventParticipants.eventId, input.eventId),
                eq(finalizedEventParticipants.muted, true)
            ))
            .all();

            if (!participants) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Event participants not found" });
            }

        
        return participants;
    });

// Get the participants in a finalized event from the eventId
export const getFinalizedParticipants = publicProcedure
    .meta({ openapi: { method: 'GET', path: '/finalized-participants' } })
    .input(z.object({ eventId: z.number() }))
    .output(z.array(
        z.object({
            id: z.number(),
            name: z.string(),
            email: z.string(),
            password: z.string(),
            hashId: z.string().nullable(),
            sisLink: z.string().nullable(),
            createdAt: z.date(),
            updatedAt: z.date(),
            verified: z.boolean(),
            profilePic: z.any().nullable(),
            pronouns: z.string().nullable(),
            major: z.string().nullable(),
            settingsId: z.number().nullable()
          })
      ))
    .query(async ({ input }) => {

        const participants = await db.select()
            .from(finalizedEventParticipants)
            .where(eq(finalizedEventParticipants.eventId, input.eventId))
            .all();

        if (!participants) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Event participants not found" });
        }
        
        const userIds = participants
            .map(p => p.userId)
            .filter((id): id is number => id !== null);

        const userArray = await db.select()
            .from(users)
            .where(inArray(users.id, userIds))
            .all();

        return userArray

    });

    // Methods to mute/unmute a user
    export const mutePendingParticipant = protectedProcedure
            .meta({ openapi: {method: 'PUT', path: '/mute-pending'}})
            .input(z.object({eventId: z.number(), userId: z.number()}))
            .output(z.object({success: z.boolean(), message: z.string()}))
            .mutation(async ({ input}) => {     
                try {
                    await db
                        .update(pendingEventParticipants)
                        .set({
                            muted: sql`NOT muted` // toggle the value
                        })
                        .where(
                            and(
                                eq(pendingEventParticipants.userId, input.userId),
                                eq(pendingEventParticipants.eventId, input.eventId)
                            )
                        );
                    return {success: true, message: "Muted user."};
                } catch (error) {
                    return {success: false, message: "Could not mute user"}
                }
            })
    
    export const muteFinalizedParticipant = protectedProcedure
            .meta({ openapi: {method: 'PUT', path: '/mute-finalized'}})
            .input(z.object({eventId: z.number(), userId: z.number()}))
            .output(z.object({success: z.boolean(), message: z.string()}))
            .mutation(async ({ input}) => {     
                try {
                    await db
                        .update(finalizedEventParticipants)
                        .set({
                            muted: sql`NOT muted` // toggle the value
                        })
                        .where(
                            and(
                                eq(finalizedEventParticipants.userId, input.userId),
                                eq(finalizedEventParticipants.eventId, input.eventId)
                            )
                        );
                    return {success: true, message: "Muted user."};
                } catch (error) {
                    return {success: false, message: "Could not mute user"}
                }
            })
    
    // Methods to ban/unban a user

    export const banPendingParticipant = protectedProcedure
            .meta({ openapi: {method: 'PUT', path: '/ban-pending'}})
            .input(z.object({eventId: z.number(), userId: z.number()}))
            .output(z.object({success: z.boolean(), message: z.string()}))
            .mutation(async ({ input}) => {     
                try {
                    await db
                        .update(pendingEventParticipants)
                        .set({
                            banned: sql`NOT banned` // toggle the value
                        })
                        .where(
                            and(
                                eq(pendingEventParticipants.userId, input.userId),
                                eq(pendingEventParticipants.eventId, input.eventId)
                            )
                        );
                    return {success: true, message: "Banned user."};
                } catch (error) {
                    return {success: false, message: "Could not ban user"}
                }
            })
    
    export const banFinalizedParticipant = protectedProcedure
            .meta({ openapi: {method: 'PUT', path: '/ban-finalized'}})
            .input(z.object({eventId: z.number(), userId: z.number()}))
            .output(z.object({success: z.boolean(), message: z.string()}))
            .mutation(async ({ input}) => {     
                try {
                    await db
                        .update(finalizedEventParticipants)
                        .set({
                            banned: sql`NOT banned` // toggle the value
                        })
                        .where(
                            and(
                                eq(finalizedEventParticipants.userId, input.userId),
                                eq(finalizedEventParticipants.eventId, input.eventId)
                            )
                        );
                    return {success: true, message: "Banned user."};
                } catch (error) {
                    return {success: false, message: "Could not ban user"}
                }
            })

    export const isBannedPending = protectedProcedure
        .meta({ openapi: {method: 'GET', path: '/is-pending-banned'}})
        .input(z.object({eventId: z.number(), userId: z.number()}))
        .output(z.object({success: z.boolean(), message: z.string(), banned: z.boolean()}))
        .query(async ({ input}) => {     
            try {
                const [user] = await db
                    .select()
                    .from(pendingEventParticipants)
                    .where(and(
                        eq(pendingEventParticipants.userId, input.userId),
                        eq(pendingEventParticipants.eventId, input.eventId)
                    ))
                return {success: true, message: "Got user.", banned: user.banned ? user.banned : false};
            } catch (error) {
                return {success: false, message: "Error getting user", banned: false}
            }
        })

    export const isBannedFinalized = protectedProcedure
        .meta({ openapi: {method: 'GET', path: '/is-finalized-banned'}})
        .input(z.object({eventId: z.number(), userId: z.number()}))
        .output(z.object({success: z.boolean(), message: z.string(), banned: z.boolean()}))
        .query(async ({ input}) => {     
            try {
                const [user] = await db
                    .select()
                    .from(finalizedEventParticipants)
                    .where(and(
                        eq(finalizedEventParticipants.userId, input.userId),
                        eq(finalizedEventParticipants.eventId, input.eventId)
                    ))
                return {success: true, message: "Got user.", banned: user.banned ? user.banned : false};
            } catch (error) {
                return {success: false, message: "Error getting user", banned: false}
            }
        })

    export const isMutedPending = protectedProcedure
        .meta({ openapi: {method: 'GET', path: '/is-pending-muted'}})
        .input(z.object({eventId: z.number(), userId: z.number()}))
        .output(z.object({success: z.boolean(), message: z.string(), muted: z.boolean()}))
        .query(async ({ input}) => {     
            try {
                const [user] = await db
                    .select()
                    .from(pendingEventParticipants)
                    .where(and(
                        eq(pendingEventParticipants.userId, input.userId),
                        eq(pendingEventParticipants.eventId, input.eventId)
                    ))
                return {success: true, message: "Got user.", muted: user.muted ? user.muted : false};
            } catch (error) {
                return {success: false, message: "Error getting user", muted: false}
            }
        })

    export const isMutedFinalized = protectedProcedure
        .meta({ openapi: {method: 'GET', path: '/is-finalzed-muted'}})
        .input(z.object({eventId: z.number(), userId: z.number()}))
        .output(z.object({success: z.boolean(), message: z.string(), muted: z.boolean()}))
        .query(async ({ input}) => {     
            try {
                const [user] = await db
                    .select()
                    .from(finalizedEventParticipants)
                    .where(and(
                        eq(finalizedEventParticipants.userId, input.userId),
                        eq(finalizedEventParticipants.eventId, input.eventId)
                    ))
                return {success: true, message: "Got user.", muted: user.muted ? user.muted : false};
            } catch (error) {
                return {success: false, message: "Error getting user", muted: false}
            }
        })


    

export const eventsRouter = router({
    // pending event CRUD
    createPendingEvent,
    createPersonalEvent,
    getPendingEvents,
    getPendingEventsByGroup,
    getEvents: getEventsUnderClass,
    deletePendingEvent,
    // pending event participant C&D
    addPendingParticipant,
    removePendingParticipant,
    // pending location options CRUD
    addLocationOption,
    getLocationOptions,
    voteLocation,
    unvoteLocation,
    deleteLocationOption,
    // pending time options CRUD
    addTimeOption,
    getTimeOptions,
    voteTime,
    unvoteTime,
    deleteTimeOption,
    // finalized event CRUD
    finalizeEvent: finalizePendingEvent,
    getFinalizedEvents,
    deleteFinalizedEvent,
    // finalized event participant D
    removeEventParticipant: removeFinalizedEventParticipant,
    // time suggestion
    returnAttendeesSchedule,
    calcSuggestedTimes,
    // Admin
    getPendingParticipants,
    getFinalizedParticipants,
    mutePendingParticipant,
    muteFinalizedParticipant,
    banPendingParticipant,
    banFinalizedParticipant,
    isBannedPending,
    isBannedFinalized,
    isMutedPending,
    isMutedFinalized,
    getMutedPendingParticipants,
    getMutedFinalizedParticipants
});
