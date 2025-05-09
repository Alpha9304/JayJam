import { trpc } from "@/trpc/client";

export const useCreateChatChannel = (eventId: number, isPending: boolean) => {
    const { data: channelId } = trpc.chat.getOrCreateChat.useQuery(
        {
            pendingEventId: isPending ? eventId : undefined,
            finalizedEventId: !isPending ? eventId : undefined
        },
    );

    return { channelId: channelId ?? null };
}