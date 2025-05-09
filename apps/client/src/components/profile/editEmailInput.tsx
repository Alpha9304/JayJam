import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserBasicInfoStore } from "@/store/use-user-basic-info-store";

export const EditEmailInput = () => {
  const {userBasicInfo} = useUserBasicInfoStore();
  
	return (
	<div>
        <Label htmlFor="emailInput" className="disabled">
          JHU Email
        </Label>
        <Input
          id="emailInput"
          type="Email"
          className="cursor-default pointer-events-none"
          value={userBasicInfo.email}
          readOnly/>
    </div>
	)
}