import { trpc } from "@/trpc/client";
import { toast } from "sonner";

export const useFinalizePendingEvent = () => {
  const utils = trpc.useUtils();  // TRPC utilities for invalidation/refetching

  const mutation = trpc.events.finalizeEvent.useMutation({
    onSuccess: async () => {
      toast.success("Event finalized successfully.");
      
      // 👇 Invalidate these queries, forcing them to refresh automatically
      await Promise.all([
        utils.events.getPendingEvents.invalidate(),
        utils.events.getPendingEventsByGroup.invalidate(),
        utils.events.getFinalizedEvents.invalidate(),
      ]);
    },
    onError: (error) => {
      toast.error(`Failed: ${error.message}`);
    },
  });

  const finalizePendingEvent = (input: Parameters<typeof mutation.mutateAsync>[0]) => mutation.mutateAsync(input);

  return { finalizePendingEvent, isPending: mutation.isPending };
};
