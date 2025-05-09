import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const useCreatePendingEvent = () => {
    const utils = trpc.useUtils();
    const router = useRouter();
    const { mutateAsync: createPendingEvent } = trpc.events.createPendingEvent.useMutation({
        onSuccess: async () => {
            toast.success("Event created successfully");
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
            toast.error(`Failed to create event: ${error.message}`);
        },
    });

    return { createPendingEvent };
};
