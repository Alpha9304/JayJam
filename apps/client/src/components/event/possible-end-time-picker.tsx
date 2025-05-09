import { DateTimePicker } from "../date-time-picker";

interface PossibleEndTimePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
}

export default function PossibleEndTimePicker({ date, setDate }: PossibleEndTimePickerProps) {
    return (
        <div>
            <DateTimePicker 
                date={date}
                setDate={setDate}
                placeholder="Select possible end time"
            />
        </div>
    )
}