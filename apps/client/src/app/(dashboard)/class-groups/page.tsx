"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePageTitle } from "@/components/route-title";
import { Separator } from "@/components/ui/separator";
import {
  useGetGroups,
  useToggleHideStatus,
} from "@/hooks/group/use-get-groups";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function ClassGroupsPage() {
  usePageTitle("My Class Groups");
  const router = useRouter();

  // State to toggle hidden class visibility
  const [showAll, setShowAll] = useState(false);
  const {
    data: classGroups,
    refetch,
    isLoading,
    isError,
  } = useGetGroups(showAll);
  const toggleHideMutation = useToggleHideStatus();

  const DEBUG = false; // change this to true if you want to debug
  function setDebugMode(debug: boolean) {
    if (debug) {
      document.body.classList.add("debug");
    } else {
      document.body.classList.remove("debug");
    }
  }

  // Ensure local state updates when classGroups change
  useEffect(() => {
    refetch();
    setDebugMode(DEBUG);
  }, []); // Ensure fresh data is always loaded on component mount

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error fetching classes.</p>;
  if (!classGroups) return null;

  // Toggle hide state and refetch after mutation
  const toggleHide = (classId: number, currentHidden: boolean) => {
    toggleHideMutation.mutate(
      { groupId: classId, hidden: !currentHidden },
      {
        onSuccess: () => refetch(), // Ensure backend updates are fetched
        onError: (error) => console.error("Error toggling hide status:", error),
      }
    );
  };

  return (
    <div className="container mx-auto my-auto">
      <div className="flex mb-6 mx-4 items-center justify-between">
        <h1 className="text-3xl font-bold">
          {`${classGroups.length} ${classGroups.length > 1 ? "Classes" : "Class"}`}
        </h1>
        <Badge
          variant="secondary"
          className="text-base px-4 py-2 cursor-pointer hover:bg-secondary/90"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "Hide Classes" : "Show All Classes"}
        </Badge>
      </div>

      <div className="mx-4 my-4">
        <Separator />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2 mx-auto">
        {classGroups.map((classGroup) => (
          <Card
            key={classGroup.groupId}
            className={`hover:shadow-lg transition-shadow ${classGroup.hidden ? "opacity-50" : ""}`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start ">
                <Badge variant="outline" className="mb-2 text-sm">
                  {classGroup.classCode} Section {classGroup.section}
                </Badge>
                <Badge variant="default" className="text-sm">
                  {classGroup.students} Students
                </Badge>
              </div>
              <CardTitle className="text-xl">{classGroup.className}</CardTitle>
              <CardDescription>
                Join discussions and study sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                <Badge
                  variant="secondary"
                  className="text-base px-4 py-2 cursor-pointer"
                  onClick={() =>
                    toggleHide(classGroup.groupId, classGroup.hidden)
                  }
                >
                  {classGroup.hidden ? "Unhide" : "Hide"}
                </Badge>
                <Badge
                  variant="secondary"
                  className="text-base px-4 py-2 cursor-pointer hover:bg-secondary/90"
                  onClick={() =>
                    router.push(`/class-groups/${classGroup.groupId}`)
                  }
                >
                  View Details
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
