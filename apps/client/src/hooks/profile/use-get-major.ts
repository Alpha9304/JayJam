import { trpc } from "../../trpc/client";
import { useEffect } from "react";
import { useUserBasicInfoStore } from "@/store/use-user-basic-info-store";

export const useGetMajor = () => {
    const query = trpc.profile.getMajor.useQuery();
    const { setMajor } = useUserBasicInfoStore();

    useEffect(() => {
        if (query.isSuccess) {
            setMajor(query.data.major)
            if (process.env.NODE_ENV !== "production") {
                console.log("User's major fetched successfully")
            }
        }
        if (query.isError) {
            setMajor("")
            if (process.env.NODE_ENV !== "production") {
                console.log(`Failed to fetch user's major: ${query.error.message}`);
            }
        }
    }, [query.isSuccess, query.isError, query.error])

    return query
}