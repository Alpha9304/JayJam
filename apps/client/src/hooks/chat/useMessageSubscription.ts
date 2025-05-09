import { useState, useEffect } from 'react';
import { trpc } from '../../trpc/client';
import { useUserBasicInfoStore } from '@/store/use-user-basic-info-store';


interface ReactionInfo {
  count: number;
  reactedByMe: boolean;
}

interface Message {
  id: number;
  channelId: number;
  userId: number;
  createdAt: Date;
  modifiedAt: Date;
  content: string;
  reactions?: Record<string, ReactionInfo>; 
}

export const useMessageSubscription = (channelId: number) => {
  console.log('useMessageSubscription initialized with channelId:', channelId);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { userBasicInfo } = useUserBasicInfoStore();
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  console.log('Current connection status:', connectionStatus);

  // For debugging purposes, log when this hook re-renders
  useEffect(() => {
    console.log('useMessageSubscription hook re-rendered');
  });

  const subscription = trpc.message.onCreateMessage.useSubscription(
    {
      channelId,
      lastEventId,
    },
    {
      onStarted: () => {
        console.log('Subscription started successfully');
        setConnectionStatus('connected');
      },
      onData: (message) => {
        console.log('Message received:', message);
        if (message.id) {
          const newMessage: Message = {
            id: message.data.id,
            channelId: message.data.channelId,
            userId: message.data.userId,
            createdAt: new Date(message.data.createdAt),
            modifiedAt: new Date(message.data.modifiedAt),
            content: message.data.content as string,
            reactions: message.data.reactions || {}
          };
          console.log('Processed new message:', newMessage);
          setMessages((prev) => [...prev, newMessage]);
          setLastEventId(String(message.data.id));
        }
      },
      onError: (err) => {
        console.error('Subscription error:', err);
        setConnectionStatus('error');
        setError(new Error(err.message));
      },
    }
  );

  // Message update subscription
  trpc.message.onMessageUpdate.useSubscription(
    { channelId },
    {
      onData: (update) => {
        console.log('Message update received:', update);
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === update.data.id
              ? {
                  ...msg,
                  content: update.data.content,
                  modifiedAt: new Date(update.data.modifiedAt),
                }
              : msg
          )
        );
      },
      onError: (err) => {
        console.error('Message update subscription error:', err);
      },
    }
  );

  // Reaction update subscription
  trpc.message.onReactionUpdate.useSubscription(
    { channelId },
    {
      onStarted: () => {
        console.log('[Subscription] onReactionUpdate started');
      },
      onData: (update) => {
        console.log('[Subscription] Reaction update:', update);
        const { emoji, delta, userId, messageId } = update.data;

        setMessages((prevMessages) =>
          prevMessages.map((msg) => {
            // Only update the specific message
            if (msg.id !== messageId) {
              return msg;
            }

            const currentReactions = msg.reactions ?? {};
            const prev = currentReactions[emoji];

            // New reaction
            if (!prev && delta > 0) {
              return {
                ...msg,
                reactions: {
                  ...currentReactions,
                  [emoji]: {
                    count: 1,
                    reactedByMe: userId === userBasicInfo?.id,
                  },
                },
              };
            }

            // Update reaction
            const newCount = (prev?.count ?? 0) + delta;

            if (newCount <= 0) {
              const rest = { ...currentReactions };
              delete rest[emoji];
              return { ...msg, reactions: rest };
            }

            return {
              ...msg,
              reactions: {
                ...currentReactions,
                [emoji]: {
                  count: newCount,
                  reactedByMe: userId === userBasicInfo?.id,
                },
              },
            };
          })
        );
      },
      onError: (err) => {
        console.error('[Subscription] onReactionUpdate error:', err);
      },
    }
  );

  console.log('Subscription object:', subscription);

  // Check if the subscription actually exists
  useEffect(() => {
    console.log('Subscription status check - data exists:', !!subscription.data);
    
    // After 5 seconds, log the current state to see if anything changed
    const timer = setTimeout(() => {
      console.log('5s timeout - connection status:', connectionStatus);
      console.log('5s timeout - subscription:', subscription);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [subscription, connectionStatus]);

  return {
    messages,
    error,
    connectionStatus,
    isLoading: connectionStatus === 'connecting',
    currentUserId: userBasicInfo?.id
  };
}; 