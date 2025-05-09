import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useUserInfo } from "@/hooks/auth/use-user-info";

export const useRemoveFromPendingEvent = () => {
    const utils = trpc.useUtils();
    const { userBasicInfo } = useUserInfo();
  
    const removeMutation = trpc.events.removePendingParticipant.useMutation({
      onSuccess: (_data, variables) => {
        toast.success("Successfully removed participant");
  
        // ✅ Invalidate the list for the specific event
        utils.events.getPendingParticipants.invalidate({ eventId: variables.eventId });
      },
      onError: (error) => {
        console.error("Failed to remove participant:", error);
        toast.error("Failed to remove participant");
      },
    });

    const banMutation = trpc.events.banParticipant.useMutation({
      onSuccess: () => {
        toast.success("Successfully banned participant");
      },
      onError: (error) => {
        console.error("Failed to ban participant:", error);
        toast.error("Failed to ban participant");
      },
    })
  
    const removeEvent = async (eventId: number, userId: number) => {
      if (!userBasicInfo?.id) {
        toast.error("You must be logged in to manage participants");
        return;
      }
  
      await banMutation.mutateAsync({eventId, userId});
      await removeMutation.mutateAsync({ eventId, userId });
    };
  
    return { removeEvent };
  };
