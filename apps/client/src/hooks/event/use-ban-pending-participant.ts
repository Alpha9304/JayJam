import { toast } from "sonner";
import { trpc } from "../../trpc/client";

export const useBanPendingParticipant = () => {
    const utils = trpc.useUtils();
    const {
      mutateAsync: banParticipantMutation,
      isSuccess,
      isError,
    } = trpc.events.muteFinalizedParticipant.useMutation({
      onSuccess: (_data, variables) => {
        toast.success("Successfully muted user.");
        // Optional: Invalidate participants list if your UI shows it
        utils.events.getFinalizedParticipants.invalidate({ eventId: variables.eventId });
      },
      onError: (error) => {
        console.error("Failed to mute user:", error);
        toast.error("Failed to mute user");
      },
    });
  
    const banPendingParticipant = async (eventId: number, userId: number) => {
      await banParticipantMutation({ eventId, userId });
    };
  
    return {
        banPendingParticipant,
        isSuccess,
        isError,
    };
  };