import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { TRPCClientError } from "@trpc/client";
import { useTheme } from "@/store/context/ThemeContext";

function useMutationSettings() {
	const mutation = trpc.settings.updateTheme.useMutation();
	const { setTheme } = useTheme();

	const updateTheme = async (newTheme: string) => {
		try {
			const result = await mutation.mutateAsync({newTheme: newTheme});
			setTheme(result.theme ?? "");
			toast.success("Successfully updated theme!");
		} catch (error) {
			if (error instanceof TRPCClientError) {
				try {
				  const errorData = JSON.parse(error.message);
				  if (Array.isArray(errorData)) {
					const errorMessage = errorData[0]?.message || "Validation error";
					toast.error(errorMessage);
				  } else {
					toast.error("Error updating theme.");
				  }
				} catch {
				  toast.error("Error updating theme.");
				}
			}
		}
	}

	return { updateTheme }
}

export {useMutationSettings};