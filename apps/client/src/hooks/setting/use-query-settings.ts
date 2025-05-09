import { trpc } from "../../trpc/client";
import { useEffect } from "react";
import { useTheme } from "@/store/context/ThemeContext";

export const useQuerySettings = () => {
	const query = trpc.settings.getTheme.useQuery();
	const { setTheme } = useTheme();

	useEffect(() => {
		if (query.isSuccess) {
			setTheme(query.data.theme)
			if (process.env.NODE_ENV !== "production") {
				console.log("User's theme fetched successfully")
			}
		}
		if (query.isError) {
			setTheme("light")
			if (process.env.NODE_ENV !== "production") {
				console.log(`Failed to fetch user's theme: ${query.error.message}`);
			}
		}
	}, [query.isSuccess, query.isError, query.error])

	return query
}