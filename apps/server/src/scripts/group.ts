import { groups, classes } from "../db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

/*
	addClassToGroup
	Creates group for provided class if it does not exist, or enrolls the class into the existing group.

	Params:
	- className: name of class requesting to be part of a group
	- classId: id of class requesting to be part of a group

	Returns: Nothing
*/
export const addClassToGroup = async (className : string, classId: number) => {
	const group = await db
		.select()
		.from(groups)
		.where(eq(groups.title, className))
		.get()


	const existingClass = await db
		.select()
		.from(classes)
		.where(eq(classes.id, classId))
		.get()


	// if group does not exist, create new group and add class
	if (!group) {
		if (existingClass) {
			const addedGroup = await db
				.insert(groups)
				.values({
					title: className,
					numStudents: existingClass.numStudents
				})
				.returning()
				.get()


			await db
				.update(classes)
				.set({
					groupId: addedGroup.id
				})
				.where(eq(classes.id, classId))
		}
	} else { // else, just assign the class to the existing group
		const newNumStudents = group.numStudents + 1;
		await db
			.update(groups)
			.set({
				numStudents: newNumStudents
			})
			.where(eq(groups.id, group.id))
		await db
			.update(classes)
			.set({
				groupId: group.id
			})
			.where(eq(classes.id, classId))
	}
}