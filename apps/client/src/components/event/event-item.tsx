import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SettingsIcon, Trash2Icon, CalendarClockIcon, UsersIcon, InfoIcon, MessageCircleIcon } from "lucide-react";
import { useState } from "react";
import { EventDetailsDialog } from "./event-details-dialog";
import LeaveEventDialog from "./leave-event-dialog";
import { EventChatDialog } from "./event-chat-dialog";
import { EventAdminDialog } from "./event-admin-dialog";

interface EventItemProps {
  title: string;
  description: string;
  possibleStartTime: string;
  possibleEndTime: string;
  participantLimit: number | null;
  registrationDeadline: string;
  isCreator: boolean;
  isParticipant?: boolean;
  onJoin?: () => void;
  onExit?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  id: number;
  isFinalized: boolean;
}

export function EventItem({
  title,
  description,
  possibleStartTime,
  possibleEndTime,
  participantLimit,
  registrationDeadline,
  isCreator,
  isParticipant = false,
  onJoin,
  onExit,
  onEdit,
  onDelete,
  id,
  isFinalized
}: EventItemProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const isRegistrationOpen = new Date(registrationDeadline) > new Date();
  const [leaveEventDialogOpen, setLeaveEventDialogOpen] = useState(false);


  return (
    <>
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{title}
              {isParticipant && (
              <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsChatOpen(true)}
                  className="h-8 w-8"
                >
                  <MessageCircleIcon className="h-4 w-4" />
                </Button>
              )}
              </h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="flex gap-2">
              {!isCreator && isParticipant && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDetailsOpen(true)}
                  className="h-8 w-8"
                >
                  <InfoIcon className="h-4 w-4" />
                </Button>
              )}
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onEdit}
                    className="h-8 w-8"
                  >
                    <SettingsIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDelete}
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CalendarClockIcon className="h-4 w-4" />
              <div>
                <p>Possible time: {new Date(possibleStartTime).toLocaleString()} - {new Date(possibleEndTime).toLocaleString()}</p>
              </div>
            </div>

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
            {/* only non-finalized*/}
            {!isCreator && !isFinalized && (
              <>
                {isParticipant ? (
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setIsDetailsOpen(true)}
                      variant="outline"
                    >
                      View Details
                    </Button>
                    <Button  
                      onClick={onExit}
                      variant="destructive"
                    >
                      Exit Event
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={onJoin}
                    disabled={!isRegistrationOpen}
                    variant={isRegistrationOpen ? "default" : "secondary"}
                  >
                    {isRegistrationOpen ? "Join Event" : "Registration Closed"}
                  </Button>
                )}

                
                
              </>
            )}
            {/*leave finalized; event */}
            {isFinalized && (
              <Button  
              onClick={() => {setLeaveEventDialogOpen(!leaveEventDialogOpen)}}
              variant="destructive"
              data-testid = "leave_event_btn"
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
        isPending={!isFinalized}
      />
      <EventDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        eventId={id}
        title={title}
      />
      <LeaveEventDialog
        leaveEventDialogOpen={leaveEventDialogOpen}
        setLeaveEventDialogOpen={setLeaveEventDialogOpen}
        eventId={id}
      />
      <EventAdminDialog
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        eventId={id}
        title={title}
        pending={true}
      />
    </>
  );
} 