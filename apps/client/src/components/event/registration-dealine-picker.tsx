import { DateTimePicker } from "../date-time-picker";

interface RegistrationDealinePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
}

export default function RegistrationDealinePicker({ date, setDate }: RegistrationDealinePickerProps) {
    return (
        <div>
            <DateTimePicker 
                date={date}
                setDate={setDate}
                placeholder="Select registration deadline"
                testId="registration-deadline-picker"
            />
        </div>
    )
}