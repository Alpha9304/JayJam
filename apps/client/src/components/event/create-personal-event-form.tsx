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
import { createPersonalEventSchema } from "@team-03/shared/schema/event-schema";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";
import { useUserInfo } from "@/hooks/auth/use-user-info";
import {} from "@/hooks/event/use-create-pending-event"
import { useCreatePersonalEvent } from "@/hooks/event/use-create-personal-event";
import { toast } from "sonner";
import PossibleStartTimePicker from "./possible-start-time-picker";
import PossibleEndTimePicker from "./possible-end-time-picker";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetEvents } from "@/hooks/event/use-get-events";


interface CreatePersonalEventFormProps {
  onCancel: () => void;
  onSubmit: () => void;
}

export default function CreatePersonalEventForm({ onCancel, onSubmit }: CreatePersonalEventFormProps) {
  // const inputRef = useRef<HTMLInputElement>(null);
  const { userBasicInfo, isLoading } = useUserInfo();
  const { createPersonalEvent } = useCreatePersonalEvent();
  const { refetch } = useGetEvents();
  const form = useForm<z.infer<typeof createPersonalEventSchema>>({
    defaultValues: {
      title: "",
      description: "",
      startTime: 0,
      endTime: 0
    },
    resolver: zodResolver(createPersonalEventSchema)
  });

  const handleSubmit = async (data: z.infer<typeof createPersonalEventSchema>) => {
    const event: z.infer<typeof createPersonalEventSchema> = {
      title: data.title,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime,
    }
    console.log("event: " + event);

    
    const result = await createPersonalEvent(event);
    if (!result) {
      toast.error("Failed to create event");
      return;
    }
    console.log("result for creating pending event: " + result);
    toast.success("Event created successfully!");
    onCancel(); // Close the dialog after successful creation
    onSubmit();
    refetch();
    //window.location.reload();
  };



  // TODO: need to make sure the possible end time is after the possible start time
  return (
    <div className="space-y-4 px-6">
      <DialogHeader className="space-y-2 mt-4">
        <DialogTitle className="text-4xl font-bold">Create Personal Event</DialogTitle>
        <DialogDescription className="text-gray-500">
          Fill in the details below to create a new personal event
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
        <form onSubmit={form.handleSubmit(handleSubmit)}>
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
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Start Time</FormLabel>
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
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">End Time</FormLabel>
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
            
          </div>
          <div className="flex justify-between gap-x-4 mt-8 mb-2 mx-10">
            <Button
              type="button"
              size="lg"
              variant="secondary"
              onClick={onCancel}
              //   disabled={isPending}
              className={cn(!onCancel && "hidden")}
              >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              //   disabled={isPending}
              onClick={() => {
                console.log("handleSubmit");
                console.log(form.formState.errors)
              }}
              >
              Create Event
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
