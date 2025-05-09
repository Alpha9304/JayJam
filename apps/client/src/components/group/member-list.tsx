"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdvancedList } from "@/components/advanced-list";

interface GroupMember {
  name: string | null;
  email: string | null;
}

interface MemberListProps {
  members: GroupMember[];
  isLoading?: boolean;
}

export function MemberList({ members, isLoading = false }: MemberListProps) {
  const renderMember = (member: GroupMember) => (
    <div className="flex items-center space-x-4 rounded-md border p-4">
      <Avatar>
        <AvatarImage src="" />
        <AvatarFallback>
          {member.name
            ? member.name
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
          {member.name || "Unnamed User"}
        </p>
        <p className="text-sm text-muted-foreground">
          {member.email || "No email provided"}
        </p>
      </div>
    </div>
  );

  const filterMember = (member: GroupMember, searchQuery: string) => {
    return (
      (member.name?.toLowerCase().includes(searchQuery) || false) ||
      (member.email?.toLowerCase().includes(searchQuery) || false)
    );
  };

  return (
    <AdvancedList
      items={members}
      title=""
      isLoading={isLoading}
      searchPlaceholder="Search members..."
      renderItem={renderMember}
      filterItem={filterMember}
    />
  );
}