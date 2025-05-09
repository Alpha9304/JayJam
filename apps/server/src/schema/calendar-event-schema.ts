import { z } from "zod";

export const calendarEventSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    start: z.string().or(z.number()).or(z.date()),  // ISO8601 string, timestamp, or Date object
    end: z.string().or(z.number()).or(z.date()),  // ISO8601 string, timestamp, or Date object
    allDay: z.boolean().optional(),
    url: z.string().optional(),
    classNames: z.array(z.string()).optional(),
    backgroundColor: z.string().optional(),
    borderColor: z.string().optional(),
    textColor: z.string().optional(),
    editable: z.boolean().optional(),
});

export type CalendarEvent = z.infer<typeof calendarEventSchema>;