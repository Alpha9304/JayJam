"use client";

import React from "react";
import dynamic from "next/dynamic";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

// Initialize emoji data once
// Initialize emoji data is no longer needed with @emoji-mart/react

export interface EmojiData {
  id: string;
  native: string;
  shortcodes?: string;
  unified?: string;
  names?: string[];
}

export interface EmojiPickerProps {
  onEmojiSelect: (emoji: EmojiData) => void;
  theme?: "light" | "dark" | "auto";
  previewPosition?: "none" | "top" | "bottom";
  emojiButtonSize?: number;
  emojiSize?: number;
  maxFrequentRows?: number;
}

export const EmojiPicker = dynamic(
  () =>
    Promise.resolve((props: EmojiPickerProps) => (
      <Picker
        data={data}
        emojiSize={20}
        emojiButtonSize={28}
        theme="light"
        maxFrequentRows={0}
        {...props}
      />
    )),
  { ssr: false }
);
