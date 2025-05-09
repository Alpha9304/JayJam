import { protectedProcedure, router } from "../lib/trpc";
import { db } from "../db";
import { users, classes, classParticipants, groups } from "../db/schema";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";

export const groupRouter = router({
	getGroups: protectedProcedure // retrieve array of groups for a user
		.meta({ openapi: { method: 'GET', path: '/groups' } })
		.input(z.object({ showAll: z.boolean().optional() }).default({}))
		.output(z.array(z.object({
			groupId: z.number(),
			classCode: z.string(),
			className: z.string(),
			section: z.string(),
			students: z.number(),
			hidden: z.boolean(),
		})))
		.query(async ({ ctx, input }) => { 
			const userId = ctx.session?.userId!;
			const showAll = input.showAll ?? false; // Default to false

			// Retrieve classes the user is in, filtering out hidden ones unless `showAll` is true
			const classesIn = await db
				.select({
					classId: classes.id,
					classCode: classes.code,
					className: classes.name,
					section: classes.sectionId,
					groupId: classes.groupId,
					students: classes.numStudents,
					hidden: classParticipants.hidden,
				})
				.from(classParticipants)
				.innerJoin(classes, eq(classes.id, classParticipants.classId))
				.where(and(
					eq(classParticipants.userId, userId),
					showAll ? undefined : eq(classParticipants.hidden, false)
				));
				

			// Retrieve groups these classes belong to
			const groupsIn = await db
				.select({
					groupId: groups.id,
					groupStudents: groups.numStudents,
				  })
				.from(classes)
				.innerJoin(groups, eq(classes.groupId, groups.id))
				.where(inArray(groups.id, classesIn.map(c => c.groupId ?? 0)));

				const formattedGroups = classesIn
				.filter(c => showAll || !c.hidden)
				.map(c => ({
					groupId: c.groupId ?? 0,
					classId: c.classId,
					classCode: c.classCode,
					className: c.className,
					section: c.section,
					students: groupsIn.find(g => g.groupId === c.groupId)?.groupStudents ?? 0,
					hidden: c.hidden ?? false, 
				  }));

			// console.log(formattedGroups);

			return formattedGroups;
		}),

	setHideStatus: protectedProcedure // Toggle hide status for a class
		.meta({ openapi: { method: "PUT", path: "/groups/hide" } })
		.input(
		  z.object({
			groupId: z.number(),
			hidden: z.boolean(),
		  })
		)
		.output(z.object({ success: z.boolean() }))
		.mutation(async ({ input, ctx }) => {
			const userId = ctx.session?.userId!;

			// Find out what classes are under this group
			const classesInGroup = await db.select({
				classId: classes.id,
			}).from(classes).where(eq(classes.groupId, input.groupId));

			// console.log(classesInGroup);
			
			
			// Ensure the user is in the class before updating
		  const existingParticipant = await db
		  .select()
		  .from(classParticipants)
			  .where(and(
				  eq(classParticipants.userId, userId),
				  inArray(classParticipants.classId, classesInGroup.map(c => c.classId))
			  ))
		  .limit(1);
	
		if (existingParticipant.length === 0) {
		  return { success: false }; // The user is not in the class, prevent update
		}
	
		  // Update the hide status for the class participant
		  const updatedRows = await db
			.update(classParticipants)
			.set({ hidden: input.hidden })
			  .where(and(
				  eq(classParticipants.classId, existingParticipant[0].classId),
				  eq(classParticipants.userId, userId)
			  ))
			.returning({ hidden: classParticipants.hidden });

		  return { success: updatedRows.length > 0 };
		}),
	
	getGroupMembers: protectedProcedure // retrieve array of members in a group
		.meta({ openapi: { method: 'GET', path: '/groupmembers' } })
		.input(z.object({groupId: z.number()}))
		.output(z.array(z.object(
				{
					name: z.string().nullable(),
					email: z.string().nullable()
				})))
		.query(async ({input, ctx}) => { 
			const userId = ctx.session?.userId!;
			
			// check if user is in group
			const userInGroup = await db
				.select()
				.from(classParticipants)
				.innerJoin(classes, eq(classes.id, classParticipants.classId))
				.where(
					and(eq(classes.groupId, input.groupId),
						eq(classParticipants.userId, userId)
					))
				.limit(1);
				
			if (userInGroup.length === 0) {
				throw new Error("You do not have permission to view this group's members");
			}

			const members = await db
				.select({ name: users.name, email: users.email })
				.from(classParticipants)
				.innerJoin(classes, eq(classes.id, classParticipants.classId))
				.innerJoin(users, eq(users.id, classParticipants.userId))
				.where(eq(classes.groupId, input.groupId)); 

			return members
		})
});