'use client';

import { trpc } from "@/trpc/client";


export function useGetMutedPendingParticipants(eventId: number) {
    const {data: mutedUsers, isLoading} = trpc.events.getMutedPendingParticipants.useQuery({eventId});

    return {mutedUsers, isLoading}
}