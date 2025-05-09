"use client";

import { usePageTitle } from "@/components/route-title";
import { useGetGroupMembers } from "@/hooks/group/use-get-group-member";
import { useParams } from "next/navigation";
import { MemberList } from "@/components/group/member-list";
import { PendingEventList } from "@/components/event/event-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateEventDialog } from "@/components/event/create-event-dialog";
import { useCreateEventDialog } from "@/store/use-dialog";

export default function ClassGroupPage() {
  usePageTitle("Class Group");
  const { groupId } = useParams();
  const { data: members, isLoading } = useGetGroupMembers(Number(groupId));
  const { openDialog } = useCreateEventDialog();

  return (
    <div className="container mx-auto py-6 space-y-6 p-2">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Class Group</h1>
      </div>
      
      <Tabs defaultValue="members">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="events">Pending Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value="members">
          <MemberList members={members || []} isLoading={isLoading} />
        </TabsContent>
        
        <TabsContent value="events">
          <div>
            <PendingEventList 
              onCreateEvent={() => openDialog()}
              groupId={Number(groupId)}
            />
            <CreateEventDialog />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
