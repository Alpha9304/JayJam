import { AdvancedList } from "@/components/advanced-list";
import { EventItem } from "./event-item";
import { Button } from "@/components/ui/button";
import { CalendarPlusIcon } from "lucide-react";
import { useGetPendingEvents, useGetPendingEventsByGroup } from "@/hooks/event/use-get-pending-events";
import type { PendingEvent } from "@/hooks/event/use-get-pending-events";
import { useUserInfo } from "@/hooks/auth/use-user-info";
import { useDeletePendingEvent } from "@/hooks/event/use-delete-pending-event";
import { useUpdateEventDialog } from "@/store/use-dialog";
import { UpdateEventDialog } from "./update-event-dialog";
import { useExitEvent } from "@/hooks/event/use-exit-event";
import { useJoinEvent } from "@/hooks/event/use-join-event";

interface EventListProps {
  onCreateEvent?: () => void;
  groupId?: number;
}

export function PendingEventList({ onCreateEvent, groupId }: EventListProps) {
  const { pendingEvents: allEvents, isLoading: allLoading } = useGetPendingEvents();
  const { pendingEvents: groupEvents, isLoading: groupLoading } = useGetPendingEventsByGroup(groupId ?? 0);
  
  const pendingEvents = groupId ? groupEvents : allEvents;
  const isLoading = groupId ? groupLoading : allLoading;
  
  const { userBasicInfo } = useUserInfo();
  const { deletePendingEvent } = useDeletePendingEvent();
  const { openDialog: openUpdateDialog, setEventId } = useUpdateEventDialog();
  const { exitEvent } = useExitEvent();
  const { joinEvent } = useJoinEvent();

  const handleDelete = async (eventId: number) => {
    try {
      await deletePendingEvent({ eventId });
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  const handleEdit = (eventId: number) => {
    setEventId(eventId);
    openUpdateDialog();
  };

  const handleJoin = async (eventId: number) => {
    if (!userBasicInfo?.id) return;
    try {
      await joinEvent({ eventId });
    } catch (error) {
      console.error("Failed to join event:", error);
    }
  };

  const handleExit = async (eventId: number) => {
    if (!userBasicInfo?.id) return;
    try {
      await exitEvent(eventId);
    } catch (error) {
      console.error("Failed to exit event:", error);
    }
  };

  const renderEvent = (event: PendingEvent) => {
    const isCreator = event.eventCreatorId === userBasicInfo?.id;
    const isParticipant = event.isParticipant;

    return (
      <EventItem
        key={event.id}
        id={event.id}
        title={event.title}
        description={event.description ?? ""}
        possibleStartTime={event.possibleStartTime}
        possibleEndTime={event.possibleEndTime}
        participantLimit={event.participantLimit}
        registrationDeadline={event.registrationDeadline}
        isCreator={isCreator}
        isParticipant={isParticipant}
        onJoin={() => handleJoin(event.id)}
        onExit={() => handleExit(event.id)}
        onEdit={isCreator ? () => handleEdit(event.id) : undefined}
        onDelete={isCreator ? () => handleDelete(event.id) : undefined}
        isFinalized={false}
      />
    );
  };

  const filterEvent = (event: PendingEvent, searchQuery: string) => {
    return (
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description?.toLowerCase() ?? "").includes(searchQuery.toLowerCase())
    );
  };

  const headerContent = (
    <div className="flex items-center gap-4">
      {/* <h2 className="text-lg font-semibold">Events</h2> */}
      {onCreateEvent && (
        <Button 
          onClick={onCreateEvent} 
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <CalendarPlusIcon className="h-4 w-4" />
          <span>Create Event</span>
        </Button>
      )}
    </div>
  );

  return (
    <>
      <AdvancedList
        items={pendingEvents ?? []}
        title={headerContent}
        isLoading={isLoading}
        searchPlaceholder="Search events..."
        renderItem={renderEvent}
        filterItem={filterEvent}
      />
      <UpdateEventDialog />
    </>
  );
}