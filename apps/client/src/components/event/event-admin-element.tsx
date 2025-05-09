import {DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import { DialogHeader } from "../ui/dialog";
import { useState } from "react";
import { AdvancedList } from "../advanced-list";
import { useGetPendingParticipants } from "@/hooks/event/use-get-pending-participants";
import { useGetFinalizedParticipants } from "@/hooks/event/use-get-finalized-participants";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import { Button } from "../ui/button";
import { useUserInfo } from "@/hooks/auth/use-user-info";
import { useRemoveFromPendingEvent } from "@/hooks/event/use-remove-from-pending-event";
import { useMuteFinalizedParticipant } from "@/hooks/event/use-mute-finalized-participant";
import { useMutePendingParticipant } from "@/hooks/event/use-mute-pending-participant";
import { useGetMutedFinalizedParticipants } from "@/hooks/event/use-get-muted-finalized-participants";
import { useGetMutedPendingParticipants } from "@/hooks/event/use-get-muted-pending-participants";


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
    const { userBasicInfo } = useUserInfo();
    const { removeEvent } = useRemoveFromPendingEvent();
    const { muteFinalizedParticipant } = useMuteFinalizedParticipant();
    const { mutePendingParticipant } = useMutePendingParticipant();
    const {mutedUsers: mutedFinalizedUsers} = useGetMutedFinalizedParticipants(eventId);
    const {mutedUsers: mutedPendingUsers} = useGetMutedPendingParticipants(eventId);
    

    const filterUser = (user: User, query: string) => {
        return (
            user.name.toLowerCase().includes(query.toLowerCase()));
      };

    const renderUser = (user: User, pending: boolean) => {
      const isCreator = user.id == userBasicInfo?.id;
      const isMutedPending = mutedPendingUsers!.filter((participant) => participant.userId === user.id).length > 0;
      const isMutedFinalized = mutedFinalizedUsers!.filter((participant) => participant.userId === user.id).length > 0;

        return(
          <div className="flex items-center space-x-4 rounded-md border p-4">
          <Avatar>
            <AvatarImage src="" />
            <AvatarFallback>
              {user.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .substring(0, 2)
                : "??"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.name || "Unnamed User"}
            </p>
            <p className="text-sm text-muted-foreground">
              {user.email || "No email provided"}
            </p>
          </div>
          {!isCreator && pending &&(
                <>
                  <Button
                        onClick={() => {removeEvent(eventId, user.id)}}
                      >
                        Remove
                  </Button>
                  <Button
                        onClick={() => {mutePendingParticipant(eventId, user.id)}}
                      >
                         {isMutedPending ? "Unmute" : "Mute"}
                  </Button>
                </>
              )}
          {!isCreator && !pending &&(
                <>
                  <Button
                        onClick={() => muteFinalizedParticipant(eventId, user.id)}
                      >
                        {isMutedFinalized ? "Unmute" : "Mute"}
                  </Button>
                </>
              )}

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
            renderItem={(user) => renderUser(user, true)}
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
            renderItem={(user) => renderUser(user, false)}
            filterItem={filterUser}
          />
        }
    </div>
    )
}