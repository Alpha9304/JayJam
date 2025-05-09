import { Button } from "../ui/button";
import { PencilIcon } from "lucide-react";

export const EditProfileButton = () => {
	return (
		<Button data-testid="edit_profpic_btn">
			<PencilIcon/>
		</Button>
	)
}