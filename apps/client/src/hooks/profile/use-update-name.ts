import { trpc } from "@/trpc/client";
import { useUserBasicInfoStore } from "@/store/use-user-basic-info-store";
import { toast } from "sonner";
import { TRPCClientError } from "@trpc/client";

function useUpdateName() {
    const mutation = trpc.profile.updateName.useMutation();
    const { setName } = useUserBasicInfoStore();

    const updateName = async (newName: string) => {
        try {
            await mutation.mutateAsync({newName: newName});
            setName(newName);
            toast.success("Successfully updated name!");
        } catch (error) {
            if (error instanceof TRPCClientError) {
                try {
                  const errorData = JSON.parse(error.message);
                  if (Array.isArray(errorData)) {
                    const errorMessage = errorData[0]?.message || "Validation error";
                    toast.error(errorMessage);
                  } else {
                    toast.error("Error updating name.");
                  }
                } catch {
                  toast.error("Error updating name.");
                }
            }
        }
    }

    return { updateName }
}

export default useUpdateName;

