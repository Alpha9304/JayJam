"use client"

import { usePageTitle } from "@/components/route-title";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { useEffect } from "react";
import { useMutationSettings } from "@/hooks/setting/use-mutation-settings";
import { useTheme } from "@/store/context/ThemeContext";

export default function ClassGroupsPage() {
  usePageTitle("Settings");
  const router = useRouter();
  const { theme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const {updateTheme} = useMutationSettings();

    useEffect(() => {
      if (theme) {
        setSelectedTheme(theme)
      }
    }, [theme])
  
  const getButtonClass = (theme: string) => {
    return theme === selectedTheme
      ? "border-4 border-green-500"
      : "border-2 border-gray-300";
  };

  const handleChangeTheme = async () => {
    try {
      if (selectedTheme) {
        await updateTheme(selectedTheme);
      }
    } catch {
    }
  }

  return (
    <div className="w-full m-w-full mt-5 py-8 px-10 space-y-8">
      <div id="profileSettings" className="flex-col px-5 space-y-3">
        <div>
          <div className="text-xl font-semibold">Profile</div>
          <hr/>
        </div>
        <Button onClick={() => router.push("/profile")}>
          Edit Profile
        </Button>
      </div>
      <div id="themeSettings" className="flex-col px-5 space-y-3">
        <div>
          <div className="text-xl font-semibold">Theme</div>
          <hr/>
        </div>
        <Card className="p-4 space-y-3">
          <div>Choose a theme:</div>
          <div className="grid grid-cols-3 w-full space-x-4">
            <Button
              className={`h-20 bg-white text-black hover:bg-gray-100 ${getButtonClass("light")}`}
              onClick={() => setSelectedTheme("light")}
            >
              Light
            </Button>
            <Button
              className={`h-20 bg-black text-white ${getButtonClass("dark")}`}
              onClick={() => setSelectedTheme("dark")}
            >
              Dark
            </Button>   
          </div>
          <div id="dark" className="flex justify-between items-center mt-4">
            <div></div>
            <Button
              className="hover:bg-green-700 bg-green-600"
              onClick={handleChangeTheme}
            >
                Apply
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}