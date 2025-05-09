import { trpc } from "../../trpc/client";
import { useEffect } from "react";
import { useUserBasicInfoStore } from "@/store/use-user-basic-info-store";

export const useGetEmail = () => {
	const query = trpc.profile.getEmail.useQuery();
	const setEmail = useUserBasicInfoStore((state) => state.setEmail)

    useEffect(() => {
        if (query.isSuccess) {
            setEmail(query.data.email)
            if (process.env.NODE_ENV !== "production") {
                console.log("User's email fetched successfully")
            }
        } else if (query.isError) {
            setEmail("")
            if (process.env.NODE_ENV !== "production") {
                console.error(`Failed to fetch user's email: ${query.error.message}`);
            }
        }
    }, [query.isSuccess, query.isError, query.error])

	return query
}