import { trpc } from "@/trpc/client";

export const useIsMutedFinalized = (eventId: number, userId: number) => {
    const { data: isMutedFinalized, isLoading } = trpc.events.isMutedFinalized.useQuery(
        { eventId, userId }
    );

    return { isMutedFinalized, isLoading };
}; 