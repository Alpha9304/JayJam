import { trpc } from "@/trpc/client";
import { toast } from "sonner";

export const useCreatePersonalEvent = () => {
    const { mutateAsync: createPersonalEvent } = trpc.events.createPersonalEvent.useMutation({
        onSuccess: () => {
            toast.success("Event created successfully");
        },
        onError: () => {
            toast.error("Failed to create event");
        },
    });     

    return { createPersonalEvent };
};
