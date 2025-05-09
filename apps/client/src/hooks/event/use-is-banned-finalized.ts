import { trpc } from "@/trpc/client";

export const useIsBannedFinalized = (eventId: number, userId: number) => {
    const { data: isBannedFinalized, isLoading } = trpc.events.isBannedFinalized.useQuery(
        { eventId, userId }
    );

    return { isBannedFinalized, isLoading };
}; 