import { trpc } from "../../trpc/client";
import { useState, useEffect } from "react";
import { profilePicStore } from "@/store/profile-picture-store";

export const useGetProfilePic = () => {
    const query = trpc.profile.getProfilePic.useQuery();
    const { setPicture } = profilePicStore();
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (query.isSuccess && (query.data.pic.length !== 0)) {
            const byteCharacters = atob(query.data.pic) // convert base64 string to bytes
            const byteArray = new Uint8Array(byteCharacters.length);
            for (let i= 0; i < byteCharacters.length; i++) {
                byteArray[i] = byteCharacters.charCodeAt(i)
            }

            const blob = new Blob([byteArray], { type: "image/jpeg" });
            const file = new File([blob], "Profile-Picture", { type: "image/jpeg" })
            
            setPicture(file);
            setFile(file);

            if (process.env.NODE_ENV !== "production") {
                console.log("User's profile picture fetched successfully")
            }
        } else if (query.isError) {
            setPicture(null)
            setFile(null)
            if (process.env.NODE_ENV !== "production") {
                console.error(`Failed to fetch user's profile picture: ${query.error.message}`);
            }
        } else {
            setPicture(null)
            setFile(null)
        }
    }, [query.isSuccess, query.isError, query.error])

    return file
}