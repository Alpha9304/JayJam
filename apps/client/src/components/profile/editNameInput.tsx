import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SquarePenIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useUserBasicInfoStore } from "@/store/use-user-basic-info-store";
import useUpdateName from "@/hooks/profile/use-update-name";

export const EditNameInput = () => {
	const [isEditingName, setIsEditingName] = useState(false);
  const { userBasicInfo } = useUserBasicInfoStore();
  const [name, setName] = useState(userBasicInfo.name)
  const inputRef = useRef<HTMLInputElement>(null) // reference to Input element
  const { updateName } = useUpdateName();

  useEffect(() => {
    if (userBasicInfo.name) {
      setName(userBasicInfo.name)
    }
  }, [userBasicInfo.name])

  // enable editing and focus Input when edit button clicked
  const handleEditClick = () => {
    setIsEditingName(true);
    inputRef.current?.focus();
  }

  // disable editing when Input unfocuses
  const handleBlur = () => {
    setIsEditingName(false);
    setName(userBasicInfo.name)
  }

  // handle changes as user types into namet input field
	const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setName(event.target.value);
	};

  // handle when user presses "Enter"
  const handleEnter = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      try {
        await updateName(name);
        inputRef.current?.blur();
      } catch {
        // if save failed...
        setIsEditingName(true);
        inputRef.current?.focus();
      }
    }
  };

	return (
	<div>
        <Label htmlFor="nameInput" className="">
          Name
        </Label>
        <div className="relative">
          <Input
            id="nameInput"
            ref={inputRef}
            type="Name"
            className={`cursor-default ${!isEditingName ? "pointer-events-none" : ""}`}
            onBlur={handleBlur}
            readOnly={!isEditingName}
            value={name}
            data-testid="edit_name_input"
            onChange={handleNameChange}
            onKeyDown={handleEnter}
          />
          <SquarePenIcon
            className="absolute stroke-1 scale-75 right-2 top-1/2 transform -translate-y-1/2 cursor-pointer"
            data-testid="edit_name_btn"
            onClick={handleEditClick}
          />
        </div>
    </div>
	)
}