'use client';

import { trpc } from "@/trpc/client";
import { TRPCClientError } from "@trpc/client";
import { toast } from "sonner";

type loginProps = {
  email: string,
  password: string
}

export function useLogin() {
  const mutation = trpc.auth.login.useMutation({
    retry: false,
    gcTime: 0
  });

  const handleLogin = async ({ email, password }: loginProps) => {
    try {
      // use mutateAsync
      const response = await mutation.mutateAsync({ email, password });
      console.log("Login response", response);

      if (response.success) {
        toast.success(response.message || "Successfully logged in!");
        return { success: true, message: response.message };
      }
      else {
        toast.error(response.message || "Login failed.");
        return { success: false, message: response.message || "Login failed." };
      }
    } catch (error: unknown) {
      let message: string = "A login error occurred.";

      // Handle specific backend errors
      if (error instanceof TRPCClientError) {
        if (error.data?.code === "UNAUTHORIZED") {
          message += ` ${error.message}`
        }
      }

      console.error("Login Error:", error);
      toast.error(`An error occurred during login: ${error}}`);
      return { success: false, message };
    }
  }

  return { mutation, handleLogin };
}
