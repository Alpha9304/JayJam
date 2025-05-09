import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SquarePenIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useUserBasicInfoStore } from "@/store/use-user-basic-info-store";
import useUpdatePronouns from "@/hooks/profile/use-update-pronouns";
import { useGetPronouns } from "@/hooks/profile/use-get-pronouns";

export const EditPronounsInput = () => {
	const [isEditingPronouns, setIsEditingName] = useState(false);
	const { userBasicInfo } = useUserBasicInfoStore();
	const [pronouns, setPronouns] = useState(useGetPronouns().data?.pronouns ?? "")
	const inputRef = useRef<HTMLInputElement>(null) // reference to Input element
	const { updatePronouns } = useUpdatePronouns();

	useEffect(() => {
		if (userBasicInfo.pronouns) {
			setPronouns(userBasicInfo.pronouns)
		}
	}, [userBasicInfo.pronouns])

	// enable editing and focus Input when edit button clicked
	const handleEditClick = () => {
		setIsEditingName(true);
		inputRef.current?.focus();
	}

	// disable editing when Input unfocuses
	const handleBlur = () => {
		setIsEditingName(false);
		setPronouns(userBasicInfo.pronouns)
	}

	// handle changes as user types into pronouns input field
	const handlePronounsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setPronouns(event.target.value);
	};

	// handle when user presses "Enter"
	const handleEnter = async (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
		event.preventDefault();
		try {
			updatePronouns(pronouns);
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
			<Label htmlFor="pronounsInput" className="">
			Pronouns
			</Label>
			<div className="relative">
			<Input
				id="pronounsInput"
				ref={inputRef}
				type="Name"
				className={`cursor-default ${!isEditingPronouns ? "pointer-events-none" : ""}`}
				onBlur={handleBlur}
				readOnly={!isEditingPronouns}
				value={pronouns}
				data-testid="edit_pronouns_input"
				onChange={handlePronounsChange}
				onKeyDown={handleEnter}
			/>
			<SquarePenIcon
				className="absolute stroke-1 scale-75 right-2 top-1/2 transform -translate-y-1/2 cursor-pointer"
				data-testid="edit_pronouns_btn"
				onClick={handleEditClick}
			/>
			</div>
		</div>
	)
}