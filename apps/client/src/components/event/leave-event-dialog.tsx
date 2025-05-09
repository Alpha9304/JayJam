import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogClose,
  } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
import { useLeaveFinalizedEvent } from "@/hooks/event/use-leave-finalized-event";
  
type LeaveEventDialogProps = {
    leaveEventDialogOpen: boolean;
    setLeaveEventDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
    eventId: number;
    onLeave?: () => void;
};

const LeaveEventDialog = ({leaveEventDialogOpen, setLeaveEventDialogOpen, eventId}: LeaveEventDialogProps) => {
    const { handleLeave } = useLeaveFinalizedEvent();
  
    const handleUserLeave = async (event: React.MouseEvent ): Promise<void> => {
        event.stopPropagation();
        await handleLeave(eventId);
        setLeaveEventDialogOpen(false);
    };
  
    const handleCancel = (event: React.MouseEvent ): void => {
        event.stopPropagation();
        setLeaveEventDialogOpen(false);
    };
  
    const handleOpenChange = (): void => {
        setLeaveEventDialogOpen(false);
    };
  
    return (
      <Dialog open={leaveEventDialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent data-testid = "leave_event_dialog">
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. You will not be able to rejoin the event.
            </DialogDescription>
            <div id="add-buttons" className="flex justify-end gap-3">
              <DialogClose asChild>
                <Button variant="default" onClick={handleCancel} data-testid = "leave_event_cancel_btn">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="secondary" onClick={handleUserLeave} data-testid = "leave_event_cont_btn">Continue</Button>
              </DialogClose>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  };
  
  export default LeaveEventDialog;
  