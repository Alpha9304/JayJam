import { ResponsiveDialog } from "../responsive-dialog";
import { EventChatElement } from "./event-chat-element";



interface EventChatDialogProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: number;
    title: string;
    isPending?: boolean;
  }

export function EventChatDialog({
    isOpen,
    onClose,
    eventId,
    title,
    isPending = false,
  }: EventChatDialogProps) {


    return (
       <ResponsiveDialog open={isOpen} onOpenChange={(open) => {
                   if (!open) onClose();
               }}>
                   <div className="flex flex-col gap-4">
                       <div className="flex-1">
                           <EventChatElement
                                eventId={eventId}
                                title={title}
                                isPending={isPending}
                           />
                       </div>
                   </div>
               </ResponsiveDialog>
    )
}