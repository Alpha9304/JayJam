'use client';

import { trpc } from "@/trpc/client";
import React from "react";
import { toast } from "sonner";

interface GetHelloProps {
    name: string;
}

export function useGetHello({name}: GetHelloProps) {
    const query = trpc.helloWorld.hello.useQuery(
        { name },
        {
            enabled: false,
            retry: false,
            gcTime: 0,
            staleTime: 0,
        }
    );

    React.useEffect(() => {
        if (query.data) {
            toast.success(`Successfully got your greeting: ${query.data.greeting}`);
        }
        if (query.error) {
            toast.error(`Failed to get greeting: ${query.error.message}`);
        }
    }, [query.data, query.error]);

    return query;
}