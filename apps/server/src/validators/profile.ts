import { z } from "zod";

// regex for a single name or first and last name: both must be capitalized
const namePattern = /^[A-Z][a-z]+(?:-[A-Z][a-z]+)*(?: [A-Z][a-z]+(?:-[A-Z][a-z]+)*)?$/;

export const nameSchema = z.object({
	newName: z
		.string()
		.min(1, {message: "Must provide a name"})
		.max(50, { message: "Name must be less than or equal to 50 characters"})
		.regex(namePattern, { message: "Name must be capitalized and can include one or two words (first and last name)" })
})

export const majorSchema = z.object({
	newMajor: z
		.string()
		.max(40, { message: "Major must be less than or equal to 40 characters"})
		.transform((value) => {
			return value
				.split(" ")
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
				.join(" ")
		})
})

export const pronounsSchema = z.object({
	newPronouns: z
		.string()
		.max(20, { message: "Pronouns must be less than or equal to 20 characters"})
})