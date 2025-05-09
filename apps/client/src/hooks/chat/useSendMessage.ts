import { useState } from 'react';
import { trpc } from '../../trpc/client';

export const useSendMessage = () => {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutation = trpc.messages.createMessage.useMutation({
    onMutate: () => {
      setIsSending(true);
      setError(null);
    },
    onSuccess: () => {
      setIsSending(false);
    },
    onError: (err) => {
      setError(new Error(err.message));
      setIsSending(false);
    },
  });

  const handleSend = async (channelId: number, content: string) => {
    if (!content.trim()) return;
    try {
      await mutation.mutateAsync({ channelId, content });
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(new Error('Failed to send message'));
    }
  };

  return {
    handleSend,
    isSending,
    error,
  };
};
