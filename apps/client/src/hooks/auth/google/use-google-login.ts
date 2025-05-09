"use client";

import { trpc } from "@/trpc/client";
import { TRPCClientError } from "@trpc/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function useGoogleLogin() {
  const mutation = trpc.google.url.useMutation();
  const router = useRouter();

  const [googleError, setGoogleError] = useState(<Error | null>(null));

  const routeToGoogle = async (): Promise<void> => {
    console.log("node_env: ", process.env.NODE_ENV)
    try {
      const response = await mutation.mutateAsync();
      console.log("Response from google/url", response);

      // FIX: Need to test if this doesn't catch errors that would be thrown by server
      // Might need to pass along a separate success boolean
      console.log("status", mutation.status)

      if (mutation.isError) {
        toast.error("Please try again")
        throw mutation.error;
      }

      // Redirect to google and let callback handle the rest
      toast.success("Redirecting to Google...");
      const url = response.url;
      console.log("after login:", url);
      router.push(url);

    } catch (error: unknown) {
      console.error(error)
      if (error instanceof TRPCClientError) {
        setGoogleError(new Error(error.message))
      }
      setGoogleError(new Error(`Unable to login with Google ${error}`))
      toast.error("Please try again")
    }
  }

  return { routeToGoogle, googleError };
}
