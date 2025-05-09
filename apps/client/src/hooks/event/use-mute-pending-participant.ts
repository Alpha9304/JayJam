import { toast } from "sonner";
import { trpc } from "../../trpc/client";

export const useMutePendingParticipant = () => {
    const utils = trpc.useUtils();
  
    const {
      mutateAsync: muteParticipantMutation,
      isSuccess,
      isError,
    } = trpc.events.mutePendingParticipant.useMutation({
      onSuccess: (_data, variables) => {
        toast.success("Successfully muted user.");
        // Optional: Invalidate participants list if your UI shows it
        utils.events.getPendingParticipants.invalidate({ eventId: variables.eventId });
      },
      onError: (error) => {
        console.error("Failed to mute user:", error);
        toast.error("Failed to mute user");
      },
    });
  
    const mutePendingParticipant = async (eventId: number, userId: number) => {
      await muteParticipantMutation({ eventId, userId });
    };
  
    return {
      mutePendingParticipant,
      isSuccess,
      isError,
    };
  };