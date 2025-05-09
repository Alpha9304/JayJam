import { ResponsiveDialog } from "../responsive-dialog";
import { EventAdminElement } from "./event-admin-element";



interface EventAdminProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: number;
    title: string;
    pending: boolean;
  }

export function EventAdminDialog({
    isOpen,
    onClose,
    eventId,
    title,
    pending,
  }: EventAdminProps) {

    return (
       <ResponsiveDialog open={isOpen} onOpenChange={(open) => {
                   if (!open) onClose();
               }}>
                   <div className="flex flex-col gap-4">
                       <div className="flex-1">
                           <EventAdminElement
                                eventId={eventId}
                                title={title}
                                pending={pending}
                           />
                       </div>
                   </div>
               </ResponsiveDialog>
    )
}