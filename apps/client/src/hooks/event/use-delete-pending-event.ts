import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const useDeletePendingEvent = () => {
    const utils = trpc.useUtils();
    const router = useRouter();
    const { mutateAsync: deletePendingEvent, isPending } = trpc.events.deletePendingEvent.useMutation({
        onSuccess: async () => {
            toast.success("Event deleted successfully");
            // Invalidate the pending events query to refetch the list
            // Invalidate all relevant queries
            await Promise.all([
                utils.events.getPendingEvents.invalidate(),
                utils.events.getPendingEventsByGroup.invalidate()
            ]);
            // Add a small delay before refresh to ensure invalidation is processed
            setTimeout(() => {
                router.refresh();
            }, 100);

        },
        onError: (error) => {
            toast.error(`Failed to delete event: ${error.message}`);
        }
    });

    return { deletePendingEvent, isPending };
}