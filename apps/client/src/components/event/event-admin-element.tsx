import {DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import { DialogHeader } from "../ui/dialog";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@radix-ui/react-tabs";
import { AdvancedList } from "../advanced-list";
import { useGetPendingParticipants } from "@/hooks/event/use-get-pending-participants";
import { useGetFinalizedParticipants } from "@/hooks/event/use-get-finalized-participants";

interface AdminProps {
    eventId: number;
    title: string;
    pending: boolean;
  }

interface User {
    name: string;
    id: number;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    password: string;
    hashId: string | null;
    sisLink: string | null;
    verified: boolean;
    profilePic?: Blob;
    pronouns: string | null;
    major: string | null;
    settingsId: number | null;
}



export function EventAdminElement({
    eventId,
    title,
    pending,
}: AdminProps) {
    const { users: pendingUsers, isLoading: pendingLoading } = useGetPendingParticipants(eventId);
    const { users: finalizedUsers, isLoading: finalizedLoading } = useGetFinalizedParticipants(eventId);
    const [filter, setfilter] = useState<"all" | "banned">("all");

    const filterUser = (user: User, query: string) => {
        return (
            user.name.toLowerCase().includes(query.toLowerCase()));
      };

    const renderUser = (user: User) => {
        return(
            <div>
                {"User: " + user.name}
            </div>
        )
    }


    return (
    <div className="space-y-6 px-6 pb-4">
        <DialogHeader className="space-y-2 mt-4">
            <DialogTitle className="text-2xl font-bold">Chat</DialogTitle>
            <DialogDescription className="text-gray-500">
                {'Event: ' + title + ", Id: " + eventId}
            </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="users">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">Members</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
            { pending && 
          <AdvancedList
            items={pendingUsers ?? []}
            title={
              <select
                className="w-full p-2 border rounded-md text-sm"
                value={filter}
                onChange={(e) =>
                  setfilter(e.target.value as "all" | "banned")
                }
              >
                <option value="all">All Users</option>
                <option value="banned">Banned Users</option>
              </select>
            }
            isLoading={pendingLoading}
            searchPlaceholder="Search users..."
            renderItem={renderUser}
            filterItem={filterUser}
          />
        }

        { !pending &&
            <AdvancedList
            items={finalizedUsers ?? []}
            title={
              <select
                className="w-full p-2 border rounded-md text-sm"
                value={filter}
                onChange={(e) =>
                  setfilter(e.target.value as "all" | "banned")
                }
              >
                <option value="all">All Users</option>
                <option value="banned">Banned Users</option>
              </select>
            }
            isLoading={finalizedLoading}
            searchPlaceholder="Search users..."
            renderItem={renderUser}
            filterItem={filterUser}
          />
        }
        </TabsContent>
        </Tabs>
    </div>
    )
}