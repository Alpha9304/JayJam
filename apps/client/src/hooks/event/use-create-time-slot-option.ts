import { trpc } from "@/trpc/client";
import { toast } from "sonner";

export const useCreateTimeSlotOption = () => {
    const { mutateAsync: addTimeOption } = trpc.events.addTimeOption.useMutation({
        onSuccess: () => {
            toast.success("Time slot option added successfully");
        },
        onError: () => {
            toast.error("Failed to add time slot option");
        },
    });

    return { addTimeOption };
}