'use client';

import { trpc } from "@/trpc/client";


export function useGetMutedFinalizedParticipants(eventId: number) {
    const {data: mutedUsers, isLoading} = trpc.events.getMutedFinalizedParticipants.useQuery({eventId});

    return {mutedUsers, isLoading}
}