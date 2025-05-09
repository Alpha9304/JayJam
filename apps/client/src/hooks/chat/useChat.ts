import { useMessageSubscription } from './useMessageSubscription';
import { useTypingStatus } from './useTypingStatus';
import { useSendMessage } from './useSendMessage';
import { useTypingIndicator } from './useTypingIndicator';

export const useChat = (channelId: number) => {
  console.log('useChat initialized with channelId:', channelId);
  
  const {
    messages,
    error: messageError,
    isLoading: isLoadingMessages,
    connectionStatus,
    currentUserId,
  } = useMessageSubscription(channelId);

  console.log('useMessageSubscription returned connectionStatus:', connectionStatus);

  const {
    typingUsers,
    error: typingStatusError,
    isLoading: isLoadingTypingStatus,
  } = useTypingStatus(channelId);

  const {
    handleSend,
    isSending,
    error: sendError,
  } = useSendMessage(channelId);

  const {
    handleTyping,
    isTyping,
    error: typingIndicatorError,
  } = useTypingIndicator(channelId);

  return {
    messages,
    typingUsers,
    handleSend,
    handleTyping,
    isSending,
    isTyping,
    errors: {
      message: messageError,
      typingStatus: typingStatusError,
      send: sendError,
      typingIndicator: typingIndicatorError,
    },
    isLoading: isLoadingMessages || isLoadingTypingStatus,
    connectionStatus,
    currentUserId,
  };
}; 