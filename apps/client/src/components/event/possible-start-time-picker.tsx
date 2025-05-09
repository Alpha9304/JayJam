import { DateTimePicker } from "../date-time-picker";

interface PossibleStartTimePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
}

export default function PossibleStartTimePicker({ date, setDate }: PossibleStartTimePickerProps) {
    return (
        <div>
            <DateTimePicker 
                date={date}
                setDate={setDate}
                placeholder="Select possible start time"
                testId="possible-start-time-picker"
            />
        </div>
    )
}