'use client';

import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import React from "react";

export function useGetLuckyNumber() {
    const query = trpc.helloWorld.luckyNumber.useQuery(undefined, {
        enabled: false,
        retry: false,
        gcTime: 0,
        staleTime: 0,
    });

    // Handle success/error effects separately
    React.useEffect(() => {
        if (query.data) {
            toast.success(`Successfully got your lucky number: ${query.data.number}!`);
        }
        if (query.error) {
            toast.error(`Failed to get lucky number: ${query.error.message}`);
        }
    }, [query.data, query.error]);

    return query;
}