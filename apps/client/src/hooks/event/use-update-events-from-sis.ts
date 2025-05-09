import { trpc } from "@/trpc/client";
import { useEffect } from "react";
import { toast } from "sonner";

export const useUpdateEventsFromSis = () => {
    const mutation = trpc.sisLink.updateSisData.useMutation();

    useEffect(() => {
        if (mutation.isSuccess) {
            toast.success('SIS data updated successfully');
        }
        if (mutation.isError) {
            toast.error(`Failed to update SIS data: ${mutation.error.message}`);
        }
    }, [mutation.isSuccess, mutation.isError, mutation.error]);

    return mutation;
}