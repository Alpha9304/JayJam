import { trpc } from "@/trpc/client";
import { toast } from "sonner";

export const useVoteLocation = () => {
  const utils = trpc.useUtils();

  // vote for a location
  const { mutateAsync: voteLocation } = trpc.events.voteLocation.useMutation({
    onSuccess: () => {
      toast.success("Vote recorded successfully");
      // Invalidate the location options query to refetch the list
      utils.events.getLocationOptions.invalidate();
    },
    onError: () => {
      toast.error("Failed to record vote");
    },
  });

  // take back vote for a location
  const { mutateAsync: unvoteLocation } = trpc.events.unvoteLocation.useMutation({
    onSuccess: () => {
      toast.success("Vote rescinded successfully");
      // Invalidate the location options query to refetch the list
      utils.events.getLocationOptions.invalidate();
    },
    onError: () => {
      toast.error("Failed to rescind vote");
    },
  });

  return { voteLocation, unvoteLocation };
}; 