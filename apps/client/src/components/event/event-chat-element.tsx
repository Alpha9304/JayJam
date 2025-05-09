import { DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { ChatWindow } from '../chat/chat-window';

interface ChatProps {
    eventId: number;
    title: string;
    isPending?: boolean;
}

export function EventChatElement({
    eventId,
    title,
    isPending
}: ChatProps) {
    return (
        <div className="space-y-6 px-6 pb-4">
            <DialogHeader className="space-y-2 mt-4">
                <DialogTitle className="text-2xl font-bold">Chat</DialogTitle>
                <DialogDescription className="text-gray-500">
                    {`Discuss details of event ${title} here!`}
                </DialogDescription>
            </DialogHeader>

            <ChatWindow 
                eventId={eventId}
                isPending={isPending}
            />
        </div>
    );
}