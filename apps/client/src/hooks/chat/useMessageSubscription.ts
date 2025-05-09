<<<<<<< HEAD
import { trpc } from "@/trpc/client";
=======
import { useState, useEffect } from 'react';
import { trpc } from '../../trpc/client';
import { useUserBasicInfoStore } from '@/store/use-user-basic-info-store';
>>>>>>> origin/dev

interface IncomingMessage {
  id: number;
  channelId: number;
  createdAt: string;
  modifiedAt: string;
  content: string;
  userId: number | null;
}

<<<<<<< HEAD
export const useMessageSubscription = ({
  channelId,
  onMessage,
}: {
  channelId: number;
  onMessage: (message: IncomingMessage) => void;
}) => {
  trpc.messages.onCreateMessage.useSubscription(
    { channelId },
    {
      onData: (trackedMessage) => {
        const { data } = trackedMessage;
        onMessage({
          id: data.id,
          channelId: data.channelId,
          content: data.content as string,
          createdAt: new Date(data.createdAt).toISOString(),
          modifiedAt: new Date(data.modifiedAt).toISOString(),
          userId: (data as any).userId ?? null,
        });
      },
      onError: (err) => {
        console.error("Subscription error:", err);
      },
    }
  );
};
=======
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
            createdAt: new Date(message.data.createdAt),
            modifiedAt: new Date(message.data.modifiedAt),
            content: message.data.content as string
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
>>>>>>> origin/dev
