import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Check, ChevronsUpDown, Trash2 } from "lucide-react";
import { useState } from "react";
import { FormControl } from "./ui/form";
import { ScrollArea } from "./ui/scroll-area";

interface ComboboxWithAddProps {
  options: string[];
  value?: string;
  onValueChange: (value: string) => void;
  onAddOption: (newOption: string) => void;
  onDeleteOption: (option: string) => void;
  placeholder?: string;
  addButtonLabel?: string;
  className?: string;
}
// TODO: cannot scroll by wheel

export function ComboboxWithAdd({
  options,
  value,
  onValueChange,
  onAddOption,
  onDeleteOption,
  placeholder = "Select option...",
  addButtonLabel = "Add",
  className,
}: ComboboxWithAddProps) {
  const [open, setOpen] = useState(false);
  const [newOption, setNewOption] = useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            className={`w-full justify-between ${className}`}
          >
            {value || placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start">
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder={`Add new ${placeholder.toLowerCase()}`}
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              className="h-9"
            />
            {newOption && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (newOption) {
                    onAddOption(newOption);
                    onValueChange(newOption);
                    setNewOption("");
                  }
                }}
              >
                {addButtonLabel}
              </Button>
            )}
          </div>
          
            <ScrollArea className="max-h-[200px] overflow-auto">
            {Array.isArray(options) && options.length > 0 && options.map((option) => (
              <Button
                key={option}
                variant="ghost"
                className="w-full justify-start font-normal group"
                onClick={() => {
                  onValueChange(option);
                  setOpen(false);
                }}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center">
                    {option === value && (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    {option}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-70 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteOption(option);
                      if (option === value) {
                        onValueChange("");
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Button>
            ))}
            </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
} 