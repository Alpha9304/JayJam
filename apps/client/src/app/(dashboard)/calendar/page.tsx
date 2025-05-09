"use client";

// import { EventTimeSuggestions } from "@/components/event/event-time-suggestions";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid"; 
import multiMonthPlugin from "@fullcalendar/multimonth";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useGetEvents } from "@/hooks/event/use-get-events";
import { useEffect, useRef, useState } from "react";
import { useCreateEventDialog } from "@/store/use-dialog";
import { Button } from "@/components/ui/button";
import { CreatePersonalEventDialog } from "@/components/event/create-personal-event-dialog";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useGoogleLogin } from "@/hooks/auth/google/use-google-login";
import { TRPCClientError } from "@trpc/client";


// Define the event type
type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
};

export default function Calendar() {
  const { data: fetchedEvents, isLoading, error } = useGetEvents();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { openDialog } = useCreateEventDialog();
  const calendarRef = useRef<FullCalendar | null>(null);

  // const events = [
  //   {
  //     id: '1',
  //     title: "EN.601.625 (01) - Software System Design",
  //     start: "2025-03-16T16:00:00.000Z",
  //     end: "2025-03-16T17:15:00.000Z",
  //     // backgroundColor: '#3788d8',
  //     // borderColor: '#3788d8'
  //   }
  // ]
  // const isLoading = false;
  // const error = false;
  // console.log("here is calendar page");
  // console.log("the events in calendar page", events);
	// 	console.log(process.env.NEXT_PUBLIC_BACKEND_URL);

  useEffect(() => {
    if (fetchedEvents && fetchedEvents.length > 0) {
      console.log("Setting events from API");
      setEvents(fetchedEvents);
    } else {
      console.log("No events from API");
    }
  }, [fetchedEvents]);

  //let { isDialogOpen, setIsDialogOpen, closeDialog } = useCreateEventDialog();

  const refreshEvents = async () => {
      const calendarApi = calendarRef.current?.getApi();
      calendarApi?.refetchEvents();

  };


  //Google calendar stuff
  const searchParams = useSearchParams();
  
  useEffect(() => {
  
    const success = searchParams.get('success');
    if (success === "true") {
       toast.success("Google Calendar successfully imported into My Calendar!")
     }
  
    // Strip success param from url
    const url = new URL(window.location.href);
    url.searchParams.delete('param');
    window.history.replaceState({}, '', url);
  }, [searchParams])
  
  const { routeToGoogle, googleError } = useGoogleLogin();
  
  const handleGetCalendar = () => {
    try {
      if (googleError) { throw googleError; }

      routeToGoogle()
  
    } catch (error: unknown) {
  
      let message: string = "Google login failed.";
  
      if (error instanceof TRPCClientError) {
        if (error.data?.code === "UNAUTHORIZED") {
            message += ` ${error.message}`
        }
      } else {
        message += ` Please try again later.`
      }
  
      console.error(error);
      toast.error(message);
    }
  
  }
  
  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full p-4 border-2 mx-auto">
      <div className="max-w-[1200px] flex-1 mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p>Loading calendar events...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-500">Failed to load calendar events: {error.message}</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-bold">Your Calendar</h2>
              {events.length === 0 ? (
                <p className="text-gray-500">No events to display</p>
              ) : (
                <p className="text-gray-500">Displaying {events.length} events</p>
              )}
              <CreatePersonalEventDialog onEventCreated={refreshEvents}/>
              
              <div className="flex flex-row justify-between">
                <Button
                type="submit"
                size="lg"
                //   disabled={isPending}
                onClick={() => {
                  openDialog()
                }}
                >
                Add Event
              </Button>

              <Button
                className={`p-2 mt-2 rounded-md transition-all duration-200 "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                size="lg"
                onClick={() => handleGetCalendar()}
              >
                Import New Google Calendar Events
              </Button>
            </div>
            </div>
            <FullCalendar
              ref={calendarRef}
              plugins={[timeGridPlugin, dayGridPlugin, multiMonthPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: "prev,today,next",
                center: "title",
                right: "multiMonthYear,dayGridMonth,timeGridWeek,timeGridDay",
              }}
              height="100%"
              events={events}
              eventDisplay="block"
              eventBackgroundColor="#3788d8"
              eventBorderColor="#3788d8"
              eventTimeFormat={{
                hour: 'numeric',
                minute: '2-digit',
                meridiem: 'short'
              }}
              nowIndicator={true}
              slotMinTime="00:00:00"
              slotMaxTime="23:59:59"
              allDaySlot={false}
              eventClick={(info) => {
                console.log("Event clicked:", info.event);
                //refreshEvents();
                toast(`Clicked event: ${info.event.id}`);
              }}
            />
          </>
        )}
        
        
      </div>

      
      {/* // /* <div className="flex flex-col gap-4 justify-center items-center">
      //     <h1 className="text-2xl font-bold">Test Event-Time Selector</h1>
      //     <div className="flex flex-col gap-2">
      //       <EventTimeSuggestions/>
      //     </div>
      //   </div> */}
      </div>
  );
}