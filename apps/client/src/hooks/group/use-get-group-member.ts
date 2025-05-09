import { trpc } from "@/trpc/client";

import { useEffect } from "react";
import { toast } from "sonner";

export const useGetGroupMembers = (groupId: number) => {
    const query = trpc.group.getGroupMembers.useQuery({ groupId });

    useEffect(() => {
        if (query.isSuccess) {
            toast.success('Group members fetched successfully');
        }
        if (query.isError) {
            toast.error(`Failed to fetch group members: ${query.error.message}`);
        }
    }, [query.isSuccess, query.isError, query.error]);

    return query;
}