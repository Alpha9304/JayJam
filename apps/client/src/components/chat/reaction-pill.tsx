
interface ReactionPillProps {
  reactions: Record<string, { count: number; reactedByMe: boolean }> | undefined;
  onToggleReaction:
    | ((messageId: number, emoji: string, reactedByMe: boolean) => void)
    | undefined;
  isUser: boolean;
  messageId: number;
}

export const ReactionPill = ({
  reactions,
  onToggleReaction,
  isUser,
  messageId,
}: ReactionPillProps) => {
  return (
    <div>
      {reactions && Object.keys(reactions).length > 0 && onToggleReaction && (
        <div
          className={`mt-1 flex gap-2 ${
            isUser ? "justify-end" : "justify-start"
          }`}
        >
          {Object.entries(reactions ?? {}).map(
            ([emoji, { count, reactedByMe }]) => (
              <button
                key={emoji}
                onClick={() => {
                  if (messageId !== undefined) {
                    onToggleReaction(messageId, emoji, reactedByMe);
                  }
                }}
                className={`reaction-badge ${reactedByMe ? "reacted" : ""}`}
              >
                {emoji} {count}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};
