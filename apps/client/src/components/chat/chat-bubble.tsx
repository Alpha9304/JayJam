import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { XIcon, CheckIcon, PencilIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, formatDistanceToNow, isToday } from 'date-fns';

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  onEdit?: (newMessage: string) => void;
  isEdited?: boolean;
  userName: string;
  userAvatar?: string;
  timestamp?: Date;
}

interface EditingBubbleProps {
  message: string;
  onEdit: (newMessage: string) => void;
  onCancel: () => void;
}

const EditingBubble: React.FC<EditingBubbleProps> = ({
  message,
  onEdit,
  onCancel,
}) => {
  const [editedMessage, setEditedMessage] = useState(message);

  const handleEdit = () => {
    onEdit(editedMessage);
  };

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={editedMessage}
        onChange={(e) => setEditedMessage(e.target.value)}
        className="w-full p-2 rounded bg-background text-foreground"
        rows={3}
      />
      <div className="flex gap-2 justify-end">
        <Button
          variant="destructive"
          size="sm"
          onClick={onCancel}
          className="text-muted-foreground absolute -bottom-5 right-0 rounded-sm p-2"
        >
          <XIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="success"
          size="sm"
          onClick={handleEdit}
          className="text-primary absolute -bottom-5 right-10 rounded-sm p-2"
        >
          <CheckIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

interface DisplayBubbleProps {
  message: string;
  isUser: boolean;
  isEdited: boolean;
  onStartEdit: () => void;
}

const DisplayBubble: React.FC<DisplayBubbleProps> = ({
  message,
  isUser,
  isEdited,
  onStartEdit,
}) => {
  return (
    <div className="flex items-start gap-2">
      <div className="flex-1">
        <p className="text-sm">{message}</p>
        {isEdited && (
          <p className="text-xs text-muted-foreground mt-1">(edited)</p>
        )}
      </div>
      {isUser && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onStartEdit}
          className="absolute -bottom-5 -right-1 text-muted-foreground hover:text-foreground border bg-white rounded-sm p-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <PencilIcon className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isUser,
  onEdit,
  isEdited = false,
  userName = "User",
  userAvatar,
  timestamp = new Date(),
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const avatarFallback = userName?.charAt(0) || "U";

  const handleEdit = (newMessage: string) => {
    if (onEdit) {
      onEdit(newMessage);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const formattedTime = isToday(timestamp)
    ? formatDistanceToNow(timestamp) + ' ago'
    : format(timestamp, 'MMM d, yyyy h:mm a');

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} mb-4 relative pt-2`}>
      <div className={`absolute -top-1 ${isUser ? "right-0" : "left-0"} flex items-center gap-1 bg-white border rounded-full p-1 shadow-sm`}>
        {!isUser && (
          <>
            <Avatar className="h-4 w-4">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback>{avatarFallback}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{userName}</span>
          </>
        )}
        {isUser && (
          <>
            <span className="text-xs text-muted-foreground">{userName}</span>
            <Avatar className="h-4 w-4">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback>{avatarFallback}</AvatarFallback>
            </Avatar>
          </>
        )}
      </div>
      <div
        className={`max-w-[70%] rounded-lg p-4 group ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isEditing ? (
          <EditingBubble
            message={message}
            onEdit={handleEdit}
            onCancel={handleCancel}
          />
        ) : (
          <>
            <DisplayBubble
              message={message}
              isUser={isUser}
              isEdited={isEdited}
              onStartEdit={() => setIsEditing(true)}
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formattedTime}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
