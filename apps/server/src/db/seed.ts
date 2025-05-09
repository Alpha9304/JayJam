import { db, connection } from "./index";
import { classes, classParticipants, pendingLocationOptions, pendingTimeOptions, locationVotes, timeVotes, googleTokens, channels, messages, pendingEvents, pendingEventParticipants, finalizedEventParticipants, finalizedEvents, groups, randomInts, sessions, users, settings, verificationCode } from "./schema";
import { eq, sql } from "drizzle-orm";
import { faker } from "@faker-js/faker";
import { insertNewUserIntoDb } from "../lib/auth/db";

async function seed() {
	await db.delete(users); //need to fix the changes to the db...some fields missing...
	
	console.log("Seeding the database...");

	const tableNames = [
		'randomInts',
		'events',
		'groups',
		'classes',
		'users',
		'verificationCode',
		'sessions',
		'eventParticipants',
		'settings'
	]

	// Clean existing database
	console.log("Cleaning existing database...");
	await db.delete(randomInts);
	await db.delete(groups);
	await db.delete(classes);
	await db.delete(users);
	await db.delete(classParticipants);
	await db.delete(finalizedEvents);
	await db.delete(pendingEvents);
	await db.delete(finalizedEventParticipants);
	await db.delete(pendingEventParticipants);
	await db.delete(pendingLocationOptions);
	await db.delete(pendingTimeOptions);
	await db.delete(locationVotes);
	await db.delete(timeVotes);
	await db.delete(verificationCode);
	await db.delete(sessions);
	await db.delete(googleTokens)
	await db.delete(settings);
	await db.delete(channels);
	await db.delete(messages)

	// Reset auto-increment counters for SQLite
	for (const tableName of tableNames) {
		await db.run(sql`DELETE FROM sqlite_sequence WHERE name IN (${tableName})`);
	}

	console.log("Inserting new seed data...");

	// Insert 100 numbers from 0-99
	for (let i = 0; i < 100; i++) {
		const randomInt = await db
			.insert(randomInts)
			.values({
				randInt: i
			})
			.returning()
			.get();
	}

	// Create 10 sample users
	const sampleUsers = [];
	for (let i = 1; i <= 10; i++) {
		const firstName = faker.person.firstName();
		const lastName = faker.person.lastName();
		const fullName = firstName + " " + lastName;
		const email = faker.internet.email({firstName: firstName, lastName: lastName, provider: "jhu.edu", allowSpecialCharacters: false})
	  	const user = await insertNewUserIntoDb(fullName, email, `Password-${i}!`) // insert user with hashed password
		sampleUsers.push(user);

		if (user) {
			await db // insert settings table for each new user
				.insert(settings)
				.values({
					userId: user.id,
					updatedAt: new Date()
				})
		}
	}


	//Create 20 sample events with some event participants and some types
	const sampleEventTypes = ["study", "external"];
	for (let i = 1; i <= 20; i++) {
		const title = `${faker.lorem.sentence({ min: 1, max: 25 })}`;
		const description = `${faker.lorem.sentence({ min: 10, max: 300 })}`;
		const participants = faker.helpers.arrayElements(sampleUsers, {min: 10, max: 10});
		const location = faker.location.streetAddress();
		const participantLimit = faker.number.int({min: 1, max: 15});
		const type = faker.helpers.arrayElement(sampleEventTypes);
		const date = new Date();
		const start = faker.date.soon(); 
		const end = faker.date.soon({ refDate: start });

		const event = await db
			.insert(finalizedEvents)
			.values({
				title: title,
				description: description, 
				eventCreatorId: participants[0].id,
				location: location,
				startTime: start,
				endTime: end,
				createdAt: date,
				externalId: null
		})
		.returning()
		.get();
		
		for(let i = 1; i < participants.length; i++) {
			await db
			.insert(finalizedEventParticipants)
			.values({
				eventId: event.id,
				userId: participants[i].id,
				createdAt: date,
			})
		}
	
	}

	




	console.log("Seeding completed successfully.");
}

seed()
	.catch((e) => {
		console.error("Seeding failed:");
    	console.error(e);
	})
	.finally(() => {
		connection.close();
	});