import { useState } from 'react';
import { trpc } from '../../trpc/client';

export const useTypingStatus = (channelId: number) => {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const { data: typingData } = trpc.chat.whoIsTyping.useSubscription(
    { channelId },
    {
      onData: (users: string[]) => {
        setTypingUsers(users);
      },
      onError: (err) => {
        setError(new Error(err.message));
      },
    }
  );

  return {
    typingUsers,
    error,
    isLoading: !typingData && !error,
  };
}; 