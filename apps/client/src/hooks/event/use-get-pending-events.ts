'use client';

import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useEffect } from "react";
// import { useUserInfo } from "@/hooks/auth/use-user-info";

export interface PendingEvent {
  id: number;
  title: string;
  description: string | null;
  eventCreatorId: number;
  participantLimit: number;
  possibleStartTime: string;
  possibleEndTime: string;
  registrationDeadline: string;
  isParticipant: boolean;
}

export function useGetPendingEvents(groupId?: number) {
  // const { userBasicInfo } = useUserInfo();
  const query = trpc.events.getPendingEvents.useQuery({ groupId });

  useEffect(() => {
    if (query.isSuccess) {
      toast.success('Pending events fetched successfully');
    }
    if (query.isError) {
      toast.error(`Failed to fetch pending events: ${query.error.message}`);
    }
  }, [query.isSuccess, query.isError, query.error]);
  
  return {
    pendingEvents: query.data as PendingEvent[] | undefined,
    isLoading: query.isLoading,
  };
}

export function useGetPendingEventsByGroup(groupId: number) {
  const query = trpc.events.getPendingEventsByGroup.useQuery({ groupId });

  useEffect(() => {
    if (query.isSuccess) {
      toast.success('Pending events fetched successfully');
    }
    if (query.isError) {
      toast.error(`Failed to fetch pending events: ${query.error.message}`);
    }
  }, [query.isSuccess, query.isError, query.error]);
  
  return {
    pendingEvents: query.data as PendingEvent[] | undefined,
    isLoading: query.isLoading,
  };
}