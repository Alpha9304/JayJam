import { trpc } from "@/trpc/client";
import { toast } from "sonner";

export const useJoinEvent = () => {
    const utils = trpc.useUtils();
    const { mutateAsync: joinEvent } = trpc.events.addPendingParticipant.useMutation({
        onSuccess: async () => {
            toast.success("Successfully joined event");
            // Invalidate the pending events query to refetch the list
            await Promise.all([
                utils.events.getPendingEvents.invalidate(),
                utils.events.getPendingEventsByGroup.invalidate()
                
            ]);
        },
        onError: () => {
            toast.error("Failed to join event");
        },
    });

    return { joinEvent };
};
