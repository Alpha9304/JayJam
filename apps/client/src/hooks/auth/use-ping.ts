'use client';

import { useUserBasicInfoStore } from "@/store/use-user-basic-info-store";
import { trpc } from "@/trpc/client";
import { useEffect } from "react";
import { toast } from "sonner";

export function usePing() {
    const query = trpc.auth.ping.useQuery(undefined, {
        retry: false,
        gcTime: 0,
        staleTime: 0,
    });

    const logSession = () => {
        if (query) {
            if (query.data) {
                console.log(`Session from server: ${query.data.userSession}`)
                console.log(`User info:`, query.data.userBasicInfo);
            }
            if (query.error) {
                console.log(`Failed to get session: ${query.error.message}`)
                toast.error(`Failed to get session: ${query.error.message}`);
            }
        }
    }

    const { setUserBasicInfo } = useUserBasicInfoStore();
    
    useEffect(() => {
        if (query.data?.userBasicInfo) {
            setUserBasicInfo(query.data.userBasicInfo);
            logSession();
        }
    }, [query.data, setUserBasicInfo]);

    return query;
}