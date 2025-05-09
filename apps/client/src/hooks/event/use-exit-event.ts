import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useUserInfo } from "@/hooks/auth/use-user-info";

export const useExitEvent = () => {
    const utils = trpc.useUtils();
    const { userBasicInfo } = useUserInfo();
    const { mutateAsync: exitEventMutation } = trpc.events.removePendingParticipant.useMutation({
        onSuccess: () => {
            toast.success("Successfully left event");
            utils.events.getPendingEvents.invalidate();
        },
        onError: (error) => {
            console.error("Failed to exit event:", error);
            toast.error("Failed to leave event");
        },
    });

    const exitEvent = async (eventId: number) => {
        if (!userBasicInfo?.id) {
            toast.error("You must be logged in to leave an event");
            return;
        }

        await exitEventMutation({
            eventId,
            userId: userBasicInfo.id
        });
    };

    return { exitEvent };
};
