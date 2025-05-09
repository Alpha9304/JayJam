"use client";

import { usePageTitle } from "@/components/route-title";
import { EventItem } from "@/components/event/event-item";
import { FinalizedEventItem } from "@/components/event/finalized-event-item";
import { AdvancedList } from "@/components/advanced-list";
import { useUserInfo } from "@/hooks/auth/use-user-info";
import { useGetFinalizedEvents } from "@/hooks/event/use-get-finalized-events";
import type { FinalizedEvent } from "@/hooks/event/use-get-finalized-events";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import {
  PendingEvent,
  useGetPendingEvents,
} from "@/hooks/event/use-get-pending-events";
import { useState } from "react";
import { useUpdateEventDialog } from "@/store/use-dialog";
import { useJoinEvent } from "@/hooks/event/use-join-event";
import { useExitEvent } from "@/hooks/event/use-exit-event";
import { useDeletePendingEvent } from "@/hooks/event/use-delete-pending-event";
import { UpdateEventDialog } from "@/components/event/update-event-dialog";
import { useLeaveFinalizedEvent } from "@/hooks/event/use-leave-finalized-event";

export default function MyStudyEventsPage() {
  usePageTitle("Events");
  const { finalizedEvents, isLoading: finalizedLoading } =
    useGetFinalizedEvents();
  const { pendingEvents, isLoading: pendingLoading } = useGetPendingEvents();
  const { userBasicInfo } = useUserInfo();
  const { deletePendingEvent } = useDeletePendingEvent();
  const { openDialog: openUpdateDialog, setEventId } = useUpdateEventDialog();
  const { exitEvent } = useExitEvent();
  const { joinEvent } = useJoinEvent();
  const { handleLeave } = useLeaveFinalizedEvent();

  const renderFinalizedEvent = (event: FinalizedEvent) => {
    const isParticipant = event.isParticipant;

    return (
      <FinalizedEventItem
        key={event.id}
        id={event.id}
        title={event.title}
        description={event.description ?? ""}
        possibleStartTime={event.startTime}
        possibleEndTime={event.endTime}
        participantLimit={null}
        registrationDeadline={event.startTime}
        isParticipant={isParticipant}
        isCreator={event.eventCreatorId === userBasicInfo?.id}
        onExit={() => handleLeave(event.id)}
        location={event.location}
      />
    );
  };

  const filterEvent = (event: FinalizedEvent, query: string) => {
    return (
      event.title.toLowerCase().includes(query.toLowerCase()) ||
      (event.description?.toLowerCase() ?? "").includes(query.toLowerCase())
    );
  };

  const renderPendingEvent = (event: PendingEvent) => {
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
        isCreator={event.eventCreatorId === userBasicInfo?.id}
        isParticipant={event.isParticipant}
        onJoin={() => handleJoin(event.id)}
        onExit={() => handleExit(event.id)}
        onEdit={
          event.eventCreatorId === userBasicInfo?.id
            ? () => handleEdit(event.id)
            : undefined
        }
        onDelete={
          event.eventCreatorId === userBasicInfo?.id
            ? () => handleDelete(event.id)
            : undefined
        }
        isFinalized={false}
      />
    );
  };

  const filterPendingEvent = (event: PendingEvent, query: string) => {
    return (
      event.title.toLowerCase().includes(query.toLowerCase()) ||
      (event.description?.toLowerCase() ?? "").includes(query.toLowerCase())
    );
  };

  // Filter for custom events where the user is a participant
  const finalizedEventsList = finalizedEvents.filter(
    (event) =>
      event.type === "custom" && event.isParticipant
  );

  const [pendingFilter, setPendingFilter] = useState<"all" | "created">("all");
  const [finalizedFilter ] = useState<"all" | "created">(
    "all"
  );

  const filteredPendingEvents = pendingEvents?.filter((event) => {
    if (pendingFilter === "all") return true;
    if (pendingFilter === "created")
      return event.eventCreatorId === userBasicInfo?.id;
    return true;
  });

  const filteredFinalizedEvents = finalizedEventsList.filter((event) => {
    if (finalizedFilter === "all") return true;
    if (finalizedFilter === "created")
      return event.eventCreatorId === userBasicInfo?.id;
    return true;
  });

  return (
    <div className="container mx-auto py-6 space-y-6 p-2">
      <div className="flex justify-start items-center">
        <h1 className="text-3xl font-bold">My Study Events</h1>
      </div>
      <div>
        <p className="text-muted-foreground text-sm">
          Manage your participation in study events
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="finalized" data-testid="finalized_tab_btn">Finalized</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <AdvancedList
            items={filteredPendingEvents ?? []}
            title={
              <select
                className="w-full p-2 border rounded-md text-sm 
                          bg-white text-black border-gray-300 
                          dark:bg-gray-800 dark:text-white dark:border-gray-600"
                value={pendingFilter}
                onChange={(e) =>
                  setPendingFilter(e.target.value as "all" | "created")
                }
              >
                <option value="all">All Events</option>
                <option value="created">Created by Me</option>
              </select>
            }
            isLoading={pendingLoading}
            searchPlaceholder="Search pending events..."
            renderItem={renderPendingEvent}
            filterItem={filterPendingEvent}
          />
        </TabsContent>


        <TabsContent value="finalized">
          <AdvancedList
            items={filteredFinalizedEvents}
            title={<></>
              // Once the custom event is finalized, the event becomes a regular event, it only control by the student them self and disconnect with the creator
              // So we don't need to filter the events by the creator
              // <select
              //   className="w-full p-2 border rounded-md text-sm"
              //   value={finalizedFilter}
              //   onChange={(e) =>
              //     setFinalizedFilter(e.target.value as "all" | "created")
              //   }
              // >
              //   <option value="all">All Events</option>
              //   <option value="created">Created by Me</option>
              // </select>
            }
            isLoading={finalizedLoading}
            searchPlaceholder="Search finalized events..."
            renderItem={renderFinalizedEvent}
            filterItem={filterEvent}
          />
        </TabsContent>
      </Tabs>
      <UpdateEventDialog />
    </div>
  );
}
