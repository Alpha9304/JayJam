import { Button } from "@/components/ui/button";
import { CalendarClockIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { DateTimePicker } from "@/components/date-time-picker";

interface TimeslotSelectorProps {
  timeslots: Array<{ start: string; end: string }>;
  onChange: (timeslots: Array<{ start: string; end: string }>) => void;
}

export default function TimeslotOptionSelector({
  timeslots,
  onChange,
}: TimeslotSelectorProps) {
  const [newStartTime, setNewStartTime] = useState<Date>();
  const [newEndTime, setNewEndTime] = useState<Date>();

  const handleAddTimeslot = () => {
    if (newStartTime && newEndTime) {
      onChange([
        ...timeslots,
        {
          start: newStartTime.toISOString(),
          end: newEndTime.toISOString(),
        },
      ]);
      setNewStartTime(undefined);
      setNewEndTime(undefined);
    }
  };

  const handleRemoveTimeslot = (index: number) => {
    onChange(timeslots.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        {timeslots.map((slot, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2">
              <CalendarClockIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {new Date(slot.start).toLocaleString()} - {new Date(slot.end).toLocaleString()}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveTimeslot(index)}
              className="h-8 w-8"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Start Time</span>
            <DateTimePicker
              date={newStartTime}
              setDate={setNewStartTime}
              placeholder="Select start time"
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">End Time</span>
            <DateTimePicker
              date={newEndTime}
              setDate={setNewEndTime}
              placeholder="Select end time"
            />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAddTimeslot}
          disabled={!newStartTime || !newEndTime}
          className="h-10 w-10"
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}