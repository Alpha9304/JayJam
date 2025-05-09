'use client';

import { trpc } from "@/trpc/client";
import { useEffect } from "react";
import { toast } from "sonner";
import { profilePicStore as useProfilePicStore } from "@/store/profile-picture-store";
import { useUserBasicInfoStore } from "@/store/use-user-basic-info-store";

export function useLogout() {
    const utils = trpc.useUtils();
    const mutation = trpc.auth.logout.useMutation({
        retry: false,
        gcTime: 0
    });

    const handleLogout = async () => {
        // Actually send login data
        mutation.mutate();
    }

    useEffect(() => {
        if (mutation.isSuccess) {
            // Clear user data
            useProfilePicStore.getState().clearPicture();
            useUserBasicInfoStore.getState().clearUserBasicInfo();
            // Clear all tRPC queries
            utils.invalidate();
            console.log(`Successfully logged out: ${mutation.data.message}`);
        }
        if (mutation.isError) {
            toast.error(`Failed to log out: ${mutation.error.message}`);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mutation.status])

    return {handleLogout};
}