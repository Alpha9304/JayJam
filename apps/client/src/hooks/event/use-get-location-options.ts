import { trpc } from "@/trpc/client";

// interface LocationOption {
//   id: number;
//   location: string;
//   locationVoteCount: number;
//   hasVoted: boolean;
// }

export const useGetLocationOptions = (eventId: number) => {
    const { data: locationOptions, isLoading } = trpc.events.getLocationOptions.useQuery(
        { eventId },
        {
            enabled: !!eventId,
        }
    );

    return { locationOptions, isLoading };
}; 