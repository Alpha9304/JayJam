import { db } from "../db";
import { protectedProcedure, router } from "../lib/trpc";
import { eq } from "drizzle-orm";
import { parseCalendar } from "../scripts/calendar";
import { addClassToGroup } from "../scripts/group";
import { updateHashId } from "../scripts/user";
import { deleteClassParticipants, deleteStudentClasses, updateClassesWithClass } from "../scripts/class";
import { users, classParticipants} from "../db/schema";
import {z} from 'zod'; //uses zod for input validation
import { insertVEvents, deleteEventsByClassId } from "../scripts/event";

export const sisLinkRouter = router({
	saveSisLink: protectedProcedure // just save SIS link, no other data changes
		.meta({ openapi: { method: 'POST', path: '/savesislink' } })
		.input(z.object({url: z.string()}))
		.output(z.object({success: z.boolean(), message: z.string()}))
		.mutation(async ({input, ctx}) => { 
			// fetch SIS calendar data (assuming SP25 semester)
			const sisData = await parseCalendar(input.url, new Date(2025, 1, 21), new Date(2025, 5, 31));
			// console.log(sisData.schedule?.classEvents);
			if (sisData.userId === "") {
				throw new Error(`Invalid SIS url`);
			}
			const userId = ctx.session?.userId!;

			// users
			const user = await db
				.select()
				.from(users)
				.where(eq(users.id, userId))
				.get()
			if (!user) {
				throw new Error(`Cannot find user with id: ${userId}`);
			}

			await db
				.update(users)
				.set({
					sisLink: input.url
				})
				.where(eq(users.id, userId))

			return {
				success: true,
				message: "Successfully fetched SIS calendar data"
			}
		}),
	updateSisData: protectedProcedure // update database for users who have a SIS link
		.meta({ openapi: { method: 'POST', path: '/sisdata' } })
		.input(z.void())
		.output(z.object({success: z.boolean(), message: z.string()}))
		.mutation(async ({input, ctx}) => {
			// check that user with provided userId exists
			console.log("updateSisData triggered");
			const userId = ctx.session?.userId!;
			const user = await db
				.select()
				.from(users)
				.where(eq(users.id, userId))
				.get()
			if (!user) {
				throw new Error(`Cannot find user with id: ${userId}`);
			};

			const url = user.sisLink;
			if (url) {
				// fetch SIS calendar data (assuming SP25 semester)
				// TODO: semester parsing range should not be fixed
				const sisData = await parseCalendar(url, new Date(2025, 1, 21), new Date(2025, 5, 31));
				if (sisData.userId === "") {
					throw new Error(`Invalid SIS url`);
				}

				const parsedClasses = Object.fromEntries(
					Object.entries(sisData.schedule).map(([className, details]) => [
						className,
						{
							classId: details.classId,
							sectionNumber: details.sectionNumber,
							classEvents: details.classEvents
						}
					])
				)

				// update databases: users, classes, classParticipants, groups, events
				// users
				await updateHashId(userId, sisData.userId);

				// clear existing classes and classParticipants that are related to this user
				await deleteStudentClasses(userId); // reset student's class information
				await deleteClassParticipants(userId); // reset class participants
				for (const [className, details] of Object.entries(parsedClasses)) {
					const classId = await updateClassesWithClass(className, details);

					// classParticipants
					await db
						.insert(classParticipants)
						.values({
							userId: user.id,
							classId: classId
						})

					// groups
					await addClassToGroup(className, classId);

					// events - delete existing class events before inserting new ones
					await deleteEventsByClassId(details.classId, userId);
					
					// insert all class events
					const vevents = details.classEvents.filter(event => event.type === "VEVENT");
					await insertVEvents(vevents, userId);
				}
			} else {
				throw new Error(`User ${userId} does not have a sis link`);
			}

			return {
				success: true,
				message: "Successfully updated user data from SIS calendar"
			}
		}),
	// updateSisCalendar:
})