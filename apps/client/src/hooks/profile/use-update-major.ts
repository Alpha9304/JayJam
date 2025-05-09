import { trpc } from "@/trpc/client";
import { useUserBasicInfoStore } from "@/store/use-user-basic-info-store";
import { toast } from "sonner";
import { TRPCClientError } from "@trpc/client";

function useUpdateMajor() {
    const mutation = trpc.profile.updateMajor.useMutation();
    const { setMajor } = useUserBasicInfoStore();

    const updateMajor = async (newMajor: string) => {
        try {
            const result = await mutation.mutateAsync({newMajor: newMajor});
            setMajor(result.major ?? "");
            toast.success("Successfully updated major!");
        } catch (error) {
            if (error instanceof TRPCClientError) {
                try {
                  const errorData = JSON.parse(error.message);
                  if (Array.isArray(errorData)) {
                    const errorMessage = errorData[0]?.message || "Validation error";
                    toast.error(errorMessage);
                  } else {
                    toast.error("Error updating major.");
                  }
                } catch {
                  toast.error("Error updating major.");
                }
            }
        }
    }

    return { updateMajor }
}

export default useUpdateMajor;