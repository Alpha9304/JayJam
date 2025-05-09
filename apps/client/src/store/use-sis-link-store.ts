import { create } from 'zustand';

interface IsisLinkState {
  isDialogOpen: boolean;
  isisLink: string;
  setIsDialogOpen: (isOpen: boolean) => void;
  setIsisLink: (link: string) => void;
  resetLink: () => void;
}

export const useSisLinkStore = create<IsisLinkState>((set) => ({
  isDialogOpen: false,
  isisLink: '',
  setIsDialogOpen: (isOpen) => set({ isDialogOpen: isOpen }),
  setIsisLink: (link) => set({ isisLink: link }),
  resetLink: () => set({ isisLink: '' }),
})); 