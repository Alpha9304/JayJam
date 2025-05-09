import { useState, useRef, useEffect } from 'react';
import { ChatBubble } from './chat-bubble';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '../ui/textarea';
import { useChat } from '@/hooks/chat/useChat';
import { useUserBasicInfoStore } from '@/store/use-user-basic-info-store';
import { Send as PaperAirplaneIcon } from "lucide-react";
import { useCreateChatChannel } from '@/hooks/chat/use-create-chat-channel';
import { useReactions } from "@/hooks/chat/use-reaction";
import { useEditMessage } from "@/hooks/chat/useEditMessage";
import { format, isToday, isSameDay, differenceInMinutes } from 'date-fns';
import { useGetAdmin } from '@/hooks/chat/use-get-admin';
import { useIsMutedPending } from '@/hooks/event/use-is-muted-pending';
import { useIsMutedFinalized } from '@/hooks/event/use-is-muted-finalized';
import { useSearchMessages } from "@/hooks/chat/useSearchMessages";

// Define message interface with userId field
interface Message {
  id: number;
  channelId: number;
  userId: number;
  createdAt: Date;
  modifiedAt: Date;
  content: string;
  // new
  userName?: string;
  reactions?: Record<string, { count: number; reactedByMe: boolean }>;
}

interface ChatWindowProps {
  eventId: number;
  isPending?: boolean;
}

interface MessageGroup {
  timestamp: Date;
  messages: Message[];
}

function groupMessagesByTime(messages: Message[]): MessageGroup[] {
  if (messages.length === 0) return [];

  const groups: MessageGroup[] = [];
  let currentGroup: MessageGroup = {
    timestamp: messages[0].createdAt,
    messages: [messages[0]]
  };

  for (let i = 1; i < messages.length; i++) {
    const currentMessage = messages[i];
    const prevMessage = messages[i - 1];
    
    // Start a new group if:
    // 1. More than 30 minutes between messages
    // 2. Different day
    if (
      differenceInMinutes(currentMessage.createdAt, prevMessage.createdAt) > 30 ||
      !isSameDay(currentMessage.createdAt, prevMessage.createdAt)
    ) {
      groups.push(currentGroup);
      currentGroup = {
        timestamp: currentMessage.createdAt,
        messages: []
      };
    }
    
    currentGroup.messages.push(currentMessage);
  }
  
  groups.push(currentGroup);
  return groups;
}

function formatTimestamp(date: Date): string {
  if (isToday(date)) {
    return format(date, 'h:mm a');
  }
  return format(date, 'MMM d, h:mm a');
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
  const { toggle } = useReactions(channelId ?? -1, userBasicInfo?.id ?? -1);
  const { handleEdit } = useEditMessage();
  const [newMessage, setNewMessage] = useState('');
  const [openEmojiPickerId, setOpenEmojiPickerId] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [adminId, setAdminId] = useState(-1);
  const { data, isFetching, isFetched } = useGetAdmin(channelId);
  const isMutedPending = useIsMutedPending(eventId, userBasicInfo?.id).isMutedPending?.muted;
  const isMutedFinalized = useIsMutedFinalized(eventId, userBasicInfo?.id).isMutedFinalized?.muted;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const { data: searchResults} = useSearchMessages(channelId ?? -1, activeSearch);
  
  // This line has been moved to after the declaration of 'messages'

  useEffect(() => {
    if(channelId && isFetched && data) {
      setAdminId(data.adminUserId);
    }
  }, [channelId, isFetching])

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

  const messagesToRender = activeSearch ? searchResults ?? [] : messages;

  useEffect(() => {
    adjustTextareaHeight();
  }, [newMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      handleSend(newMessage);
      setNewMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
    
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

  const connectionError = errors.message || errors.typingStatus || errors.send || errors.typingIndicator;
  console.log('Connection error:', connectionError);

  const handleEmojiPickerToggle = (messageId: number) => {
    setOpenEmojiPickerId(openEmojiPickerId === messageId ? null : messageId);
  };



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
      
      <div className="p-2 border-b bg-white dark:bg-gray-900">
        {activeSearch ? (
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setActiveSearch('');
                setSearchQuery('');
              }}
              variant="outline"
            >
              Go Back
            </Button>
            <span className="text-sm self-center text-muted-foreground">
              Showing results for: <strong>{activeSearch}</strong>
            </span>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setActiveSearch(searchQuery);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 dark:bg-gray-800 dark:text-white"
            />
            <Button type="submit">Search</Button>
          </form>
        )}
      </div>



      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {groupMessagesByTime(messagesToRender).map((group) => (
            <div key={group.timestamp.toISOString()} className="space-y-8">
              <div className="flex items-center justify-center">
                <div className="px-4 py-1 rounded-full bg-muted text-xs text-muted-foreground">
                  {formatTimestamp(group.timestamp)}
                </div>
              </div>
              {group.messages.map((message) => {
                const isCurrentUser = userBasicInfo?.id === message.userId;
                console.log("userBasic id", userBasicInfo?.id);
                console.log("msg userId", message.userId);
                console.log("adminId", adminId);
                const isChatAdmin = userBasicInfo?.id === adminId;
                console.log("is Admin:", isChatAdmin);
                return (
                  <ChatBubble
                    key={`${message.id}-${Object.keys(message.reactions ?? {}).join(',')}`}
                    message={message.content}
                    isUser={isCurrentUser}
                    isAdmin={isChatAdmin}
                    isDeleted={message.content === "This message has been deleted."}
                    isEdited={message.modifiedAt > message.createdAt && message.content !== "This message has been deleted."}
                    userName={
                      message.userName ??
                      (isCurrentUser ? "You" : "Anonymous")
                    }
                    userAvatar={undefined}
                    messageId={message.id}
                    reactions={message.reactions}
                    onToggleReaction={toggle}
                    isEmojiPickerOpen={openEmojiPickerId === message.id}
                    onEmojiPickerToggle={handleEmojiPickerToggle}
                    onEdit={isCurrentUser ? (newContent) => handleEdit(message.id, newContent) : undefined}
                  />
                );
              })}
            </div>
          ))}
          {typingUsers.length > 0 && (
            <div className="text-sm italic text-muted-foreground mt-2">
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-2 border-t bg-white dark:bg-gray-900">
      {((isPending && !isMutedPending) || (!isPending && !isMutedFinalized)) && (     
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
                        )}
        
      </div>
    </div>
  );
}