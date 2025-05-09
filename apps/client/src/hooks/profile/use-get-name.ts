import { trpc } from "../../trpc/client";
import { useEffect } from "react";
import { useUserBasicInfoStore } from "@/store/use-user-basic-info-store";

export const useGetName = () => {
    const query = trpc.profile.getName.useQuery();
    const setName = useUserBasicInfoStore((state) => state.setName)

    useEffect(() => {
        if (query.isSuccess) {
            setName(query.data.name)
            if (process.env.NODE_ENV !== "production") {
                console.log("User's name fetched successfully")
            }
        }
        if (query.isError) {
            setName("")
            if (process.env.NODE_ENV !== "production") {
                console.log(`Failed to fetch user's name: ${query.error.message}`);
            }
        }
    }, [query.isSuccess, query.isError, query.error])

    return query
}