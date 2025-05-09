'use client';

import { trpc } from "@/trpc/client";
import { TRPCClientError } from "@trpc/client";
import { toast } from "sonner";


export function useCalculateSuggestion() {
    const mutation = trpc.events.calcSuggestedTimes.useMutation();

    const handleCalc = async (filledTimes: [Date, Date][], eventInterval: [Date, Date]) => {
        try {
            const response = await mutation.mutateAsync({existingTimes: filledTimes, setEventInterval: eventInterval});
            return response.suggestedTimes;
        } catch (error) {
            if (error instanceof TRPCClientError) {
                toast.error(`An error occurred during meeting time suggestion: ${error.message}`)
            } else {
                toast.error(`An error occurred during meeting time suggestion`);
            }
        }
    }
      
    return {mutation, handleCalc};
}