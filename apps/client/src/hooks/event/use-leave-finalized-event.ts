'use client';

import { trpc } from "@/trpc/client";
import { TRPCClientError } from "@trpc/client";
import { toast } from "sonner";


export function useLeaveFinalizedEvent() {
  const utils = trpc.useUtils();
  const mutation = trpc.events.removeEventParticipant.useMutation({
    onSuccess: async () => {
      toast.success("You have left the event.");
      // Invalidate both the finalized events and the specific event
      await utils.events.getFinalizedEvents.invalidate();
    },
    onError: (error: unknown) => {
      let message = "";
      if (error instanceof TRPCClientError) {
        message = error.message;
      }
      toast.error(`Failed to leave the event: ${message}`);
    }
  });

  const handleLeave = async (eventId: number) => {
    try {
      await mutation.mutateAsync({ eventId });
      return { success: true };
    } catch (error) {
      console.error("Error leaving event:", error);
      return { success: false };
    }
  };

  return { mutation, handleLeave };
}
