import { trpc } from "@/trpc/client";

export const useGetBannedParticipants = () => {
  const { data, isLoading, error } = trpc.events.getBannedParticipants.useQuery();

  return {
    bannedUsers: data ?? [],
    isLoading,
    error,
  };
};