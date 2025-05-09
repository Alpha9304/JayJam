import { useState } from 'react';
import { trpc } from '../../trpc/client';

export const useSendMessage = (channelId: number) => {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = trpc.message.createMessage.useMutation({
    onMutate: () => {
      setIsSending(true);
    },
    onSuccess: () => {
      setIsSending(false);
    },
    onError: (err) => {
      setError(new Error(err.message));
      setIsSending(false);
    },
  });

  const handleSend = async (content: string) => {
    if (!content.trim()) return;
    
    try {
      await sendMessage.mutateAsync({
        channelId,
        content,
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return {
    handleSend,
    isSending,
    error,
  };
}; 