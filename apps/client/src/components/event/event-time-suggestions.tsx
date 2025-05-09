import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useCalculateSuggestion } from "@/hooks/event/use-calculate-suggestions"
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { trpc } from "@/trpc/client";
import { Button } from "../ui/button";
import { useGetPendingEvents } from "@/hooks/event/use-get-pending-events";

interface EventTimeSuggestionsProps {
    onTimeSelect?: (start: Date, end: Date) => void;
    eventId: number;
}

export function EventTimeSuggestions({ onTimeSelect, eventId }: EventTimeSuggestionsProps) {
    const {mutation } = useCalculateSuggestion();
    const [schedules, setSchedules] = useState<[Date, Date][]>([]);
    const [suggestions, setSuggestions] = useState<[Date, Date][]>([]);
    const { pendingEvents, isLoading } = useGetPendingEvents();

    const getSchedules = trpc.events.returnAttendeesSchedule.useQuery({ eventId });

    useEffect(() => {
        if (getSchedules.isError) {
            toast.error(`Failed to fetch participants schedules: ${getSchedules.error.message}`);
            return;
        }

        if (getSchedules.data && getSchedules.data.existingTimes.length > 0) {
            const cleanedTimes = getSchedules.data.existingTimes.map(([start, end]) => {
                const cleanStart = new Date(start);
                cleanStart.setMilliseconds(0);
                cleanStart.setSeconds(0);
                
                const cleanEnd = new Date(end);
                cleanEnd.setMilliseconds(0);
                cleanEnd.setSeconds(0);
                
                return [cleanStart, cleanEnd] as [Date, Date];
            });

            setSchedules(cleanedTimes);
        }
    }, [getSchedules.data, getSchedules.isError]);

    useEffect(() => {
        if(pendingEvents) {
            const thisEvent = pendingEvents.filter((event) => event.id === eventId)[0];
            if (schedules.length > 0) {
                mutation.mutate({existingTimes: schedules, setEventInterval: [new Date(thisEvent.possibleStartTime), new Date(thisEvent.possibleEndTime)]});
            } else if (getSchedules.data) {
                // If there are no schedules but we have data, calculate suggestions for the entire time window
                mutation.mutate({existingTimes: [], setEventInterval: [new Date(thisEvent.possibleStartTime), new Date(thisEvent.possibleEndTime)]});
            }
        }
    }, [schedules, isLoading]);

    useEffect(() => {
        if(mutation.data) {
            setSuggestions(mutation.data.suggestedTimes);
        }
    }, [mutation.data]);

    if (getSchedules.isLoading) {
        return (
            <div>
                <p>Loading schedules...</p>
            </div>
        );
    }

    if (suggestions.length === 0) {
        return (
            <div className="p-4 text-sm text-muted-foreground">
                No suggested times available for this period.
            </div>
        );
    }

    const handleSelect = (suggestion: [Date, Date]) => {
        if (onTimeSelect) {
            onTimeSelect(suggestion[0], suggestion[1]);
        }
    };

    return (
        <ScrollArea className="h-72 w-48 rounded-md border">
            <div className="p-4">
                <h4 className="mb-4 text-sm font-medium leading-none">Suggested Event Times</h4>
                {suggestions.map((suggestion, index) => (
                    <div key={index}>
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-sm">
                                {`${suggestion[0].toLocaleString("en-US")} - ${suggestion[1].toLocaleString("en-US")}`}
                            </div>
                            {onTimeSelect && (
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleSelect(suggestion)}
                                >
                                    Select
                                </Button>
                            )}
                        </div>
                        <Separator className="my-2" />
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}