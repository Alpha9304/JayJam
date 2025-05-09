"use client";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";

export function useVerifyReset() {
  const mutation = trpc.auth.verifyResetCode.useMutation();

  const verify = async (code: string, email: string) => {
    try {
      // Send only 'code'
      const response = await mutation.mutateAsync({ code, email });

      if (response.success) {
        toast.success("Email successfully verified!");
        return true;
      } else {
        toast.error("Invalid verification code.");
        return false;
      }
    } catch (error) {
      toast.error("Verification failed.");
      console.error("Verify Code Error:", error);
      return false;
    }
  };

  return { verify, isPending: mutation.isPending };
}
