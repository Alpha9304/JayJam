import { useCreateEventDialog } from "@/store/use-dialog";
import { ResponsiveDialog } from "../responsive-dialog";
import CreateEventForm from "./create-event-form";

export const CreateEventDialog = () => {
    const { isDialogOpen, closeDialog } = useCreateEventDialog();

    return (
        <ResponsiveDialog open={isDialogOpen} onOpenChange={(open) => {
            // if (!open) closeDialog();
            console.log("Dialog open: ", open)
        }}>
            <CreateEventForm onCancel={closeDialog}/>
        </ResponsiveDialog>
    )
}
