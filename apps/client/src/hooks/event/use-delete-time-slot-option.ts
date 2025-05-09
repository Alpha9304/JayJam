import { trpc } from "../../trpc/client";
import { toast } from "sonner";

export const useDeleteTimeSlotOption = () => {
    const utils = trpc.useUtils();
    const { mutateAsync: deleteTimeOption } = trpc.events.deleteTimeOption.useMutation({
        onSuccess: () => {
            toast.success("Time slot option deleted successfully");
            // Invalidate the time options query to refetch the list
            utils.events.getTimeOptions.invalidate();
        },
        onError: () => {
            toast.error("Failed to delete time slot option");
        },
    });

    return { deleteTimeOption };
};
