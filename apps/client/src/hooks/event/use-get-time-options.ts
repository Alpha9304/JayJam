import { trpc } from "@/trpc/client";

// interface TimeOption {
//   id: number;
//   startTime: string;
//   endTime: string;
//   timeVoteCount: number;
//   hasVoted: boolean;
// }

export const useGetTimeOptions = (eventId: number) => {
  const { data: timeOptions, isLoading } = trpc.events.getTimeOptions.useQuery(
    { eventId },
    {
      enabled: !!eventId,
    }
  );

  return {
    timeOptions,
    isLoading,
  };
}; 