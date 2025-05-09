import { trpc } from "@/trpc/client";

/** The message object shape returned by message.infinite */
type ChatMessage = {
  id: number;
  createdAt: Date;
  userId: number;
  channelId: number;
  modifiedAt: Date;
  content: string;
  reactions: Record<string, { count: number; reactedByMe: boolean }>;
};

export function useReactions(channelId: number, currentUserId: number) {
  const utils = trpc.useUtils();

  const toggleReaction = trpc.message.toggleReaction.useMutation({
    onSuccess: async () => {
        await utils.message.infinite.invalidate({ channelId });
    },
  });

  // Helper that patches the cached pages for message.infinite
  
  function patchCache(
    messageId: number,
    emoji: string,
    delta: 1 | -1,
    userId: number,
  ) {
    utils.message.infinite.setInfiniteData({ channelId }, (prev) => {
      if (!prev) return prev;

      const pages = prev.pages.map((page) => {
        const items = (page.items as ChatMessage[]).map((msg: ChatMessage) => {
          if (msg.id !== messageId) return msg;

        // Clone the reactions object to avoid shared references
        const clonedReactions = { ...(msg.reactions || {}) };
        const prevReaction = clonedReactions[emoji];

        const newCount = (prevReaction?.count ?? 0) + delta;

        if (newCount <= 0) {
          delete clonedReactions[emoji];
        } else {
          clonedReactions[emoji] = {
            count: newCount,
            reactedByMe: userId === currentUserId
              ? delta > 0
              : prevReaction?.reactedByMe ?? false,
          };
        }

        return {
          ...msg,
          reactions: clonedReactions,
        };
        });
        return { ...page, items };
      });

      return { ...prev, pages };
    });
  }

  // mutations
  // const addReaction = trpc.message.addReaction.useMutation({
  //   onMutate: ({ messageId, emoji }) =>
  //     patchCache(messageId, emoji, 1, currentUserId),
  // });

  // const removeReaction = trpc.message.removeReaction.useMutation({
  //   onMutate: ({ messageId, emoji }) =>
  //     patchCache(messageId, emoji, -1, currentUserId),
  // });

  // function toggle(messageId: number, emoji: string, reactedByMe: boolean) {
  //   console.log(`[useReactions] toggle called: msgId=${messageId}, emoji=${emoji}, reactedByMe=${reactedByMe}`);
  //   if (reactedByMe) {
  //     removeReaction.mutate({ messageId, emoji });
  //   } else {
  //     addReaction.mutate({ messageId, emoji });
  //   }
  // }

  // subscription 
  trpc.message.onReactionUpdate.useSubscription(
    { channelId },
    {
      onData: (data /* type comes from tRPC */) => {
        const { messageId, emoji, delta, userId } = data.data;
        patchCache(messageId, emoji, delta, userId);
      },
    },
  );

  return {
    toggle: (messageId: number, emoji: string, reactedByMe: boolean) => {
      toggleReaction.mutate({ messageId, emoji, remove: reactedByMe });
    },
  };
}
