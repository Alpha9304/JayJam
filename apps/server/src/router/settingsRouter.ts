import { protectedProcedure, publicProcedure, router } from "../lib/trpc";
import { z } from "zod";
import { getTheme, updateTheme } from "../scripts/setting";
import { themeSchema } from "../validators/setting";

export const settingsRouter = router({
	getTheme: protectedProcedure
		.meta({ openapi: {method: 'GET', path: '/getTheme'}})
		.input(z.void())
		.output(z.object({theme: z.string()}))
		.query(async ({ctx}) => {
			const userId = ctx.session?.userId!;
			const ret = await getTheme(userId);
			return ret ? {theme: ret} : {theme: ""};
		}),

	updateTheme: protectedProcedure
		.meta({ openapi: {method: 'PUT', path: '/updateTheme'}})
		.input(themeSchema)
		.output(z.object({success: z.boolean(), message: z.string(), theme: z.string()}))
		.mutation(async ({ctx, input}) => {
			try {
				updateTheme(ctx.session?.userId!, input.newTheme);
				return { success: true, message: "Updated theme", theme: input.newTheme };
			} catch (error) {
				return { success: false, message: "Could not update theme", theme: "" }
			}
		}),  
})