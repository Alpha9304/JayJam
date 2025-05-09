import React from "react";
import { Button } from "@/components/ui/button";
import { SmilePlus } from "lucide-react";
import { EmojiData, EmojiPicker } from "./emoji-picker";

interface ChatBubbleEmojiPickerProps {
  isUser: boolean;
  messageId: number;
  isEmojiPickerOpen: boolean;
  reactions?: Record<string, { count: number; reactedByMe: boolean }>;
  onToggleReaction: (messageId: number, emoji: string, reactedByMe: boolean) => void;
  onEmojiPickerToggle: (messageId: number) => void;
}

export const ChatBubbleEmojiPicker: React.FC<ChatBubbleEmojiPickerProps> = ({
  isUser,
  messageId,
  isEmojiPickerOpen,
  reactions,
  onToggleReaction,
  onEmojiPickerToggle,
}) => {
  return (
    <div className="absolute top-0 bottom-0 left-0 right-0">
      <Button
        size="icon"
        variant="ghost"
        onClick={() => onEmojiPickerToggle(messageId)}
        className={`absolute ${
          isUser ? "-left-8" : "-right-8"
        } top-1/2 -translate-y-1/2 h-6 w-6 p-0 bg-white hover:bg-gray-100 rounded-full shadow-sm z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
      >
        <SmilePlus className="h-4 w-4" />
      </Button>

      {isEmojiPickerOpen && (
        <div
          className={`absolute z-[100] ${isUser ? "-left-2" : "-right-2"} top-0`}
          style={{
            transform: `translateX(${isUser ? "-100%" : "100%"}) translateY(-25%)`,
          }}
        >
          <EmojiPicker
            onEmojiSelect={(emojiData: EmojiData) => {
              const emoji = emojiData.native || emojiData.shortcodes || emojiData.id;
              if (!emoji) {
                console.warn("[EmojiPicker] No valid emoji from picker!");
                return;
              }
              const reactedByMe = reactions?.[emoji]?.reactedByMe ?? false;
              onToggleReaction(messageId, emoji, reactedByMe);
              onEmojiPickerToggle(messageId);
            }}
            theme="light"
            previewPosition="none"
            emojiButtonSize={26}
          />
        </div>
      )}
    </div>
  );
}; 