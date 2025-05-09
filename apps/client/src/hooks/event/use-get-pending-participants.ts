'use client';

import { trpc } from "@/trpc/client";


export function useGetPendingParticipants(eventId: number) {
    const {data: users, isLoading} = trpc.events.getPendingParticipants.useQuery({eventId});

    return {users, isLoading}
}