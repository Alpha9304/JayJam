import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CalendarClockIcon, UsersIcon, MapPinIcon, MessageCircleIcon } from "lucide-react";
import { useState } from "react";
import LeaveEventDialog from "./leave-event-dialog";
import { EventChatDialog } from "./event-chat-dialog";
import { EventAdminDialog } from "./event-admin-dialog";

interface FinalizedEventItemProps {
  title: string;
  description: string;
  possibleStartTime: string;
  possibleEndTime: string;
  participantLimit: number | null;
  registrationDeadline: string;
  isParticipant?: boolean;
  isCreator?: boolean;
  onExit?: () => void;
  id: number;
  location: string | null;
}

export function FinalizedEventItem({
  title,
  description,
  possibleStartTime,
  possibleEndTime,
  participantLimit,
  registrationDeadline,
  isParticipant = false,
  isCreator,
  onExit,
  id,
  location,
}: FinalizedEventItemProps) {
  const [leaveEventDialogOpen, setLeaveEventDialogOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  return (
    <>
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="space-y-4">
          
          <div>
            <h3 className="text-lg font-semibold">{title}
            <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsChatOpen(true)}
                  className="h-8 w-8"
                >
                  <MessageCircleIcon className="h-4 w-4" />
                </Button>
            </h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex gap-2">
              {isCreator && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsAdminOpen(true)}
                    className="h-8 w-8"
                  >
                    <UsersIcon className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CalendarClockIcon className="h-4 w-4" />
              <div>
                <p>Time: {new Date(possibleStartTime).toLocaleString()} - {new Date(possibleEndTime).toLocaleString()}</p>
              </div>
            </div>

            {location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPinIcon className="h-4 w-4" />
                <span>Location: {location}</span>
              </div>
            )}

            {participantLimit !== null && participantLimit != 0 ? (
              <div className="flex items-center gap-2 text-sm">
                <UsersIcon className="h-4 w-4" />
                <span>Participant limit: {participantLimit}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <UsersIcon className="h-4 w-4" />
                <span>No participant limit</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Registration deadline: {new Date(registrationDeadline).toLocaleString()}
            </p>
            {isParticipant && (
              <Button
                onClick={() => setLeaveEventDialogOpen(true)}
                variant="destructive"
                data-testid="leave_event_btn"
              >
                Leave Event
              </Button>
            )}
          </div>
        </div>
      </Card>
      <EventChatDialog
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        eventId={id}
        title={title}
        isPending={false}
      />
      <LeaveEventDialog
        leaveEventDialogOpen={leaveEventDialogOpen}
        setLeaveEventDialogOpen={setLeaveEventDialogOpen}
        eventId={id}
        onLeave={onExit}
      />
      <EventAdminDialog
              isOpen={isAdminOpen}
              onClose={() => setIsAdminOpen(false)}
              eventId={id}
              title={title}
              pending={false}
            />
    </>
  );
} 