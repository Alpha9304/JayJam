import { toast } from "sonner";
import { trpc } from "../../trpc/client";

export const useBanFinalizedParticipant = () => {
    const { mutateAsync: banParticipantMutation } = trpc.events.banFinalizedParticipant.useMutation({
        onSuccess: () => {
            toast.success("Successfully banned user.");
        },
        onError: (error) => {
            console.error("Failed to ban user:", error);
            toast.error("Failed to ban user");
        },
    });

    const banFinalizedParticipant = async (eventId: number, userId: number) => {
        await banParticipantMutation({
            eventId,
            userId
        });
    };

    return { banFinalizedParticipant };
}; 