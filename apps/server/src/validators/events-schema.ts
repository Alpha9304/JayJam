import { z } from "zod";


export const calculateSuggestedTimesInputSchema = z.object({
    existingTimes: z.array(z.tuple([z.date(), z.date()])), //existing times represented by an array of start time, end time tuples; the event is set on a specific day so only look at times
    setEventInterval: z.tuple([z.date(), z.date()])
})

export const calculateSuggestedTimesOutputSchema = z.object({
    suggestedTimes: z.array(z.tuple([z.date(), z.date()])),
    success: z.boolean()
})