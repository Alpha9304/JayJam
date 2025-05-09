import { DatePicker } from "./date-picker";
import { TimeSelector } from "./time-selector";

interface DateStartEndTimePickerProps {
    date?: Date;
    startTime?: Date;
    endTime?: Date;
    onDateTimeChange?: (date?: Date, startTime?: Date, endTime?: Date) => void;
}

export default function DateStartEndTimePicker({ 
    date,
    startTime,
    endTime,
    onDateTimeChange 
}: DateStartEndTimePickerProps) {
    const handleDateChange = (newDate?: Date) => {
        onDateTimeChange?.(newDate, startTime, endTime);
    };

    const handleStartTimeChange = (time: { hour: string; minute: string }) => {
        if (!date || !time.hour || !time.minute) return;
        
        const newStartTime = new Date(date);
        newStartTime.setHours(parseInt(time.hour));
        newStartTime.setMinutes(parseInt(time.minute));
        onDateTimeChange?.(date, newStartTime, endTime);
    };

    const handleEndTimeChange = (time: { hour: string; minute: string }) => {
        if (!date || !time.hour || !time.minute) return;
        
        const newEndTime = new Date(date);
        newEndTime.setHours(parseInt(time.hour));
        newEndTime.setMinutes(parseInt(time.minute));
        onDateTimeChange?.(date, startTime, newEndTime);
    };

    return(
        <div className="space-y-4">
            {/* date picker */}
            <div className="w-full font-semibold">
                Date
                <DatePicker 
                    date={date}
                    onSelect={handleDateChange}
                />
            </div>
            <div className="flex gap-4">
                {/* start time picker */}
                <div className="w-1/2 font-semibold">
                    Start Time
                    <TimeSelector 
                        onTimeChange={handleStartTimeChange}
                    />
                </div>
                {/* end time picker */}
                <div className="w-1/2 font-semibold">
                    End Time 
                    <TimeSelector 
                        onTimeChange={handleEndTimeChange}
                    />
                </div>
            </div>
        </div>
    );
}