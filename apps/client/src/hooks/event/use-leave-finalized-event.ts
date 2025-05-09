'use client';

import { trpc } from "@/trpc/client";
import { TRPCClientError } from "@trpc/client";
import { toast } from "sonner";


export function useLeaveFinalizedEvent() {
  const utils = trpc.useUtils();
  const mutation = trpc.events.removeEventParticipant.useMutation({
    retry: false,
    gcTime: 0     
  });

  const handleLeave = async (eventId: number) => {
    try {
      await mutation.mutateAsync({ eventId });
      await utils.events.getFinalizedEvents.invalidate();
      toast.success("You have left the event.");
      return { success: true };
    } catch (error) {
      if(error instanceof TRPCClientError) {
        console.error("Error leaving event:", error);
      }
      return { success: false };
    }
  };

  return { mutation, handleLeave };
}
