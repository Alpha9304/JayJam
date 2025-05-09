import { users } from "../db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

/*
	updateHashId
	Update the "hashId" property for given user.

	Params:
	- userId: id of user
	- hashId: hash id extracted from SIS iCal link

	Returns: Nothing
*/
export const updateHashId = async (userId: number, hashId: string) => {
	const hashedId = hashId;
	
	await db
		.update(users)
		.set({
			hashId: hashedId
		})
		.where(eq(users.id, userId))

	await updateTime(userId);
}

export const updateName = async(userId: number, name: string) => {
	const newName = name;

	await db
		.update(users)
		.set({
			name: newName
		})
		.where(eq(users.id, userId))

	await updateTime(userId);
}



export const updatePassword = async (userId: number, password: string) => {
	//TODO: Implement hashing
	const newPass = password;

	await db
		.update(users)
		.set({
			password: newPass
		})
		.where(eq(users.id, userId))

	await updateTime(userId);
}

export const updateProfile = async (userId: number, picture: Buffer) => {
	const newPic = picture;

	await db
		.update(users)
		.set({
			profilePic: newPic
		})
		.where(eq(users.id, userId))

	await updateTime(userId);
}

export const updatePronouns = async (userId: number, pronouns: string) => {
	const newPronouns = pronouns;

	await db
		.update(users)
		.set({
			pronouns: newPronouns
		})
		.where(eq(users.id, userId))

	await updateTime(userId);
}

export const updateMajor = async (userId: number, pronouns: string) => {
	const newMajor = pronouns;

	await db
		.update(users)
		.set({
			major: newMajor
		})
		.where(eq(users.id, userId))

	await updateTime(userId);
}

export const getName = async (userId: number) => {
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
		
	return user.name
}

export const getEmail = async (userId: number) => {
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
	
	return user.email
}

export const getHashId = async (userId: number) => {
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
	
	return user.hashId
}

export const getCreatedAt = async (userId: number) => {
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
	
	return user.createdAt
}

export const getUpdatedAt= async (userId: number) => {
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
	
	return user.updatedAt
}

export const getSisLink = async (userId: number) => {
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
		
	return user.sisLink
}

export const getVerified = async (userId: number) => {
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
		
	return user.verified
}

export const getProfilePic = async (userId: number) => {
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
	
	return user.profilePic
}

export const getPronouns = async (userId: number) => {
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
		
	return user.pronouns
}

export const getMajor = async (userId: number) => {
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
		
	return user.major
}

const updateTime = async (userId: number) => {
	await db
		.update(users)
		.set({
			updatedAt: new Date()
		})
		.where(eq(users.id, userId))
}