import { useState } from 'react';
import { trpc } from "@/trpc/client";

export const useEditMessage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const editMessageMutation = trpc.message.editMessage.useMutation();

  const handleEdit = async (messageId: number, newContent: string) => {
    try {
      setIsEditing(true);
      await editMessageMutation.mutateAsync({
        id: messageId,
        content: newContent,
      });
      return true;
    } catch (error) {
      console.error('Error editing message:', error);
      return false;
    } finally {
      setIsEditing(false);
    }
  };

  return {
    handleEdit,
    isEditing,
  };
}; 