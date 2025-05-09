"use client";
import { useState, useEffect } from "react";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { TRPCClientError } from "@trpc/client";

export function useSendResetCode() {
  const mutation = trpc.auth.sendResetCode.useMutation();
  const [timer, setTimer] = useState(0);

  const sendCode = async (email: string) => {
    if (timer > 0) {
      toast.error(`Please wait ${timer}s before resending.`);
      return;
    }

    try {
      // Send email as 'placeholder'
      const response = await mutation.mutateAsync({ email: email });

      if (response.success) {
        toast.success(`Verification email sent to ${email}`);
        setTimer(30); // Start cooldown
      } else {
        toast.error("Something went wrong");
      }
    } catch (error) {
      if(error instanceof TRPCClientError) {
        toast.error(`Failed to send verification email: ${error.message}`);
      }
    }
  };

  // Timer Countdown Handling
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer]);

  return { sendCode, isPending: mutation.isPending, timer };
}
