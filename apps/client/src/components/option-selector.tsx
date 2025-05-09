import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Plus, X } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { useState } from "react";

interface OptionSelectorProps {
    options: string[];
    addOptionTitle: string;
    onAddOption: (option: string) => void;
    onDeleteOption: (option: string) => void;
    dialogContent?: React.ReactNode | ((closeDialog: () => void) => React.ReactNode);
    maxOptions?: number;
}

export default function OptionSelector({ options, addOptionTitle, onDeleteOption, dialogContent, maxOptions }: OptionSelectorProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    const closeDialog = () => setIsDialogOpen(false);
    
    return (
        <div className="space-y-4">
            {(!maxOptions || options.length < maxOptions) && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button 
                            variant="outline" 
                            className="w-full"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {addOptionTitle}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{addOptionTitle}</DialogTitle>
                        </DialogHeader>
                        {typeof dialogContent === 'function' 
                            ? dialogContent(closeDialog)
                            : dialogContent}
                    </DialogContent>
                </Dialog>
            )}

            <ScrollArea className="h-auto rounded-md border">
                {options && options.length > 0 ? (
                    <div className="p-4 space-y-2">
                        {options.map((option, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded-lg border">
                                <div>
                                    <p className="font-medium">
                                        {option}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onDeleteOption(option)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-4 text-center text-muted-foreground">
                        No {addOptionTitle} added yet. You can add up to {maxOptions} {addOptionTitle}.
                    </div>
                )}
            </ScrollArea>
        </div>
    )
}