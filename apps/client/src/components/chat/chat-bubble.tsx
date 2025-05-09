import React, { useState } from "react";
import { SenderTitle } from "./msg-sender-title";
import { ReactionPill } from "./reaction-pill";
import { EditingMsgBox } from "./editing-msg-box";
import { DisplayMsgBox } from "./display-msg-box";
import { ChatBubbleEmojiPicker } from "./chat-bubble-emoji-picker";

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  isAdmin: boolean;
  onEdit?: (newMessage: string) => void;
  isDeleted: boolean;
  isEdited?: boolean;
  userName: string;
  userAvatar?: string;
  timestamp?: Date;
  messageId: number;
  channelId?: number;
  reactions?: Record<string, { count: number; reactedByMe: boolean }>;
  currentUserId?: number;
  onToggleReaction?: (
    messageId: number,
    emoji: string,
    reactedByMe: boolean
  ) => void;
  isEmojiPickerOpen?: boolean;
  onEmojiPickerToggle?: (messageId: number) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  userName = "User",
  userAvatar,
  messageId,
  message,
  isUser,
  isAdmin,
  isDeleted,
  isEdited = false,
  isEmojiPickerOpen = false,
  reactions,
  onEdit,
  onToggleReaction,
  onEmojiPickerToggle,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = (newMessage: string) => {
    if (onEdit) {
      onEdit(newMessage);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div
      className={`flex flex-col ${isUser ? "items-end" : "items-start"} mb-4 relative pt-2 group`}
    >
      {/* ───── header: avatar + name  ───── */}
      <div
        className={`absolute -top-1  z-10 ${isUser ? "right-0" : "left-0"} `}
      >
        <SenderTitle
          userName={userName}
          userAvatar={userAvatar}
          // isUser={isUser}
        />
      </div>

      {/* ───── Emoji picker ───── */}
      <div className="relative mt-2">
        {onToggleReaction && onEmojiPickerToggle && messageId && !isDeleted && (
          <ChatBubbleEmojiPicker
            isUser={isUser}
            messageId={messageId}
            isEmojiPickerOpen={isEmojiPickerOpen}
            reactions={reactions}
            onToggleReaction={onToggleReaction}
            onEmojiPickerToggle={onEmojiPickerToggle}
          />
        )}

        {/* ───── bubble content ───── */}
        <div
          className={`max-w-[70%] min-w-fit rounded-lg px-2 pt-4 pb-2 ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isEditing ? (
            <EditingMsgBox
              message={message}
              onEdit={handleEdit}
              onCancel={handleCancel}
            />
          ) : (
            <div>
              <DisplayMsgBox
                messageId={messageId}
                message={message}
                isUser={isUser}
                isAdmin={isAdmin}
                isDeleted={isDeleted}
                isEditing={isEditing}
                isEdited={isEdited}
                onStartEdit={() => setIsEditing(true)}
                onEmojiPickerClick={
                  !isDeleted
                    ? () => onEmojiPickerToggle?.(messageId)
                    : undefined
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* reaction pills */}
      <ReactionPill
        reactions={reactions}
        onToggleReaction={onToggleReaction}
        isUser={isUser}
        messageId={messageId}
      />
    </div>
  );
};
