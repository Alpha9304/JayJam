import { trpc } from "../../trpc/client";
import { useEffect } from "react";
import { useUserBasicInfoStore } from "@/store/use-user-basic-info-store";

export const useGetPronouns = () => {
    const query = trpc.profile.getPronouns.useQuery();
    const setPronouns = useUserBasicInfoStore((state) => state.setPronouns)

    useEffect(() => {
        if (query.isSuccess) {
            setPronouns(query.data.pronouns)
            if (process.env.NODE_ENV !== "production") {
                console.log("User's pronouns fetched successfully")
            }
        }
        if (query.isError) {
            setPronouns("")
            if (process.env.NODE_ENV !== "production") {
                console.log(`Failed to fetch user's pronouns: ${query.error.message}`);
            }
        }
    }, [query.isSuccess, query.isError, query.error])

    return query
}