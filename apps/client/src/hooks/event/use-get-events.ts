"use client";

import { trpc } from "@/trpc/client";
import { useEffect } from "react";
import { toast } from "sonner";

export const useGetEvents = () => {
    const query = trpc.events.getEvents.useQuery();
    // console.log("here is frontend");

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

// export function useGetEvents() {
//     const query = trpc.events.getEvents.useQuery(undefined, {
//       refetchOnWindowFocus: true,
//       staleTime: 5000, // Consistent caching strategy
//     });
  
//     useEffect(() => {
//       if (query.isSuccess) {
//         toast.success("Events fetched successfully");
//       }
//       if (query.isError) {
//         toast.error("Error fetching events" + query.error);
//         // console.error("Error fetching events:", query.error);
//       }
//     }, [query.isError, query.isSuccess, query.error]);
  
//   return {
//       query,
//       // events: query.data ?? [],
//       isLoading: query.isLoading,
//       error: query.error,
//       refetch: query.refetch,
//     };
//   };
  