import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogClose,
  } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
import { useDeleteMessage } from "@/hooks/chat/use-delete-message";
//import useDelete;
  
type DeleteMessageDialogProps = {
    deleteMsgDialogOpen: boolean;
    setDeleteMsgDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    messageId: number;
};

const DeleteMessageDialog = ({deleteMsgDialogOpen, setDeleteMsgDialogOpen, messageId}: DeleteMessageDialogProps) => {
    const { handleDelete } = useDeleteMessage();

    const handleMessageDelete = async (event: React.MouseEvent ): Promise<void> => {
        event.stopPropagation();
        await handleDelete(messageId);
        setDeleteMsgDialogOpen(false);
    };
  
    const handleCancel = (event: React.MouseEvent ): void => {
        event.stopPropagation();
        setDeleteMsgDialogOpen(false);
    };
  
    const handleOpenChange = (): void => {
      setDeleteMsgDialogOpen(false);
    };
  
    return (
      <Dialog open={deleteMsgDialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent data-testid = "leave_event_dialog">
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. You will not be able to recover this message.
            </DialogDescription>
            <div id="add-buttons" className="flex justify-end gap-3">
              <DialogClose asChild>
                <Button variant="default" onClick={handleCancel} data-testid = "leave_event_cancel_btn">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="destructive" onClick={handleMessageDelete} data-testid = "leave_event_cont_btn">Continue</Button>
              </DialogClose>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  };
  
  export default DeleteMessageDialog;
  