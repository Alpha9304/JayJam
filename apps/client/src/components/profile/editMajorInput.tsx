import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SquarePenIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useUserBasicInfoStore } from "@/store/use-user-basic-info-store";
import useUpdateMajor from "@/hooks/profile/use-update-major";
import { useGetMajor } from "@/hooks/profile/use-get-major";

export const EditMajorInput = () => {
	const [isEditingMajor, setIsEditingName] = useState(false);
	const { userBasicInfo } = useUserBasicInfoStore();
	const [major, setMajor] = useState(useGetMajor().data?.major ?? "")
	const inputRef = useRef<HTMLInputElement>(null) // reference to Input element
	const { updateMajor } = useUpdateMajor();

	useEffect(() => {
		if (userBasicInfo.major) {
			setMajor(userBasicInfo.major)
		}
	}, [userBasicInfo.major])

	// enable editing and focus Input when edit button clicked
	const handleEditClick = () => {
		setIsEditingName(true);
		inputRef.current?.focus();
	}

	// disable editing when Input unfocuses
	const handleBlur = () => {
		setIsEditingName(false);
		setMajor(userBasicInfo.major)
	}

	// handle changes as user types into major input field
	const handleMajorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setMajor(event.target.value);
	};

	// handle when user presses "Enter"
	const handleEnter = async (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
		event.preventDefault();
		try {
			updateMajor(major);
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
			<Label htmlFor="majorInput" className="">
			Major
			</Label>
			<div className="relative">
			<Input
				id="majorInput"
				ref={inputRef}
				type="Name"
				className={`cursor-default ${!isEditingMajor ? "pointer-events-none" : ""}`}
				onBlur={handleBlur}
				readOnly={!isEditingMajor}
				value={major}
				data-testid="edit_major_input" 
				onChange={handleMajorChange}
				onKeyDown={handleEnter}
			/>
			<SquarePenIcon
				className="absolute stroke-1 scale-75 right-2 top-1/2 transform -translate-y-1/2 cursor-pointer"
				data-testid="edit_major_btn"
				onClick={handleEditClick}
			/>
			</div>
		</div>
	)
}