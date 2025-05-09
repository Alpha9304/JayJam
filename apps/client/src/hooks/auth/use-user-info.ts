import { useUserBasicInfoStore } from "@/store/use-user-basic-info-store";

export function useUserInfo() {
    const userBasicInfo = useUserBasicInfoStore((state) => state.userBasicInfo);
    return {
        userBasicInfo,
        isLoading: !userBasicInfo, // if we don't have user info, consider it as loading
    };
} 