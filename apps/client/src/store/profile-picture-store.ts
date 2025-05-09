import { create } from "zustand";

interface Profile {
	picture: File | null;
}

interface ProfilePictureStore {
	profilePicture: Profile;
	setPicture: (picture : File | null) => void;
	clearPicture: () => void;
}

export const profilePicStore = create<ProfilePictureStore>((set) => ({
	profilePicture: {
		picture: null
	},
	setPicture: (picture) => set((state) => ({
		profilePicture: {...state.profilePicture, picture}
	})),
	clearPicture: () => set((state) => ({
		profilePicture: {...state.profilePicture, picture: null}
	})),
}));
