import { useState, useRef } from 'react';
import { trpc } from '../../trpc/client';

export const useTypingIndicator = (channelId: number) => {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);

  const updateTypingStatus = trpc.chat.isTyping.useMutation({
    onError: (err) => {
      setError(new Error(err.message));
    },
  });

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      updateTypingStatus.mutate({
        channelId,
        typing: true,
      });
    }

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingStatus.mutate({
        channelId,
        typing: false,
      });
    }, 3000);
  };

  return {
    handleTyping,
    isTyping,
    error,
  };
}; 