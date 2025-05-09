import { trpc } from "@/trpc/client";
import { useEffect } from "react";
import { useUserInfo } from "@/hooks/auth/use-user-info";

export interface FinalizedEvent {
  id: number;
  title: string;
  description: string | null;
  eventCreatorId: number;
  location: string | null;
  startTime: string;
  endTime: string;
  createdAt: string;
  isParticipant: boolean;
  type: 'custom' | 'class' | 'google';
}

export const useGetFinalizedEvents = () => {
  const {
    data: finalizedEvents,
    isLoading,
    error,
    refetch,
  } = trpc.events.getFinalizedEvents.useQuery(undefined, {
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });
  const { userBasicInfo } = useUserInfo();

  useEffect(() => {
    console.log("User Info:", userBasicInfo);
    console.log("Raw finalized events from API:", finalizedEvents);
    if (finalizedEvents) {
      console.log("Events where user is participant:", finalizedEvents.filter(event => event.isParticipant));
      console.log("Events where user is creator:", finalizedEvents.filter(event => event.eventCreatorId === userBasicInfo?.id));
    }
  }, [finalizedEvents, userBasicInfo]);

  return {
    finalizedEvents: finalizedEvents ?? [],
    isLoading,
    error,
    refetch,
  };
};
