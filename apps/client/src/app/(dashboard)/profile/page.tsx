"use client"

import { usePageTitle } from "@/components/route-title";
import { CircleUserRoundIcon } from "lucide-react";
import { EditProfileButton } from "@/components/profile/editProfileButton";
import { EditNameInput } from "@/components/profile/editNameInput";
import { EditEmailInput } from "@/components/profile/editEmailInput";
import { EditPronounsInput } from "@/components/profile/editPronounsInput";
import { EditMajorInput } from "@/components/profile/editMajorInput";
import { Input } from "@/components/ui/input";
import { profilePicStore } from "@/store/profile-picture-store";
import { useUpdateProfilePic } from "@/hooks/profile/use-update-profile-pic";
import { useGetProfilePic } from "@/hooks/profile/use-get-profile-pic";
import { useState, useEffect } from "react";


export default function ClassGroupsPage() {
  // custom title of this page
  usePageTitle("My Profile");
  const { profilePicture } = profilePicStore();
  const [pic, setPic] = useState<File | null>(useGetProfilePic() ?? null);
  const { updatePicture } = useUpdateProfilePic();

  useEffect(() => {
    if (profilePicture.picture) {
      setPic(profilePicture.picture)
    }
  }, [profilePicture.picture])
  
  const handleEditProfile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      updatePicture(file);
    }
  }

  return (
    <div className="flex justify-center w-full m-w-full mt-5 py-8 px-10 items-start">
      <div className="relative flex-[1] flex items-center justify-center">
        {pic ?
          <img
            src={URL.createObjectURL(pic)}
            alt="Profile Picture"
            className="w-[90%] h-[90%] aspect-[1/1] rounded-full object-cover"
          /> :
          <CircleUserRoundIcon className="w-[90%] stroke-[0.5]"/>
        }
        <div className="absolute bottom-[-20]">
          <EditProfileButton />
          <Input
            id="profile-image"
            type="file"
            accept="image/jpeg"
            className="absolute opacity-0 top-0 w-full h-full cursor-pointer"
            onChange={handleEditProfile}
          />
        </div>
        <div className="absolute bottom-[-40] text-gray-400 text-sm">Only .jpg/.jpeg Files</div>
      </div>
      <div className="flex-[2] px-5 space-y-6">
        <EditNameInput />
        <EditEmailInput />
        <EditPronounsInput />
        <EditMajorInput />
      </div>
      
    </div>
  );
}