import { trpc } from "@/trpc/client"
import { useEffect } from "react"
import { toast } from "sonner";

export const useGetGroups = (showAll = false) => {
    const query = trpc.group.getGroups.useQuery({ showAll });
  
    useEffect(() => {
      if (query.isSuccess) {
        toast.success("Groups fetched successfully");
      }
      if (query.isError) {
        toast.error(`Failed to fetch groups: ${query.error.message}`);
      }
    }, [query.isSuccess, query.isError, query.error]);
  
    return query;
  };
  
  export const useToggleHideStatus = () => {
    const utils = trpc.useUtils();
    const mutation = trpc.group.setHideStatus.useMutation({
      onSuccess: () => {
        utils.group.getGroups.invalidate(); // Refresh the group list after updating
        toast.success("Class visibility updated.");
      },
      onError: (error) => {
        toast.error(`Failed to update hide status: ${error.message}`);
      },
    });
  
    return mutation;
  };