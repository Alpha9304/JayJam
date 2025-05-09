import { z } from 'zod';

export const createPendingEventSchema = z.object({
    groupId: z.number(),
    title: z.string().trim().min(1, "Required"),
    description: z.string().trim(),
    possibleStartTime: z.number(),
    possibleEndTime: z.number(),
    participantLimit: z.number().int().nullable(),
    registrationDeadline: z.number(),
}).refine((data) => {
    return data.possibleEndTime > data.possibleStartTime;
}, {
    message: "End time must be after start time",
    path: ["possibleEndTime"]
}).refine((data) => {
    const now = Date.now();
    return data.registrationDeadline > now;
}, {
    message: "Registration deadline must be in the future",
    path: ["registrationDeadline"]
}).refine((data) => {
    return data.registrationDeadline < data.possibleStartTime;
}, {
    message: "Registration deadline must be before the event start time",
    path: ["registrationDeadline"]
}).refine((data) => {
    return data.possibleStartTime > Date.now();
}, {
    message: "Event start time must be in the future",
    path: ["possibleStartTime"]
});

export const createPersonalEventSchema = z.object({
    title: z.string().trim().min(1, "Required"),
    description: z.string().trim(),
    startTime: z.number(),
    endTime: z.number(),
}).refine((data) => {
    return data.endTime > data.startTime;
}, {
    message: "End time must be after start time",
    path: ["possibleEndTime"]
}).refine((data) => {
    return data.startTime > Date.now();
}, {
    message: "Event start time must be in the future",
    path: ["possibleStartTime"]
});

export const timeSlotSchema = z.object({
    start: z.number(),
    end: z.number(),
}).refine((data) => {
    return data.end > data.start;
}, {
    message: "End time must be after start time",
    path: ["end"]
});

export type TimeSlot = z.infer<typeof timeSlotSchema>;

export const updateEventInfoSchema = z.object({
    location: z.array(z.string().trim()),
    timeslot: z.array(timeSlotSchema),
});

// Custom type to include context for time range validation
export interface UpdateEventContext {
    possibleStartTime: number;
    possibleEndTime: number;
}

// Function to validate time slots are within event's time range
export const validateTimeSlots = (
    data: z.infer<typeof updateEventInfoSchema>,
    context: UpdateEventContext
): boolean => {
    return data.timeslot.every(slot => 
        slot.start >= context.possibleStartTime && 
        slot.end <= context.possibleEndTime
    );
};

export const addLocationOptionSchema = z.object({
    eventId: z.number(),
    location: z.string().trim(),
});

export const addTimeOptionSchema = z.object({
    eventId: z.number(),
    startTime: z.number(),
    endTime: z.number(),
}).refine((data) => {
    return data.endTime > data.startTime;
}, {
    message: "End time must be after start time",
    path: ["endTime"]
});