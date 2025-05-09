import { trpc } from "@/trpc/client";

export const useIsBannedPending = (eventId: number, userId: number) => {
    const { data: isBannedPending, isLoading } = trpc.events.isBannedPending.useQuery(
        { eventId, userId }
    );

    return { isBannedPending, isLoading };
}; 