import { useState } from "react";
import { Button } from "../ui/button";
import { PencilIcon, TrashIcon } from "lucide-react";
import DeleteMessageDialog from "./delete-message-dialog";

interface DisplayMsgBoxProps {
    messageId: number;
    message: string;
    isUser: boolean;
    isAdmin: boolean;
    isDeleted: boolean;
    isEdited: boolean;
    isEditing: boolean;
    onStartEdit: () => void;
    onEmojiPickerClick?: () => void;
}
  
export const DisplayMsgBox: React.FC<DisplayMsgBoxProps> = ({
    messageId,
    message,
    isUser,
    isAdmin,
    isDeleted,
    isEdited,
    isEditing,
    onStartEdit,
}) => {
    const [deleteMsgDialogOpen, setDeleteMsgDialogOpen] = useState(false);
    return (
      <div className="flex items-start gap-2 relative">
        <div className="flex-1">
          <p className={`text-sm ${isDeleted ? "italic" : "not-italic"}`}>
            {message}
          </p>
          {isEdited && (
            <p className="text-xs text-muted-foreground mt-1">(edited)</p>
          )}
        </div>
        <div className="flex gap-1 items-center">

          <div className="absolute -bottom-9 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isUser && !isEditing && !isDeleted && (
              <Button
                variant="outline"
                size="sm"
                onClick={onStartEdit}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-sm p-2"
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
            )}
            {(isUser || isAdmin) && !isDeleted && (
              <Button
                onClick={() => {
                  setDeleteMsgDialogOpen(!deleteMsgDialogOpen);
                }}
                size="sm"
                variant="destructive"
                className="rounded-sm p-2"
                data-testid={`${message}_delete_btn`}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            )}
            <DeleteMessageDialog
              deleteMsgDialogOpen={deleteMsgDialogOpen}
              setDeleteMsgDialogOpen={setDeleteMsgDialogOpen}
              messageId={messageId}
            />
          </div>
        </div>
      </div>
    );
};