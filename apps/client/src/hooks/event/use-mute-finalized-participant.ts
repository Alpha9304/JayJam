import { toast } from "sonner";
import { trpc } from "../../trpc/client";

export const useMuteFinalizedParticipant = () => {
    const utils = trpc.useUtils();
  
    const {
      mutateAsync: muteParticipantMutation,
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
  
    const muteFinalizedParticipant = async (eventId: number, userId: number) => {
      await muteParticipantMutation({ eventId, userId });
    };
  
    return {
      muteFinalizedParticipant,
      isSuccess,
      isError,
    };
  };