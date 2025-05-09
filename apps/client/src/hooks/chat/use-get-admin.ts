"use client";

import { trpc } from "@/trpc/client";
import { useEffect } from "react";
import { toast } from "sonner";

export const useGetAdmin = (channelId : number | null) => {
    const query = trpc.chat.getAdmin.useQuery({channelId: channelId ?? -1}, {enabled: !!channelId});

    useEffect(() => {
        if (query.isSuccess) {
            toast.success("Events fetched successfully");
        }
        if (query.isError) {
            toast.error("Error fetching events");
        }
    }, [query.isError, query.isSuccess]);

    return query;
}