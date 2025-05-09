import { useState, useRef, useEffect } from 'react';
import { ChatBubble } from './chat-bubble';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '../ui/textarea';
<<<<<<< HEAD
import { trpc } from '@/trpc/client';
import { useSendMessage } from '../../hooks/chat/useSendMessage';
import { useMessageSubscription } from '../../hooks/chat/useMessageSubscription';
=======
import { useChat } from '@/hooks/chat/useChat';
import { useUserBasicInfoStore } from '@/store/use-user-basic-info-store';
import { Send as PaperAirplaneIcon } from "lucide-react";
import { useCreateChatChannel } from '@/hooks/chat/use-create-chat-channel';
>>>>>>> origin/dev

// Define message interface with userId field
interface Message {
<<<<<<< HEAD
  id: string;
  text: string;
  isUser: boolean;
  isEdited: boolean;
  userName: string;
  userAvatar?: string;
=======
  id: number;
  channelId: number;
  createdAt: Date;
  modifiedAt: Date;
  content: string;
  userId?: number;
>>>>>>> origin/dev
}

interface ChatWindowProps {
  eventId: number;
<<<<<<< HEAD
  isFinalizedEvent?: boolean;
  currentUserId: number;
  currentUserName: string;
  currentUserAvatar?: string;
}

export function ChatWindow({
  eventId,
  isFinalizedEvent = false,
  currentUserId,
  currentUserName,
  currentUserAvatar,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
=======
  isPending?: boolean;
}

function SubscriptionStatus({ status, error, reset }: { 
  status: 'idle' | 'connecting' | 'error' | 'connected'; 
  error?: Error | null;
  reset?: () => void;
}) {
  return (
    <div
      className={`rounded-full p-2 text-sm transition-colors ${
        status === 'idle' || status === 'connecting'
          ? 'bg-white text-gray-500 dark:bg-gray-900 dark:text-gray-400'
          : status === 'error'
          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
      }`}
    >
      {status === 'idle' || status === 'connecting' ? (
        <div>
          Connecting...
          {error && ' (There are connection problems)'}
        </div>
      ) : status === 'error' ? (
        <div>
          Error - <em>{error?.message}</em>
          {reset && (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                reset();
              }}
              className="hover:underline ml-1"
            >
              Try Again
            </a>
          )}
        </div>
      ) : (
        <div>Connected - awaiting messages</div>
      )}
    </div>
  );
}

export function ChatWindow({ eventId, isPending }: ChatWindowProps) {
  const { channelId } = useCreateChatChannel(eventId, isPending ?? false);
  const { userBasicInfo } = useUserBasicInfoStore();
>>>>>>> origin/dev
  const [newMessage, setNewMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatHookResult = useChat(channelId ?? -1);
  const {
    messages,
    typingUsers,
    handleSend,
    handleTyping,
    isSending,
    errors,
    isLoading,
    connectionStatus,
  } = chatHookResult;

  useEffect(() => {
    adjustTextareaHeight();
  }, [newMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const { handleSend } = useSendMessage();

  const { data: channel } = trpc.chats.getChannelByEventId.useQuery({
    eventId,
    isFinalizedEvent,
  });

  // Auto-grow textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  if (!channelId) {
    return <div>Loading chat...</div>;
  }

<<<<<<< HEAD
  // Optimistically add message & send to server
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !channel?.id) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      text: newMessage,
      isUser: true,
      isEdited: false,
      userName: currentUserName,
      userAvatar: currentUserAvatar,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      await handleSend(channel.id, newMessage);
    } catch (err) {
      console.error("Failed to send message", err);
      // Optionally show an error toast
    }

    setNewMessage('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
=======
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      handleSend(newMessage);
      setNewMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
    
>>>>>>> origin/dev
  };
  
  // Determine connection status
  let displayConnectionStatus: 'idle' | 'connecting' | 'error' | 'connected' = 'connecting';
  
  if (connectionStatus) {
    // If the hook provides a connectionStatus, use it
    displayConnectionStatus = connectionStatus as 'idle' | 'connecting' | 'error' | 'connected';
    console.log('Using connectionStatus from hook:', displayConnectionStatus);
  } else if (isLoading) {
    displayConnectionStatus = 'connecting';
    console.log('Using isLoading for connectionStatus:', displayConnectionStatus);
  } else if (errors.message || errors.typingStatus || errors.send || errors.typingIndicator) {
    displayConnectionStatus = 'error';
    console.log('Using error state for connectionStatus:', displayConnectionStatus);
  } else {
    displayConnectionStatus = 'connected';
    console.log('Defaulting to connected status:', displayConnectionStatus);
  }

<<<<<<< HEAD
  // Listen for new real-time messages
  useMessageSubscription({
    channelId: channel?.id ?? -1,
    onMessage: (message) => {
      if (!message || !message.id) return;

      setMessages((prev) => {
        // prevent duplicate temp + real version
        const withoutTemp = prev.filter((msg) => !msg.id.startsWith('temp'));
        return [
          ...withoutTemp,
          {
            id: String(message.id),
            text: message.content,
            isUser: message.userId === currentUserId,
            isEdited: false,
            userName: (message as any)?.user?.name ?? 'User',
            userAvatar: undefined,
          },
        ];
      });
    },
  });

  const handleEditMessage = (messageId: string, newText: string) => {
    setMessages(
      messages.map((msg) =>
        msg.id === messageId ? { ...msg, text: newText, isEdited: true } : msg
      )
    );
  };
=======
  const connectionError = errors.message || errors.typingStatus || errors.send || errors.typingIndicator;
  console.log('Connection error:', connectionError);
>>>>>>> origin/dev

  return (
    <div className="flex flex-col h-[500px] border rounded-lg overflow-hidden">
      <div className="p-2 border-b bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-end">
          <SubscriptionStatus 
            status={displayConnectionStatus} 
            error={connectionError} 
            reset={() => {
              console.log('Reset connection requested');
              window.location.reload();
            }}
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
<<<<<<< HEAD
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message.text}
              isUser={message.isUser}
              isEdited={message.isEdited}
              onEdit={message.isUser ? (newText) => handleEditMessage(message.id, newText) : undefined}
              userName={message.userName}
              userAvatar={message.userAvatar}
            />
          ))}
=======
          {messages.map((message) => {
            // Safely handle messages with or without userId
            const messageWithTyping = message as Message;
            const isCurrentUser = userBasicInfo?.id === messageWithTyping.userId;
            
            return (
              <ChatBubble
                key={message.id}
                message={message.content}
                isUser={isCurrentUser}
                isEdited={message.modifiedAt > message.createdAt}
                userName={isCurrentUser ? userBasicInfo?.name || 'You' : 'Anonymous'}
                userAvatar={undefined}
                timestamp={message.createdAt}
              />
            );
          })}
          {typingUsers.length > 0 && (
            <div className="text-sm italic text-muted-foreground mt-2">
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </div>
          )}
          <div ref={messagesEndRef} />
>>>>>>> origin/dev
        </div>
      </ScrollArea>

      <div className="p-2 border-t bg-white dark:bg-gray-900">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="resize-none min-h-[40px] max-h-[200px] rounded-lg"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={isSending}
            className="rounded-full p-2 h-auto"
          >
            {isSending ? (
              <span className="flex items-center">Sending...</span>
            ) : (
              <PaperAirplaneIcon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
