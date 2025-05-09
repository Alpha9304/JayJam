import { useUpdateEventDialog } from "@/store/use-dialog";
import { ResponsiveDialog } from "../responsive-dialog";
import UpdateEventForm from "./update-event-form";

export const UpdateEventDialog = () => {
    const { isDialogOpen, closeDialog, eventId } = useUpdateEventDialog();

    if (!eventId) return null;

    return (
        <ResponsiveDialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) closeDialog();
        }}>
            <div className="flex flex-col gap-4">
                <div className="flex-1">
                    <UpdateEventForm
                        eventId={eventId}
                        onCancel={closeDialog}
                    />
                </div>
            </div>
        </ResponsiveDialog>
    )
}
