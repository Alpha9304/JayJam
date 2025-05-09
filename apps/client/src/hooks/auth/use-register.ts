"use client";

import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { resetPasswordSchema } from "../../../../server/src/validators/auth";
import { TRPCClientError } from "@trpc/client";
import { AppRouter } from "../../../../server/src/router/app";

type registerProps = {
    name: string,
    email: string,
    password: resetPasswordSchema,
    confirm: resetPasswordSchema
}

export function useRegister() {
    const mutation = trpc.auth.register.useMutation({
        retry: false,
        gcTime: 0     
    });

    const isTRPCClientError = (error: unknown): error is TRPCClientError<AppRouter> => {
        return error instanceof TRPCClientError;
    };

    const handleRegister = async ( {name, email, password, confirm}: registerProps ) => {
        try {
            // Use `mutateAsync` to wait for the response
            const response = await mutation.mutateAsync({
                name,
                email, 
                passwords: { password, confirm } 
            });

            if (response.success) { 
                toast.success(response.message || "Registration successful!");
                return { success: true, message: response.message };
            } else {
                toast.error(response.message || "Registration failed.");
                return { success: false, message: response.message || "Registration failed." };
            }
        } catch (error: unknown) {
            if (isTRPCClientError(error)) {
                console.error("Registration Error:", error);
                toastMutationError(error);
                return { success: false, message: error.message || "An error occurred." };
            }

            console.error("Registration Error:", error);
            toast.error(`An error occurred during registration`);
            return { success: false, message: "An error occurred." };
        }
    }

    const toastMutationError = (error: { message: string }) => {

        let message = "Error: "

        if (error.message.includes("needs to end")) {
            message = message.concat("\nEmail must end with jh.edu or jhu.edu.");
        }

        if (error.message.includes("too_small") || error.message.includes("too_big")) {
            message = message.concat('\nPassword must be between 8 and 20 characters long.');
        }

        if (error.message.includes("uppercase")) {
            message = message.concat('\nPassword must contain at least one uppercase letter.');
        }

        if (error.message.includes("number")) {
            message = message.concat('\nPassword must contain at least one number.');
        }

        if (error.message.includes("special")) {
            message = message.concat('\nPassword must contain at least one special character out of !@#$%^&*.');
        }

        if (error.message.includes("match")) {
            message = message.concat('\nPasswords must match.');
        }
        //toast.error(message);
        toast.error(message, {
            style: {whiteSpace: 'pre-wrap'},
            richColors: true
        })
    }

    return { mutation, handleRegister };
}
