import { db } from "../db";
import { settings } from "../db/schema";
import { eq } from "drizzle-orm";

export const getTheme = async (userId: number) => {
	const settingTheme = await db
		.select({theme: settings.theme})
		.from(settings)
		.where(eq(settings.userId, userId))
		.get()
		
	return settingTheme?.theme ?? ""
}

export const updateTheme = async (userId: number, newTheme: string) => {
	await db
		.update(settings)
		.set({
			theme: newTheme,
			updatedAt: new Date()
		})
		.where(eq(settings.userId, userId))
}