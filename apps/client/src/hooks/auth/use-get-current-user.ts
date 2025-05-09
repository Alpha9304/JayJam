"use client";

import { useUserBasicInfoStore } from "@/store/use-user-basic-info-store";
import { trpc } from "@/trpc/client";

export function useGetCurrentUser() {
    const query = trpc.auth.ping.useQuery();
    const { setUserBasicInfo } = useUserBasicInfoStore();

    if (query.isLoading) {
        return { isLoading: true };
    }

    // Update the store with user data
    if (query.data?.userBasicInfo) {
        setUserBasicInfo(query.data.userBasicInfo);
    }

    return query.data?.userBasicInfo;
}