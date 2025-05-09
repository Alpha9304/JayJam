'use client';

import { useUserBasicInfoStore } from "@/store/use-user-basic-info-store";
import { trpc } from "@/trpc/client";
import { useEffect } from "react";
import { toast } from "sonner";

export function usePing() {
    const { setUserBasicInfo } = useUserBasicInfoStore();
    const query = trpc.auth.ping.useQuery(undefined, {
        retry: false,
        gcTime: 0,
        staleTime: 0,
    });
    
    // useEffect(() => {
    //     if (query.isSuccess) {
    //         toast.success("Ping successful");
    //         setUserBasicInfo(query.data.userBasicInfo);
    //         // logSession();
    //     }
    //     if (query.isError) {
    //         toast.error("Error pinging server");
    //     }
    // }, [query.isError, query.isSuccess]);
    
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
    
    useEffect(() => {
        if (query.data?.userBasicInfo) {
            logSession();
            setUserBasicInfo(query.data.userBasicInfo);
        }
    }, [query.data, setUserBasicInfo]);

    return query;

    // return {
    //     query,
    //     isLoading: query.isLoading,
    //     error: query.error,
    //     refetch: query.refetch,
    // };
}