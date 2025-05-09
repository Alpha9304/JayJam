import { trpc } from "@/trpc/client";
import { toast } from "sonner";

export const useVoteTime = () => {
  const utils = trpc.useUtils();

  // vote for a time
  const { mutateAsync: voteTime } = trpc.events.voteTime.useMutation({
    onSuccess: () => {
      toast.success("Vote recorded successfully");
      // Invalidate the time options query to refetch the list
      utils.events.getTimeOptions.invalidate();
    },
    onError: () => {
      toast.error("Failed to record vote");
    },
  });

  // take back vote for a time
  const { mutateAsync: unvoteTime } = trpc.events.unvoteTime.useMutation({
    onSuccess: () => {
      toast.success("Vote rescinded successfully");
      // Invalidate the time options query to refetch the list
      utils.events.getTimeOptions.invalidate();
    },
    onError: () => {
      toast.error("Failed to rescind vote");
    },
  });

  return { voteTime, unvoteTime };
}; 