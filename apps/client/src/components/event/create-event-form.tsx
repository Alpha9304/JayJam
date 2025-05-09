"use client";

import { useForm } from "react-hook-form";
import { DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
// import { useRef } from "react";
import z from "zod";
import { Button } from "../ui/button";
import { createPendingEventSchema } from "@team-03/shared/schema/event-schema";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";
import { useUserInfo } from "@/hooks/auth/use-user-info";
import RegistrationDealinePicker from "./registration-dealine-picker";
import { useCreatePendingEvent } from "@/hooks/event/use-create-pending-event";
import { toast } from "sonner";
import PossibleStartTimePicker from "./possible-start-time-picker";
import PossibleEndTimePicker from "./possible-end-time-picker";
import { useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

interface CreateEventFormProps {
  onCancel: () => void;
}

export default function CreateEventForm({ onCancel }: CreateEventFormProps) {
  // const inputRef = useRef<HTMLInputElement>(null);
  const { groupId } = useParams();
  const { userBasicInfo, isLoading } = useUserInfo();
  const { createPendingEvent } = useCreatePendingEvent();
  const form = useForm<z.infer<typeof createPendingEventSchema>>({
    defaultValues: {
      title: "",
      description: "",
      possibleStartTime: 0,
      possibleEndTime: 0,
      registrationDeadline: 0,
      participantLimit: null,
      groupId: groupId ? parseInt(groupId as string) : 0,
    },
    resolver: zodResolver(createPendingEventSchema)
  });

  // Update form values when groupId changes
  useEffect(() => {
    if (groupId) {
      const parsedGroupId = parseInt(groupId as string);
      if (!isNaN(parsedGroupId)) {
        form.setValue('groupId', parsedGroupId);
      }
    }
  }, [groupId, form]);

  console.log("Form state:", form.getValues());
  console.log("Form errors:", form.formState.errors);

  const handleSubmit = async (data: z.infer<typeof createPendingEventSchema>) => {
    console.log("Form submitted with data:", data);
    
    if (!data.groupId) {
      toast.error("No group ID found");
      return;
    }

    const pendingEvent: z.infer<typeof createPendingEventSchema> = {
      title: data.title,
      description: data.description,
      groupId: data.groupId,
      participantLimit: data.participantLimit,
      registrationDeadline: data.registrationDeadline,
      possibleStartTime: data.possibleStartTime,
      possibleEndTime: data.possibleEndTime,
    }

    console.log("Pending event data:", pendingEvent);

    try {
      const result = await createPendingEvent(pendingEvent);
      if (!result) {
        toast.error("Failed to create event");
        return;
      }
      console.log("result for creating pending event: " + result);
      onCancel(); // Close the dialog after successful creation
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event: " + (error as Error).message);
    }
  };



  return (
    <div className="space-y-4 px-6">
      <DialogHeader className="space-y-2 mt-4">
        <DialogTitle className="text-4xl font-bold">Create Study Event</DialogTitle>
        <DialogDescription className="text-gray-500">
          Fill in the details below to create a new study event
        </DialogDescription>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading creator info...</p>
        ) : userBasicInfo?.name ? (
          <p className="text-muted-foreground text-sm">Creator: {userBasicInfo.name}</p>
        ) : (
          <p className="text-muted-foreground text-sm">Creator info not available</p>
        )}
      </DialogHeader>
      <Separator />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter Event Title" className="h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold"> Description</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter Event Description" className="h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            <FormField
              control={form.control}
              name="possibleStartTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Possible Start Time</FormLabel>
                  <FormControl>
                    <PossibleStartTimePicker
                      date={field.value ? new Date(field.value) : undefined}
                      setDate={(date) => field.onChange(date?.getTime())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="possibleEndTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Possible End Time</FormLabel>
                  <FormControl>
                    <PossibleEndTimePicker
                      date={field.value ? new Date(field.value) : undefined}
                      setDate={(date) => field.onChange(date?.getTime())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="registrationDeadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Registration deadline</FormLabel>
                  <FormControl>
                    <RegistrationDealinePicker
                      date={field.value ? new Date(field.value) : undefined}
                      setDate={(date) => field.onChange(date?.getTime())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="participantLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Population Limit</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="1"
                      value={field.value || undefined}
                      onChange={e => {
                        const value = e.target.value === '' ? null : parseInt(e.target.value);
                        // Only allow positive numbers
                        if (value === null || value > 0) {
                          field.onChange(value);
                        }
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      placeholder="Enter population limit for this event, blank for no limitation" 
                      className="h-11" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
          </div>
          <div className="flex justify-between gap-x-4 mt-8 mb-2 mx-10">
            <Button
              type="button"
              size="lg"
              variant="secondary"
              onClick={onCancel}
              className={cn(!onCancel && "hidden")}
              >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              >
              Create Event
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
