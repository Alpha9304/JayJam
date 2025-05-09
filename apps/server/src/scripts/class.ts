import { classes, classParticipants, groups } from "../db/schema";
import { db } from "../db";
import { and, eq, sql } from "drizzle-orm";
import { VEvent } from "node-ical";

interface classDetails {
	classId: string,
	sectionNumber: string,
	classEvents: VEvent[]
}

/*
	deleteStudentFromClass
	HELPER FUNCTION
	Delete student from a class with "classId", making sure "numStudents" in "classes" and "groups" are updated.

	Params:
	- userId: id of the student
	- classId: id of the class
	- tObj: transaction object that ensures consistent database changes

	Returns: Boolean
	- True: successfully deleted student from class
	- False: failed to delete student from class
*/
export const deleteStudentFromClass = async (userId: number, classId: number, tObj: any) => {
	// remove student from classParticipants
	await tObj
		.delete(classParticipants)
		.where(and(eq(classParticipants.classId, classId), eq(classParticipants.userId, userId)));

	// decrement "numStudents" in entry in classes table
	await tObj
		.update(classes)
		.set({ numStudents: sql`MAX(${classes.numStudents} - 1, 0)` })
		.where(eq(classes.id, classId))
	
	// decrement "numStudents" in entry in groups table
	const classRowWithGroupId = await tObj
		.select({ groupId: classes.groupId })
		.from(classes)
		.where(eq(classes.id, classId))
		.get()
	if (classRowWithGroupId?.groupId) {
		const totalStudents = await tObj
			.select({ count: sql<number>`SUM(${classes.numStudents})` })
			.from(classes)
			.where(eq(classes.groupId, classRowWithGroupId.groupId))
			.get()

		const totalStudentsCount = totalStudents?.count || 0;
		await tObj
			.update(groups)
			.set({
				numStudents: totalStudentsCount
			})
			.where(eq(groups.id, classRowWithGroupId.groupId))
	}
}

/*
	deleteStudentClasses
	Delete student from all classes they were previously enrolled in.

	Params:
	- userId: id of the student

	Returns: Nothing
*/
export const deleteStudentClasses = async (userId: number) => {
	// fetch all classes the student is enrolled in
    const enrolledClasses = await db
        .select({ classId: classParticipants.classId })
        .from(classParticipants)
        .where(eq(classParticipants.userId, userId));

    if (enrolledClasses.length === 0) return; // no classes to delete

    // extract class IDs
    const classIds = enrolledClasses.map(c => c.classId);

	await db.transaction(async (tObj) => {
		// delete student from class_participants
		await tObj
			.delete(classParticipants)
			.where(eq(classParticipants.userId, userId));

		// delete student from class
		for (const classId of classIds) {
			await deleteStudentFromClass(userId, classId, tObj)
		}
	})
}

/*
	deleteClassParticipants
	Delete all class participants for a given class.

	Params:
	- classId: id of the class

	Returns: Nothing
*/
export const deleteClassParticipants = async (userId: number) => {
	await db
		.delete(classParticipants)
		.where(eq(classParticipants.userId, userId));
}

/*
	updateClasses
	Insert or update provided class with "className" into the "classes" database.

	Params:
	- className: name of the class
	- details: details about the class in the form:
	{
		classId: string,
		sectionNumber: string,
		classEvents: VEvents[]
	}

	Returns: database id for the class
*/
export const updateClassesWithClass = async (className: string, details: classDetails) : Promise<number> => {
	const code = details.classId;
	const sectionNum = details.sectionNumber;
	let classId;

	const existingClass = await db
		.select()
		.from(classes)
		.where(and(eq(classes.code, code), eq(classes.sectionId, sectionNum)))
		.get()

	// if class does not already exist, add to "classes" table
	if (!existingClass) {
		const addedClass = await db
			.insert(classes)
			.values({
				name: className,
				code: details.classId,
				sectionId: details.sectionNumber,
				numStudents: 1,
				createdAt: new Date(),
				updatedAt: new Date()
			})
			.returning()
			.get()
		classId = addedClass.id
	} else { // else, increment "numStudents" in "classes" by 1
		const newNumStudents = existingClass!.numStudents! + 1;
		classId = existingClass.id;
		await db
			.update(classes)
			.set({
				numStudents: newNumStudents
			})
			.where(and(eq(classes.code, code), eq(classes.sectionId, sectionNum)))
	}

	return classId;
}