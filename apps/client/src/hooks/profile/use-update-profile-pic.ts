import { trpc } from "../../trpc/client";
import { profilePicStore } from "@/store/profile-picture-store";
import { toast } from "sonner";
import { TRPCClientError } from "@trpc/client";

export const useUpdateProfilePic = () => {
    const mutation = trpc.profile.updateProfilePic.useMutation();
    const { setPicture } = profilePicStore();

    const updatePicture = async (newPic: File) => {
        try {
            const base64String = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result;
                    if (typeof result === "string") {
                        resolve(result); // resolve with the base64 string
                    } else {
                        reject(new Error("Failed to read the file"));
                    }
                };

                reader.onerror = () => {
                    reject(new Error("Error reading the file"));
                };

                reader.readAsDataURL(newPic); // read the file as base64
            });

            try {
                await mutation.mutateAsync({ newPic: base64String.split(',')[1] });
                setPicture(newPic);

                toast.success("Successfully updated profile picture!");
            } catch (error) {
                if (error instanceof TRPCClientError) {
                    const errorData = JSON.parse(error.message);
                    if (Array.isArray(errorData)) {
                        const errorMessage = errorData[0]?.message || "Validation error";
                        toast.error(errorMessage);
                    } else {
                        toast.error("Error updating profile picture.");
                    }
                } else {
                    toast.error("Error updating profile picture.");
                }
            }
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message || "An error occurred while updating profile picture.");
            }
        }
    };

    return { updatePicture };
};