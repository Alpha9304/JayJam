import { trpc } from "@/trpc/client";
import { toast } from "sonner";

export const useDeleteLocationOption = () => {
    const utils = trpc.useUtils();
    const { mutateAsync: deleteLocationOption } = trpc.events.deleteLocationOption.useMutation({
        onSuccess: (data) => {
            toast.success("Location option deleted successfully");
            // Invalidate the location options query to refetch the list
            utils.events.getLocationOptions.invalidate();
            if (data.success) {
                toast.success("Location option deleted successfully");
            } else {
                toast.error("Failed to delete location option");
            }
        },
        onError: () => {
            toast.error("Failed to delete location option");
        },
    });

    return { deleteLocationOption };
};
