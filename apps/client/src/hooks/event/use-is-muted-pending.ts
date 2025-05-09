import { trpc } from "@/trpc/client";

export const useIsMutedPending = (eventId: number, userId: number) => {
    const { data: isMutedPending, isLoading } = trpc.events.isMutedPending.useQuery(
        { eventId, userId }
    );

    return { isMutedPending, isLoading };
}; 