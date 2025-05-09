"use client";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";

export function useVerifyCode() {
  const mutation = trpc.auth.verifyVerificationCode.useMutation();

  const verify = async (code: string) => {
    try {
      // Send only 'code'
      const response = await mutation.mutateAsync({ code });

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
