import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { TRPCClientError } from "@trpc/client";

function useCheckName() {
	const checker = trpc.profile.checkNameSchema.useMutation();

	const checkName = async (newName: string) => {
		try {
			await checker.mutateAsync({newName: newName});
			return true;
		} catch (error) {
			if (error instanceof TRPCClientError) {
				toast.error("Please enter a valid name (e.g., John, John Apple, or John Apple-Smith).");
				return false;
			}
		}
	}

	return { checkName }
}

export default useCheckName;

