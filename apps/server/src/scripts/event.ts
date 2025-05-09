import { VEvent } from 'node-ical';
import { db } from '../db';
import { finalizedEvents, finalizedEventParticipants, pendingEvents, pendingLocationOptions } from '../db/schema';
import { like, and, eq, desc } from 'drizzle-orm';

interface EventInput {
    title: string;
    description?: string | null;
    eventCreatorId: number;
    location?: string | null;
    startTime: Date;
    endTime: Date;
    type: 'custom' | 'class' | 'google';
}

/**
 * Convert a VEvent from iCal to our database event format
 * @param event The VEvent from the iCal file
 * @param userId The ID of the user who owns this event
 * @returns EventInput object ready for database insertion
 */
export const convertVEventToEventInput = (event: VEvent, userId: number): EventInput => {
    return {
        title: event.summary,
        description: event.description || null,
        eventCreatorId: userId,
        location: event.location || null,
        startTime: event.start,
        endTime: event.end || event.start, // fallback to start time if no end time
        type: 'class' // Events from SIS are always class events
    };
};

/**
 * Insert a single event into the database
 * @param eventInput The event data to insert
 * @returns The inserted event's ID
 */
export const insertEvent = async (eventInput: EventInput): Promise<number> => {
    const now = new Date();
    
    const result = await db
        .insert(finalizedEvents)
        .values({
            ...eventInput,
            createdAt: now,
        })
        .returning({ insertedId: finalizedEvents.id });

    const eventId = result[0].insertedId;

    // Add the creator as a participant
    await db.insert(finalizedEventParticipants)
        .values({
            eventId: eventId,
            userId: eventInput.eventCreatorId,
            createdAt: now
        });

    return eventId;
};

/**
 * Insert multiple VEvents into the database for a user
 * @param vevents Array of VEvents from the iCal file
 * @param userId The ID of the user who owns these events
 * @returns Array of inserted event IDs
 */
export const insertVEvents = async (vevents: VEvent[], userId: number): Promise<number[]> => {
    const eventIds: number[] = [];
    
    for (const vevent of vevents) {
        try {
            const eventInput = convertVEventToEventInput(vevent, userId);
            const eventId = await insertEvent(eventInput);
            eventIds.push(eventId);
        } catch (error) {
            console.error(`Failed to insert event ${vevent.summary}:`, error);
            // Continue with next event even if one fails
        }
    }
    
    return eventIds;
};

/**
 * Delete events for a specific class by matching the title pattern
 * @param classId The class ID (e.g., "EN.601.625")
 * @param userId The ID of the user who owns these events
 * @returns Number of deleted events
 */
export const deleteEventsByClassId = async (classId: string, userId: number): Promise<number> => {
    try {
        // Class events typically have titles like "EN.601.625 (01) - Software System Design"
        // We use LIKE to match the class ID pattern at the beginning of the title
        const result = await db
            .delete(finalizedEvents)
            .where(
                and(
                    like(finalizedEvents.title, `${classId}%`),
                    eq(finalizedEvents.eventCreatorId, userId),
                    like(finalizedEvents.title, `${classId}%`),
                    eq(finalizedEvents.eventCreatorId, userId)
                )
            )
            .returning({ deletedId: finalizedEvents.id });
        
        return result.length;
    } catch (error) {
        console.error(`Failed to delete events for class ${classId}:`, error);
        return 0;
    }
}; 

/*
* ---------------------------------------------------
* Location Voting
* ---------------------------------------------------
*/

/**
 * Return the most-voted-for location out of all the options.
 * @param eventId id of the event 
 * @returns Name of best location
 */
export const findBestLocation = async (pendingEventId: number) : Promise<string> => {
    const bestLocation = await db
        .select({
            location: pendingLocationOptions.location
        })
        .from(pendingLocationOptions)
        .where(eq(pendingLocationOptions.eventId, pendingEventId))
        .orderBy(desc(pendingLocationOptions.locationVoteCount))
        .limit(1) // retrieve just the top choice
        .get()
    
    return bestLocation?.location ?? ""
}