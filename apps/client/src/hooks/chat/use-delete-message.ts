'use client';

import { trpc } from "@/trpc/client";


export function useDeleteMessage() {
  const mutation = trpc.message.deleteMessage.useMutation();

  const handleDelete = async (messageId: number) => {
    try {
      await mutation.mutateAsync({ id: messageId });
      return { success: true };
    } catch (error) {
      console.error("Error deleting message:", error);
      return { success: false };
    }
  };

  return { mutation, handleDelete };
}
