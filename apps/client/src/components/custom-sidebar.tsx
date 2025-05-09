import { Settings, LogOutIcon, CircleUserRoundIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSisLinkStore } from "@/store/use-sis-link-store";
import Link from "next/link";
import { useLogout } from "@/hooks/auth/use-logout";
import { useGetName } from "@/hooks/profile/use-get-name";
import { useGetEmail } from "@/hooks/profile/use-get-email";
import { useSaveSisLink } from "@/hooks/event/use-save-sis-link";
import { useRouter } from "next/navigation";
import { useUserBasicInfoStore } from "@/store/use-user-basic-info-store";
import { useEffect } from "react";
import { useQuerySettings } from "@/hooks/setting/use-query-settings";
import { useTheme } from "@/store/context/ThemeContext";
import { useUpdateEventsFromSis } from "@/hooks/event/use-update-events-from-sis";
import { useGetProfilePic } from "@/hooks/profile/use-get-profile-pic";
import { toast } from "sonner";

export default function CustomSidebar() {
  const { isDialogOpen, isisLink, setIsDialogOpen, setIsisLink } = useSisLinkStore();
  const { saveSisLink } = useSaveSisLink({ url: isisLink });
  const { handleLogout: mutateLogout } = useLogout();
  useGetName();
  useGetEmail();
  const {updateSisEvents } = useUpdateEventsFromSis();
  const { userBasicInfo } = useUserBasicInfoStore();
  const { setTheme } = useTheme();
  const { data } = useQuerySettings();
  const router = useRouter();

  useEffect(() => {
    if (data?.theme) {
      setTheme(data.theme);
    }
  }, [data?.theme, setTheme]);


  // Handle the submitted link
  const handleLinkSubmit = async () => {
    console.log("SIS link submitted:", isisLink);
    setIsDialogOpen(false);

    // Wait for saveSisLink to complete
    let updateSuccess = await saveSisLink();
    if (!updateSuccess) {
      toast.error("First attempt to save sis link failed. Retrying...")
      updateSuccess = await saveSisLink(); // try again if it does not work
    }

    if (!updateSuccess) {
      toast.error("Failed to save SIS link second time. Please try again later...")
    }

    // Add a small delay to ensure the database has been updated
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Wait for the SIS data update to complete
    const result = await updateSisEvents();

    if (!result.success) { // try one more time if failed
      await updateSisEvents()
    }
    // TODO: elimiate the stupid refresh of page
    window.location.href = "/calendar";
  };

  const handleLogout = () => {
    mutateLogout();
    router.push("/"); // Return to landing
  };

  const profilePic = useGetProfilePic();

  return (
    <Sidebar>
      <SidebarHeader className="flex justify-start px-4">
        <div className="flex items-center gap-3">
          <Avatar
            className="cursor-pointer"
            onClick={() => router.push("/profile")}
          >
            <AvatarImage src={profilePic ? URL.createObjectURL(profilePic) : undefined} />
            <AvatarFallback>
              <CircleUserRoundIcon />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="text-md font-medium">
              {userBasicInfo.name ? userBasicInfo.name : ""}
            </div>
            <div className="text-xs text-muted-foreground">
              {userBasicInfo.email ? userBasicInfo.email : ""}
            </div>
          </div>
        </div>
      </SidebarHeader>
      <Separator className="gap-6 w-11/12 mx-auto" />

      <ScrollArea className="h-full">
        <SidebarContent>
          <div className="container h-full mx-auto px-2 mt-4">
            <Link href="/class-groups">
              <Button
                variant="outline"
                className="w-full justify-start mb-2 font-bold"
              >
                My Classes
              </Button>
            </Link>
            <Link href="/study-events">
              <Button
                variant="outline"
                className="w-full justify-start mb-2 font-bold"
                data-testid = "my_events_btn"
              >
                My Study Events
              </Button>
            </Link>
            <Link href="/calendar">
              <Button
                variant="outline"
                className="w-full justify-start mb-2 font-bold"
              >
                My Calendar
              </Button>
            </Link>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start mb-2 font-bold"
                >
                  SIS Link
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add SIS Calendar Link</DialogTitle>
                  <DialogDescription>
                    Enter the SIS Calendar link to import your schedule.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Input
                    id="isisLink"
                    placeholder="Paste your SIS link here"
                    value={isisLink}
                    onChange={(e) => setIsisLink(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      router.refresh();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleLinkSubmit}>Submit</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </SidebarContent>
      </ScrollArea>

      <Separator className="gap-6 w-11/12 mx-auto" />

      <SidebarFooter className="flex gap-2">
        <div className="flex flex-1 gap-2">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => router.push("/settings")}
            disabled={false}
          >
            <Settings className="size-4" />
          </Button>
          <Separator orientation="vertical" className="h-full" />
          <Button
            variant="ghost"
            className="flex-1"
            onClick={handleLogout}
            disabled={false}
            data-testid="logout_btn"
          >
            <LogOutIcon className="size-4" />
          </Button>
          <Separator orientation="vertical" className="h-full" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
