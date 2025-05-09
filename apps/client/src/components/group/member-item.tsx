import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

interface MemberItemProps {
  name: string | null;
  email: string | null;
}

export function MemberItem({ name, email }: MemberItemProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-4 p-4">
        <Avatar>
          <AvatarImage src="" />
          <AvatarFallback>
            {name
              ? name
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
            {name || "Unnamed User"}
          </p>
          <p className="text-sm text-muted-foreground">
            {email || "No email provided"}
          </p>
        </div>
      </div>
    </Card>
  );
}