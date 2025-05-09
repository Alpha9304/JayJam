"use client";
import { trpc } from "@/trpc/client";
import { useForm } from "react-hook-form";
import { DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import z from "zod";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { updateEventInfoSchema } from "@team-03/shared/schema/event-schema";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";
import { usePing } from "@/hooks/auth/use-ping";
import TimeslotOptionSelector from "./time-slot-selector-origin";
import LocationOptionSelector from "./location-option-selector";
import { toast } from "sonner";
import { useCreateLocationOption } from "@/hooks/event/use-create-location-option";
import { useCreateTimeSlotOption } from "@/hooks/event/use-create-time-slot-option";
import { CalendarClockIcon, UsersIcon } from "lucide-react";
import { useGetPendingEvents } from "@/hooks/event/use-get-pending-events";
import { useUserInfo } from "@/hooks/auth/use-user-info";
import { useGetLocationOptions } from "@/hooks/event/use-get-location-options";
import { useDeleteLocationOption } from "@/hooks/event/use-delete-location-option";
import { useGetTimeSlotOptions } from "../../hooks/event/use-get-time-slot-options";
import { useDeleteTimeSlotOption } from "../../hooks/event/use-delete-time-slot-option";
import { useFinalizePendingEvent } from "@/hooks/event/use-finalize-pending-event";
import { useEffect } from "react";
import { useState } from 'react';


interface LocationOption {
  id: number;
  location: string;
  locationVoteCount: number;
}

interface TimeSlotOption {
  id: number;
  startTime: string;
  endTime: string;
  timeVoteCount: number;
}

interface UpdateEventFormProps {
  eventId: number;
  onCancel: () => void;
}

// TODO: implement the adding options for creator 
// TODO: implement the deleting options for creator
// TODO: implement the voting for non-creator

export default function UpdateEventForm({ 
  eventId,
  onCancel 
}: UpdateEventFormProps) {
  const { data: userInfo } = usePing();
  const { addLocationOption } = useCreateLocationOption();
  const { deleteLocationOption } = useDeleteLocationOption();
  const { addTimeOption } = useCreateTimeSlotOption();
  const { deleteTimeOption } = useDeleteTimeSlotOption();
  const { pendingEvents } = useGetPendingEvents();
  const { userBasicInfo } = useUserInfo();
  const { locationOptions } = useGetLocationOptions(eventId);
  const { timeSlotOptions } = useGetTimeSlotOptions(eventId);
  const [selectedLocationOptionId, setSelectedLocationOptionId] = useState<number | null>(null);
  const [selectedTimeOptionId, setSelectedTimeOptionId] = useState<number | null>(null);
  const { finalizePendingEvent, isPending } = useFinalizePendingEvent();
  const utils = trpc.useUtils();
  const canFinalize = selectedLocationOptionId && selectedTimeOptionId;


  const form = useForm<z.infer<typeof updateEventInfoSchema>>({
    defaultValues: {
      location: locationOptions?.map(opt => opt.location) || [],
      timeslot: timeSlotOptions?.map(opt => ({
        start: new Date(opt.startTime).getTime(),
        end: new Date(opt.endTime).getTime(),
      })) || [],
    },
  });

  // Update form when options are loaded
  useEffect(() => {
    if (locationOptions) {
      form.setValue('location', locationOptions.map(opt => opt.location));
    }
  }, [locationOptions, form]);

  useEffect(() => {
    if (timeSlotOptions) {
      form.setValue('timeslot', timeSlotOptions.map(opt => ({
        start: new Date(opt.startTime).getTime(),
        end: new Date(opt.endTime).getTime(),
      })));
    }
  }, [timeSlotOptions, form]);

  // Find the event details from pendingEvents
  const event = pendingEvents?.find(event => event.id === eventId);
  const isCreator = event?.eventCreatorId === userBasicInfo?.id;

  if (!event) {
    return <div>Event not found</div>;
  }

  const handleSubmit = async (data: z.infer<typeof updateEventInfoSchema>) => {
    try {
      // Handle location deletions
      const currentLocations = new Set(data.location);
      const deletedLocations = (locationOptions?.filter((opt: LocationOption) => !currentLocations.has(opt.location)) || []) as LocationOption[];
      
      // Delete removed locations
      if (deletedLocations.length > 0) {
        const deleteResults = await Promise.allSettled(
          deletedLocations.map((opt: LocationOption) => 
            deleteLocationOption({
              eventId,
              locationId: opt.id
            })
          )
        );

        deleteResults.forEach((result: PromiseSettledResult<unknown>, index: number) => {
          if (result.status === 'rejected') {
            console.error(`Failed to delete location: ${deletedLocations[index].location}`, result.reason);
          }
        });
      }

      // Add new locations
      if (data.location.length > 0) {
        const existingLocations = new Set(locationOptions?.map((opt: LocationOption) => opt.location) || []);
        const newLocations = data.location.filter(location => !existingLocations.has(location));

        if (newLocations.length > 0) {
          const results = await Promise.allSettled(
            newLocations.map((location) =>
              addLocationOption({
                eventId,
                location,
              })
            )
          );

          results.forEach((result: PromiseSettledResult<unknown>, index: number) => {
            if (result.status === 'rejected') {
              console.error(`Failed to add location: ${newLocations[index]}`, result.reason);
            }
          });
        }
      }

      // Handle time slot deletions
      const currentTimeSlots = new Set(data.timeslot.map(slot => `${slot.start}-${slot.end}`));
      const deletedTimeSlots = (timeSlotOptions?.filter((opt: TimeSlotOption) => 
        !currentTimeSlots.has(`${new Date(opt.startTime).getTime()}-${new Date(opt.endTime).getTime()}`)
      ) || []) as TimeSlotOption[];
      
      // Delete removed time slots
      if (deletedTimeSlots.length > 0) {
        const deleteResults = await Promise.allSettled(
          deletedTimeSlots.map((opt: TimeSlotOption) => 
            deleteTimeOption({
              eventId,
              timeId: opt.id
            })
          )
        );

        deleteResults.forEach((result: PromiseSettledResult<unknown>, index: number) => {
          if (result.status === 'rejected') {
            console.error(`Failed to delete time slot: ${deletedTimeSlots[index].startTime} - ${deletedTimeSlots[index].endTime}`, result.reason);
          }
        });
      }

      // Add new time slots
      if (data.timeslot.length > 0) {
        const existingTimeSlots = new Set(
          timeSlotOptions?.map((opt: TimeSlotOption) => 
            `${new Date(opt.startTime).getTime()}-${new Date(opt.endTime).getTime()}`
          ) || []
        );
        
        const newTimeSlots = data.timeslot.filter(slot => 
          !existingTimeSlots.has(`${slot.start}-${slot.end}`)
        );

        if (newTimeSlots.length > 0) {
          const results = await Promise.allSettled(
            newTimeSlots.map((slot) =>
              addTimeOption({
                eventId,
                startTime: slot.start,
                endTime: slot.end,
              })
            )
          );

          results.forEach((result: PromiseSettledResult<unknown>, index: number) => {
            if (result.status === 'rejected') {
              console.error(`Failed to add time slot: ${new Date(newTimeSlots[index].start).toISOString()} - ${new Date(newTimeSlots[index].end).toISOString()}`, result.reason);
            }
          });
        }
      }

      toast.success("Event options updated successfully");
      // Refresh the data shown in the dialog
      await utils.events.getLocationOptions.invalidate({ eventId });
      await utils.events.getTimeOptions.invalidate({ eventId });
      onCancel();
    } catch (error) {
      toast.error("Failed to update event options");
      console.error(error);
    }
  };

  const handleTimeslotChange = (timeslots: Array<{ start: string; end: string }>) => {
    form.setValue('timeslot', timeslots.map(slot => ({
      start: new Date(slot.start).getTime(),
      end: new Date(slot.end).getTime(),
    })));
  };

  const handleFinalizeEvent = async () => {
    if (!selectedLocationOptionId || !selectedTimeOptionId) {
      toast.error("Please select both a location and a time slot to finalize the event.");
      return;
    }
  
    try {
      await finalizePendingEvent({
        eventId,
        locationOptionId: selectedLocationOptionId,
        timeOptionId: selectedTimeOptionId,
      });
  
      // Success: close modal
      onCancel();
    } catch (error) {
      console.error("Finalizing event failed:", error);
      // Errors are handled by the hook’s toast
    }
  };

  // TODO: if the user is creator, they can perform the adding and deleting options, and also see the voting re
    // TODO: if the user is not creator, they can only vote for the options and display the options voting result
    return (
        <div className="space-y-6 px-6 pb-4">
            <DialogHeader className="space-y-2 mt-4">
                <DialogTitle className="text-2xl font-bold">Update Study Event</DialogTitle>
                <DialogDescription className="text-gray-500">
                    {isCreator ? "Modify your location and time options. Make sure to finalize your event's details before it occurs." : "Vote for your preferred options"}
                </DialogDescription>
            </DialogHeader>
            <Card className="p-4">
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold">Event ID: {eventId}</h3>
                        <p className="text-sm text-muted-foreground">Creator: {userInfo?.userBasicInfo.name}</p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <CalendarClockIcon className="h-4 w-4" />
                            <div>
                                <p><span className="font-bold">Proposed Time: </span>{new Date(event.possibleStartTime).toLocaleString(undefined, {
                                  dateStyle: "medium",
                                  timeStyle: "short"
                                })} - {new Date(event.possibleEndTime).toLocaleString(undefined, {
                                  dateStyle: "medium",
                                  timeStyle: "short"
                                })}</p>
                            </div>
                        </div>

                        {event.participantLimit !== null && event.participantLimit !== 0 ? (
                            <div className="flex items-center gap-2 text-sm">
                                <UsersIcon className="h-4 w-4" />
                                <span className="font-bold">Participant Limit:</span><span>{event.participantLimit}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-sm">
                                <UsersIcon className="h-4 w-4" />
                                <span>No participant limit</span>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            <Separator className="h-[3px]"/>

            {isCreator ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  {/* Location Field */}
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-lg font-semibold">Location Options</FormLabel>
                        </div>
                        <LocationOptionSelector
                          locations={field.value || []}
                          onChange={field.onChange}
                        />

                        {locationOptions && locationOptions.length > 0 && (
                          <div className="space-y-2 mt-4">
                            <h4 className="text-sm font-medium">Select Final Location:</h4>
                            {locationOptions.map((option) => (
                              <div
                                key={option.id}
                                onClick={() => setSelectedLocationOptionId(option.id)}
                                className={cn(
                                  "flex justify-between items-center text-sm p-2 rounded-md cursor-pointer border",
                                  selectedLocationOptionId === option.id
                                    ? "border-green-500 bg-green-50"
                                    : "bg-muted"
                                )}
                              >
                                <span>{option.location}</span>
                                <span className="text-muted-foreground">
                                  {option.locationVoteCount} votes
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                <Separator className="h-[2px]"/>
                      {/* Timeslot Field */}
                      <FormField
                        control={form.control}
                        name="timeslot"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-lg font-semibold">Time Options</FormLabel>
                            </div>
                            <TimeslotOptionSelector
                              value={
                                field.value?.map((slot) => ({
                                  start: new Date(slot.start).toISOString(),
                                  end: new Date(slot.end).toISOString(),
                                })) || []
                              }
                              onChange={handleTimeslotChange}
                              possibleStartTime={Date.parse(event.possibleStartTime)}
                              possibleEndTime={Date.parse(event.possibleEndTime)}
                              eventId={eventId}
                              timeSlotOptions={timeSlotOptions}
                              isCreator={isCreator}
                            />

                            {timeSlotOptions && timeSlotOptions.length > 0 && (
                              <div className="space-y-2 mt-4">
                                <h4 className="text-sm font-medium">Select Final Time Slot:</h4>
                                {timeSlotOptions.map((option) => (
                                  <div
                                    key={option.id}
                                    onClick={() => setSelectedTimeOptionId(option.id)}
                                    className={cn(
                                      "flex justify-between items-center text-sm p-2 rounded-md cursor-pointer border",
                                      selectedTimeOptionId === option.id
                                        ? "border-green-500 bg-green-50"
                                        : "bg-muted"
                                    )}
                                  >
                                    <span>
                                      {new Date(option.startTime).toLocaleString()} -{" "}
                                      {new Date(option.endTime).toLocaleString()}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {option.timeVoteCount} votes
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                        <div className="flex justify-between gap-x-4 mt-8">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onCancel}
                                className={cn(!onCancel && "hidden")}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                            >
                                Update Options
                            </Button>
                            <Button
                              type="button"
                              className={cn(
                                "bg-green-600 hover:bg-green-700 text-white",
                                !canFinalize && "bg-muted text-muted-foreground cursor-not-allowed hover:bg-muted"
                              )}
                              disabled={!canFinalize}
                              onClick={handleFinalizeEvent}
                            >
                              {isPending ? "Finalizing..." : "Finalize Event"}
                            </Button>


                        </div>
                    </form>
                </Form>
            ) : (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Vote for Options</h3>
                    {/* TODO: Implement voting UI for non-creators */}
                    <p className="text-sm text-muted-foreground">Voting functionality coming soon...</p>
                </div>
            )}
        </div>
    );
}
