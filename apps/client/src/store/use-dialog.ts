import { create } from "zustand";

interface DialogState {
    isDialogOpen: boolean;
    openDialog: () => void;
    closeDialog: () => void;
}

interface UpdateEventDialogState extends DialogState {
    eventId: number | null;
    setEventId: (id: number) => void;
}

interface ConfirmDialogState {
    isDialogOpen: boolean;
    ableToClose: false;
    openDialog: () => void;
    closeDialog: () => void;
}

export const useCreateEventDialog = create<DialogState>((set) => ({
    isDialogOpen: false,
    openDialog: () => set({ isDialogOpen: true }),
    closeDialog: () => set({ isDialogOpen: false }),
}));

export const useUpdateEventDialog = create<UpdateEventDialogState>((set) => ({
    isDialogOpen: false,
    eventId: null,
    openDialog: () => set({ isDialogOpen: true }),
    closeDialog: () => set({ isDialogOpen: false, eventId: null }),
    setEventId: (id: number) => set({ eventId: id }),
}));

export const useChatEventDialog = create<DialogState>((set) => ({
    isDialogOpen: false,
    openDialog: () => set({ isDialogOpen: true }),
    closeDialog: () => set({ isDialogOpen: false }),
}));

export const useConfirmationDialog = create<ConfirmDialogState>((set) => ({
    isDialogOpen: false,
    ableToClose: false,
    openDialog: () => set({ isDialogOpen: true }),
    closeDialog: () => set({ isDialogOpen: false, ableToClose: false })
}));
