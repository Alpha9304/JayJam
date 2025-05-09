import { z } from "zod";
import { nameSchema } from "./profile";

const verifyHopkinsEmail = (email: string): boolean => {
  return /^\S+@(j|J)(h.edu|hu.edu)$/.test(email); // Regex: Match any non-whitespace characters followed by @jh.edu or @jhu.edu at the end.
}

export const emailSchema = z
  .string()
  .email({ message: "Invalid email format."})
  .min(1) // Required
  .refine((val) => verifyHopkinsEmail(val), 
    {message: "Email needs to end with @jh.edu or @jhu.edu"}
  )

/*
Passwords need >= 8 and <= 20 characters,
one uppercase, one lowercase, one number,
and one special character
*/
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(20, "Password must be less than 20 characters or less.")
  .refine((val) => /[a-z]/.test(val), { message: "Password needs to contain at least one lowercase letter." }) 
  .refine((val) => /[A-Z]/.test(val), { message: "Password needs to contain at least one uppercase letter." }) 
  .refine((val) => /[0-9]/.test(val), { message: "Password needs to contain at least one number." }) 
  .refine((val) => /[!@#$%^&*.]/.test(val), { message: "Password needs to contain at least one special character out of !@#$%^&*." });

export const confirmPasswordSchema = z.object({
  password: passwordSchema,
  confirm: passwordSchema,
}).refine((data) => data.password === data.confirm, {
  message: "Passwords don't match",
  path: ["confirm"] // this says that confirm field failed validation
}).transform(data => data.password); // only need to return one final password

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirm: passwordSchema,
  email: z.string(),
}).refine((data) => data.password === data.confirm, {
  message: "Passwords don't match",
  path: ["confirm"] // this says that confirm field failed validation
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

export const registerSchema = z.object({
  name: nameSchema.shape.newName,
  email: emailSchema,
  passwords: confirmPasswordSchema // passwords.password and passwords.confirm for both fields
});

export type emailSchema = z.infer<typeof emailSchema>;
export type passwordSchema = z.infer<typeof passwordSchema>;
export type resetPasswordSchema = z.infer<typeof confirmPasswordSchema>;

export type loginSchema = z.infer<typeof loginSchema>;
export type registerSchema = z.infer<typeof registerSchema>;