import { CheckIcon } from "lucide-react";

import { XIcon } from "lucide-react";

import { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

interface EditingMsgBoxProps {
    message: string;
    onEdit: (newMessage: string) => void;
    onCancel: () => void;
  }
  
export const EditingMsgBox: React.FC<EditingMsgBoxProps> = ({
    message,
    onEdit,
    onCancel,
  }) => {
    const [editedMessage, setEditedMessage] = useState(message);
  
    const handleEdit = () => {
      onEdit(editedMessage);
    };
  
    return (
      <div className="flex flex-col w-full gap-2 relative">
        <Textarea
          value={editedMessage}
          onChange={(e) => setEditedMessage(e.target.value)}
          className="w-full p-2 rounded bg-background text-foreground"
          rows={3}
          autoFocus
        />
        <div className="flex gap-2 justify-start mt-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={onCancel}
            className="rounded-sm p-2"
          >
            <XIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="success"
            size="sm"
            onClick={handleEdit}
            className="rounded-sm p-2"
          >
            <CheckIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };