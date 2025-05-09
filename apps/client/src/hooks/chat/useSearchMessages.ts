import { trpc } from "@/trpc/client";

export const useSearchMessages = (channelId: number, keyword: string) => {
  return trpc.message.searchMessages.useQuery(
    { channelId, keyword },
    { enabled: keyword.trim().length > 0 }
  );
};
