"use client";

import { trpc } from "@/trpc/client";
import { useEffect } from "react";
import { toast } from "sonner";

export const useGetEvents = () => {
    const query = trpc.events.getEvents.useQuery();
    console.log("here is frontend");

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