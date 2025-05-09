import { useCreateEventDialog } from "@/store/use-dialog";
import { ResponsiveDialog } from "../responsive-dialog";
import CreatePersonalEventForm from "./create-personal-event-form";

interface CreatePersonalEventDialogProps {
    onEventCreated?: () => void;
}

export const CreatePersonalEventDialog = ({ onEventCreated }: CreatePersonalEventDialogProps) => {
    const { isDialogOpen, closeDialog } = useCreateEventDialog();

    return (
        <ResponsiveDialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) closeDialog();
        }}>
            <CreatePersonalEventForm onCancel={closeDialog} onSubmit={onEventCreated ? onEventCreated : () => {}}/>
        </ResponsiveDialog>
    )
}
