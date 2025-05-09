import { z } from "zod";
import { allowedThemes } from "../db/schema";

export const themeSchema = z.object({
	newTheme: z
		.string()
		.min(1, {message: "Must provide a theme"})
		.max(15, { message: "Name must be less than or equal to 15 characters"})
		.refine((val) => allowedThemes.includes(val), {
			message: `Invalid theme, theme must be: ${allowedThemes}`
		})
})