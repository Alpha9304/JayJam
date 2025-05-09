import { create } from "zustand";

interface UserBasicInfo {
    id: number;
    email: string;
    name: string;
    pronouns: string;
    major: string;
}

interface UserBasicInfoStore {
    userBasicInfo: UserBasicInfo;
    setUserBasicInfo: (info: UserBasicInfo) => void;
    setName: (name : string) => void;
    setEmail: (email : string) => void;
    setMajor: (major : string) => void;
    setPronouns: (pronouns : string) => void;
    clearUserBasicInfo: () => void;
}

export const useUserBasicInfoStore = create<UserBasicInfoStore>((set) => ({
    userBasicInfo: {
        id: 0,
        email: "",
        name: "",
        pronouns: "",
        major: ""
    },
    setUserBasicInfo: (info) => set({ userBasicInfo: info }),
    setName: (name) => set((state) => ({
        userBasicInfo: { ...state.userBasicInfo, name }
    })),
    setEmail: (email) => set((state) => ({
        userBasicInfo: { ...state.userBasicInfo, email }
    })),
    setMajor: (major) => set((state) => ({
        userBasicInfo: { ...state.userBasicInfo, major }
    })),
    setPronouns: (pronouns) => set((state) => ({
        userBasicInfo: { ...state.userBasicInfo, pronouns }
    })),
    clearUserBasicInfo: () => set({ 
        userBasicInfo: {
            id: 0,
            email: "",
            name: "",
            pronouns: "",
            major: ""
        }
    }),
}));
