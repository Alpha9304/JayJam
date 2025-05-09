import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import DateStartEndTimePicker from "../date-start-end-time-picker";
import { ScrollArea } from "../ui/scroll-area";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EventTimeSuggestions } from "./event-time-suggestions";
import { useVoteTime } from "@/hooks/event/use-vote-time";

interface TimeslotSelectorProps {
    value?: Array<{
        start: string;
        end: string;
    }>;
    onChange?: (value: Array<{
        start: string;
        end: string;
    }>) => void;
    possibleStartTime: number;
    possibleEndTime: number;
    eventId: number;
    timeSlotOptions?: Array<{
        id: number;
        startTime: string;
        endTime: string;
        timeVoteCount: number;
        hasVoted?: boolean;
    }>;
    isCreator?: boolean;
}

export default function TimeslotOptionSelector({ 
    value = [], 
    onChange,
    possibleStartTime,
    possibleEndTime,
    eventId,
    timeSlotOptions = [],
    isCreator = false
}: TimeslotSelectorProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>();
    const [selectedStartTime, setSelectedStartTime] = useState<Date>();
    const [selectedEndTime, setSelectedEndTime] = useState<Date>();
    const { voteTime } = useVoteTime();

    const handleDateTimeChange = (date?: Date, startTime?: Date, endTime?: Date) => {
        setSelectedDate(date);
        setSelectedStartTime(startTime);
        setSelectedEndTime(endTime);
    };

    const validateTimeSlot = (startTime: number, endTime: number): { isValid: boolean; error?: string } => {
        // Check if end time is after start time
        if (endTime <= startTime) {
            return { 
                isValid: false, 
                error: "End time must be after start time" 
            };
        }

        // Check if time slot is within event's possible time range
        if (startTime < possibleStartTime) {
            return { 
                isValid: false, 
                error: "Time slot cannot start before the event&apos;s possible start time" 
            };
        }

        if (endTime > possibleEndTime) {
            return { 
                isValid: false, 
                error: "Time slot cannot end after the event&apos;s possible end time" 
            };
        }

        // Check if time slot overlaps with existing slots
        const hasOverlap = value.some(slot => {
            const existingStart = new Date(slot.start).getTime();
            const existingEnd = new Date(slot.end).getTime();
            return (
                (startTime >= existingStart && startTime < existingEnd) || // New start time is within existing slot
                (endTime > existingStart && endTime <= existingEnd) || // New end time is within existing slot
                (startTime <= existingStart && endTime >= existingEnd) // New slot completely contains existing slot
            );
        });

        if (hasOverlap) {
            return {
                isValid: false,
                error: "Time slot overlaps with an existing slot"
            };
        }

        return { isValid: true };
    };

    const handleAddTimeslot = () => {
        if (!selectedDate || !selectedStartTime || !selectedEndTime) return;

        // Create new Date objects for start and end times
        const startDateTime = new Date(selectedDate);
        startDateTime.setHours(selectedStartTime.getHours());
        startDateTime.setMinutes(selectedStartTime.getMinutes());
        startDateTime.setSeconds(0);
        startDateTime.setMilliseconds(0);

        const endDateTime = new Date(selectedDate);
        endDateTime.setHours(selectedEndTime.getHours());
        endDateTime.setMinutes(selectedEndTime.getMinutes());
        endDateTime.setSeconds(0);
        endDateTime.setMilliseconds(0);

        // Validate time range
        const startTime = startDateTime.getTime();
        const endTime = endDateTime.getTime();

        const validation = validateTimeSlot(startTime, endTime);
        if (!validation.isValid) {
            toast.error(validation.error);
            return;
        }

        const newTimeslot = {
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
        };

        onChange?.([...value, newTimeslot]);
        setIsDialogOpen(false);

        // Reset selections
        setSelectedDate(undefined);
        setSelectedStartTime(undefined);
        setSelectedEndTime(undefined);
    };

    const handleRemoveTimeslot = (index: number) => {
        onChange?.(value.filter((_, i) => i !== index));
    };

    const handleSuggestedTimeSelect = (start: Date, end: Date) => {
        // Validate time range
        const startTime = start.getTime();
        const endTime = end.getTime();

        const validation = validateTimeSlot(startTime, endTime);
        if (!validation.isValid) {
            toast.error(validation.error);
            return;
        }

        const newTimeslot = {
            start: start.toISOString(),
            end: end.toISOString(),
        };

        onChange?.([...value, newTimeslot]);
        setIsDialogOpen(false);
    };

    const handleVoteTimeSlot = async (optionId: number) => {
        try {
            await voteTime({ eventId, optionId });
            toast.success("Vote recorded successfully");
        } catch (error) {
            toast.error("Failed to record vote");
            console.error("Failed to vote for time slot:", error);
        }
    };

    return (
        <div className="space-y-4">
            {isCreator && (!value || value.length < 3) && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Time Slot
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Add New Time Slot</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-sm font-medium mb-2">Suggested Time Slots</h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Quick select from available times based on participants&apos; schedules:
                                </p>
                                <div className="h-[200px] mb-24">
                                    <EventTimeSuggestions 
                                        onTimeSelect={handleSuggestedTimeSelect}
                                        eventId={eventId}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Manual Selection</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Select a time slot between:
                                    </p>
                                    <p className="text-sm font-medium">
                                        {new Date(possibleStartTime).toLocaleString()} and {new Date(possibleEndTime).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Time slots must not overlap with existing slots
                                    </p>
                                </div>
                                <DateStartEndTimePicker 
                                    date={selectedDate}
                                    startTime={selectedStartTime}
                                    endTime={selectedEndTime}
                                    onDateTimeChange={handleDateTimeChange}
                                />
                                <Button 
                                    onClick={handleAddTimeslot}
                                    disabled={!selectedDate || !selectedStartTime || !selectedEndTime}
                                >
                                    Add Slot
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            <ScrollArea className="h-auto rounded-md border">
                {value && value.length > 0 ? (
                    <div className="p-4 space-y-2">
                        {value.map((slot, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded-lg border">
                                <div>
                                    <p className="font-medium">
                                        {new Date(slot.start).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(slot.start).toLocaleTimeString()} - {new Date(slot.end).toLocaleTimeString()}
                                    </p>
                                </div>
                                {isCreator && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveTimeslot(index)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-4 text-center text-muted-foreground">
                        No time slots added yet. {isCreator && "You can add up to 3 time slots."}
                    </div>
                )}
            </ScrollArea>

            {/* Display voting options for time slots */}
            {timeSlotOptions && timeSlotOptions.length > 0 && !isCreator && (
                <div className="space-y-2 mt-4">
                    <h4 className="text-sm font-medium">Vote for Time Slots:</h4>
                    {timeSlotOptions.map((option) => (
                        <div key={option.id} className="flex justify-between items-center p-2 bg-muted rounded-md">
                            <div className="flex-1">
                                <p className="text-sm">
                                    {new Date(option.startTime).toLocaleString()} - {new Date(option.endTime).toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {option.timeVoteCount} votes
                                </p>
                            </div>
                            <Button
                                variant={option.hasVoted ? "secondary" : "outline"}
                                onClick={() => handleVoteTimeSlot(option.id)}
                                disabled={option.hasVoted}
                                size="sm"
                            >
                                {option.hasVoted ? "Voted" : "Vote"}
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}