'use client';

import { trpc } from "@/trpc/client";


export function useGetFinalizedParticipants(eventId: number) {
    const {data: users, isLoading} = trpc.events.getFinalizedParticipants.useQuery({eventId});

    return {users, isLoading}
}