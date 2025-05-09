import { trpc } from "@/trpc/client";
import { useUserBasicInfoStore } from "@/store/use-user-basic-info-store";
import { toast } from "sonner";
import { TRPCClientError } from "@trpc/client";

function useUpdatePronouns() {
    const mutation = trpc.profile.updatePronouns.useMutation();
    const { setPronouns } = useUserBasicInfoStore();

    const updatePronouns = async (newPronouns: string) => {
        try {
            const result = await mutation.mutateAsync({newPronouns: newPronouns});
            setPronouns(result.pronouns ?? "");
            toast.success("Successfully updated pronouns!");
        } catch (error) {
            if (error instanceof TRPCClientError) {
                try {
                  const errorData = JSON.parse(error.message);
                  if (Array.isArray(errorData)) {
                    const errorMessage = errorData[0]?.message || "Validation error";
                    toast.error(errorMessage);
                  } else {
                    toast.error("Error updating pronouns.");
                  }
                } catch {
                  toast.error("Error updating pronouns.");
                }
            }
        }
    }

    return { updatePronouns }
}

export default useUpdatePronouns;