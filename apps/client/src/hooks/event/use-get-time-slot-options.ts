import { trpc } from "../../trpc/client";

export const useGetTimeSlotOptions = (eventId: number) => {
    const { data: timeSlotOptions, isLoading } = trpc.events.getTimeOptions.useQuery(
        { eventId },
        {
            enabled: !!eventId,
        }
    );

    return { timeSlotOptions, isLoading };
}; 