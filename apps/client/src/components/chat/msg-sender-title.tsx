import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

interface SenderTitleProps {
  userName: string;
  userAvatar: string | undefined;
  // isUser: boolean;
}

export const SenderTitle: React.FC<SenderTitleProps> = ({
  userName,
  userAvatar,
  // isUser,
}) => {
  // const alignment = isUser ? "justify-end" : "justify-start";
  return (
    <div className={`flex items-center gap-1 bg-slate-50 border rounded-full p-1 shadow-sm `}>
      <Avatar className="h-4 w-4 flex items-center justify-center bg-slate-200 rounded-full">
        <AvatarImage src={userAvatar} alt={userName} />
        <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      <span className="text-xs text-muted-foreground">{userName}</span>
    </div>
  );
    // <>
    //   {!isUser && (
    //     <>
    //       <Avatar className="h-4 w-4">
    //         <AvatarImage src={userAvatar} alt={userName} />
    //         <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
    //       </Avatar>
    //       <span className="text-xs text-muted-foreground">{userName}</span>
    //     </>
    //   )}
    //   {isUser && (
    //     <>
    //       <span className="text-xs text-muted-foreground">{userName}</span>
    //       <Avatar className="h-4 w-4">
    //         <AvatarImage src={userAvatar} alt={userName} />
    //         <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
    //       </Avatar>
    //     </>
    //   )}
    // </>
};
