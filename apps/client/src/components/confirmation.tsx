import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "./ui/dialog";
import { ResponsiveDialog } from "./responsive-dialog";
import { useConfirmationDialog } from "../store/use-dialog"

// New Confirmation Dialog Component
interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel?: () => void
  variant?: 'default' | 'destructive'
}

export const ConfirmationDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Save changes",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = 'default'
}: ConfirmationDialogProps) => {

  const { isDialogOpen, closeDialog } = useConfirmationDialog();

  const handleCancel = () => {
    onOpenChange(false)
    onCancel?.()
  }

  const handleConfirm = () => {
    onOpenChange(false)
    onConfirm()
  }

  return (
    <ResponsiveDialog open={isDialogOpen} onOpenChange={(open) => {
      if (!open) closeDialog();
    }}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <button 
                className="px-4 py-2 rounded-md text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80"
                onClick={handleCancel}
              >
                {cancelLabel}
              </button>
            </DialogClose>
            <button
              className={cn(
                "px-4 py-2 rounded-md text-sm text-white",
                variant === 'destructive' ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"
              )}
              onClick={handleConfirm}
            >
              {confirmLabel}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ResponsiveDialog>
  )
}
