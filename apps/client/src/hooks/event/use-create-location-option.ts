import { trpc } from "@/trpc/client";
import { toast } from "sonner";

export const useCreateLocationOption = () => {
    const { mutateAsync: addLocationOption } = trpc.events.addLocationOption.useMutation({
        onSuccess: () => {
            toast.success("Location option added successfully");
        },
        onError: () => {
            toast.error("Failed to add location option");
        },
    });

    return { addLocationOption };
    
}