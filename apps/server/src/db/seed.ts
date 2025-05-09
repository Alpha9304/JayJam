import { db, connection } from "./index";
import { classes, classParticipants, pendingLocationOptions, pendingTimeOptions, locationVotes, timeVotes, googleTokens, channels, messages, pendingEvents, pendingEventParticipants, finalizedEventParticipants, finalizedEvents, groups, randomInts, sessions, users, settings, verificationCode, Group, Class, FinalizedEvent, PendingEvent, User, ClassParticipant } from "./schema";
import { eq, sql } from "drizzle-orm";
import { faker } from "@faker-js/faker";
import { insertNewUserIntoDb } from "../lib/auth/db";
import { isEqual } from "date-fns";

// Run inside "pnpm db:seed" inside apps/server to seed
// If you get errors, try deleting and regenerating the server: 
//	cd apps/server && rm -rf sqlite.db && pnpm db:push && pnpm db:seed

// Seeding will create 5 preset test users that are in all classes and all events
//	It will also create between 10 and 20 other random users
//
// Test users have the following credentials (replace [i] with user number 1 to 5)
//	name:			User[i]
//	email:			User[i]@jhu.edu
//	password for test usrs:	Pass123! 



// Enable for detailed console debug logs (will make seeding take much longer)
const debug = true;

async function seed() {

	console.log("Seeding the database...");

	const tableNames = [
		'randomInts',
		'groups',
		'classes',
		'users',
		'classParticipants',
		'finalizedEvents',
		'pendingEvents',
		'finalizedEventParticipants',
		'pendingEventParticipants',
		'pendingLocationOptions',
		'pendingTimeOptions',
		'locationVotes',
		'timeVotes',
		'verificationCode',
		'sessions',
		'googleTokens',
		'settings',
		'channels',
		'messages',
		'bannedUsers'
	]

	// Clean existing database
	console.log("Cleaning existing database...");
	if (debug) console.log("	Deleting randomInts")
	await db.delete(randomInts);
	if (debug) console.log("	Deleting classParticipants")
	await db.delete(classParticipants);
	if (debug) console.log("	Deleting finalizedEventParticipants")
	await db.delete(finalizedEventParticipants);
	if (debug) console.log("	Deleting pendingEventParticipants")
	await db.delete(pendingEventParticipants);
	if (debug) console.log("	Deleting pendingLocationOptions")
	await db.delete(pendingLocationOptions);
	if (debug) console.log("	Deleting pendingTimeOptions")
	await db.delete(pendingTimeOptions);
	if (debug) console.log("	Deleting locationVotes")
	await db.delete(locationVotes);
	if (debug) console.log("	Deleting timeVotes")
	await db.delete(timeVotes);
	if (debug) console.log("	Deleting verificationCode")
	await db.delete(verificationCode);
	if (debug) console.log("	Deleting sessions")
	await db.delete(sessions);
	if (debug) console.log("	Deleting googleTokens")
	await db.delete(googleTokens)
	if (debug) console.log("	Deleting settings")
	await db.delete(settings);
	if (debug) console.log("	Deleting channels")
	await db.delete(channels);
	if (debug) console.log("	Deleting messages")
	await db.delete(messages)
	if (debug) console.log("	Deleting finalizedEvents")
	await db.delete(finalizedEvents);
	if (debug) console.log("	Deleting pendingEvents")
	await db.delete(pendingEvents);
	if (debug) console.log("	Deleting groups")
	await db.delete(groups);
	if (debug) console.log("	Deleting classes")
	await db.delete(classes);
	if (debug) console.log("	Deleting users")
	await db.delete(users);

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
	const sampleUsers: User[] = []; // Contains all seeded users (random and test users)
	const randomUsers: User[] = []; // Contains only random users
	const testUsers: User[] = []; // Contains only set test users

	// First user has to be admin (this user's id will be used for eventCreatorId of all class generated events)
	console.log("Inserting admin account")
	const admin = await insertNewUserIntoDb("SysAdmin", "SysAdmin@jhu.edu", `Admin123!`)

	if (!admin) {
		throw new Error("Failed to insert admin")
	}

	// Create 5 preset test users
	//
	//	e.g,
	//	name:			User1
	//	email:			User1@jhu.edu
	//	password for all:	Pass123! 
	//
	console.log("Inserting users...")
	for (let i = 1; i <= 5; i++) {
		const name = "User" + i;
		const email = name + "@jhu.edu"
		const user = await insertNewUserIntoDb(name, email, `Pass123!`) // insert user with hashed password
		sampleUsers.push(user);
		testUsers.push(user);
	}

	// Create a random number of sample users (between 10 and 20)
	const numSampleUsers: number = faker.number.int({ min: 10, max: 20 })
	for (let i = 6; i <= (5+numSampleUsers); i++) {
		const firstName = faker.person.firstName();
		const lastName = faker.person.lastName();
		const fullName = firstName + " " + lastName;
		const email = faker.internet.email({firstName: firstName, lastName: lastName, provider: "jhu.edu", allowSpecialCharacters: false})
	  	const user = await insertNewUserIntoDb(fullName, email, `Password-${i}!`) // insert user with hashed password
		sampleUsers.push(user);
		randomUsers.push(user);
	}

	// Assign Settings
	console.log("Assigning settings, other details, and verification status to all users...");
	const settingsValues = sampleUsers
		.filter(user => user) // Filter out any null/undefined users
		.map(user => ({
			userId: user.id,
			theme: faker.helpers.arrayElement(["light", "dark"]),
			updatedAt: new Date()
		}));

	if (settingsValues.length > 0) {
		await db.insert(settings).values(settingsValues);
	}

	// Assign pronouns, major, etc.
	// TODO: Assign random profile picture
	for (const user of sampleUsers) {
		if (user) {
			await db // insert settings table and other details for each new user
				.update(users)
				.set({
					pronouns: faker.helpers.arrayElement([ "he/him", "she/her", "they/them", "other" ]),
					major: faker.person.jobTitle()
				})
				.where(eq(users.id, user.id))
		}
	}

	// Verify some random users (but verify all test users)
	for (const user of randomUsers) {
		if (user) {
			await db
				.update(users)
				.set({
					verified: faker.datatype.boolean()
				})
				.where(eq(users.id, user.id))
		}
	}
	for (const user of testUsers) {	
		if (user) {
			await db
				.update(users)
				.set({
					verified: true, 
				})
				.where(eq(users.id, user.id))
		}
	}

	// Generate a random number of class groups (between 5 and 10)
	const classGroupNums = faker.number.int({ min: 5, max: 10 });
	console.log("Generating " + classGroupNums + " class groups...")
	interface classWithStudents {
		class: Class,
		participants: User[]
	}
	const classGroupValues = []
	const classGroupList: {classGroup: Group, classes: classWithStudents[]}[] = [];
	for (let i = 0; i < classGroupNums; i++) {
		const title: string = faker.word.words()
		classGroupValues.push({
			title: title,
			numStudents: 0 // will be updated later
		})
	}
	 
	// Create a class group
	const insertedGroups = await db
		.insert(groups)
		.values(classGroupValues)
		.returning();

	if (!insertedGroups || insertedGroups.length === 0) {
		throw new Error("Generating class groups didn't work");
	}

	classGroupList.push(
		...insertedGroups.map((group) => ({
			classGroup: group,
			classes: []
		}))
	);

	if (debug) {
		insertedGroups.forEach((group) => {
			console.log(`	Added class group ${group.title}:`, group);
		})
	}

	// Generate a random number of classes per class group (between 1 and 5)
	console.log("Generating classes for groups...")
	for (const cg of classGroupList) {
		// Create between 1 and 5 class sections for the group
		const classSectionNums: number = faker.number.int({ min: 1, max: 5 })
		if (debug) {
			console.log(`	Creating ${classSectionNums} class sections for ${cg.classGroup.title}`)
		}

		const classSectionsToInsert = [];
		for (let i = 1; i <= classSectionNums; i++) {
			const title: string = cg.classGroup.title;
			classSectionsToInsert.push({ 
				name: title,
				code: faker.helpers.arrayElement(["EN", "AS"]) + "." + faker.number.int({min: 100, max: 999}) + "." + faker.number.int({min:100, max: 999}),
				sectionId: "" + i,
				groupId: cg.classGroup.id,
				numStudents: 0, // Updated later
				createdAt: new Date(),
				updatedAt: new Date(),
			})
		}

		const classSections = await db
			.insert(classes)
			.values(classSectionsToInsert)
			.returning()

		if (!classSections || classSections.length === 0) {
			throw new Error("Generating class sections didn't work");
		}

		cg.classes.push(
			...classSections.map((classSection) => ({
				class: classSection,
				participants: []
			}))
		);

		if (debug) {
			classSections.forEach((classSection) => {
				console.log(`		Added ${classSection.code}`)
			})
		}
	}



	// Assign students to classes
	// Also create repeating scheduled events per class group
	console.log("Assigning students to classes...")

	const finalizedEventsToInsert = [];
	const finalizedEventParticipantsToInsert = [];
	const pendingEventParticipantsToInsert = [];

	for (const cg of classGroupList) {
		
		// Select a random number of users (+ all test users) to be the class students
		const classStudents = faker.helpers.arrayElements(randomUsers, {min: 2, max: randomUsers.length}).concat(testUsers);
		if (debug) {
			console.log(`	Adding ${classStudents.length} students to class group ${cg.classGroup.title}`)
		}

		// Shuffle students and distribute them in round robin to class sections
		const shuffledStudents = faker.helpers.shuffle(classStudents);
		for (let i = 0; i < shuffledStudents.length; i++) {
			const user: User = shuffledStudents[i];
			const c: classWithStudents = cg.classes[i % cg.classes.length]
			if (debug) {
				console.log(`		Adding ${user.name} with id ${user.id} to class section ${c.class.sectionId}`)
			}
			await db
				.insert(classParticipants)
				.values({
					userId: user.id,
					classId: c.class.id
				})

			c.participants.push(user)
		}

		// Update classes with number of students
		for (const c of cg.classes) {
			const numStudents = c.participants.length
			if (debug) {
				console.log(`		Updating numStudents of section ${c.class.name} to ${numStudents}`)
			}

			await db
				.update(classes)
				.set({
					numStudents: numStudents
				})
				.where(eq(classes.id, c.class.id))
		}

		if (debug) {
			console.log(`		Updating numStudents of class group ${cg.classGroup.title} to ${classStudents.length}`)
		}

		// Update class group with total number of students
		await db
			.update(groups)
			.set({
				numStudents: classStudents.length
			})
			.where(eq(groups.id, cg.classGroup.id))

		console.log("	Making repeating schedule... ")

		// Class schedule will follow mon wed fri, tue thur, or just one class a week
		const schemes = ["mwf", "tt", "one"]
		const numRepeatedWeeks = 10; // Repeat schedule for next 10 weeks
		const baseDate = new Date()
		baseDate.setDate(baseDate.getDate() - baseDate.getDay()) // Adjust to sunday
		baseDate.setHours(0,0,0,0) // Set to midnight
		const duration = faker.number.int({ min: 1, max: 2 })
		const startHour = faker.number.int({min: 0, max: (24 - duration)})
		const start = new Date(new Date(baseDate).setHours(startHour))
		const end = new Date(new Date(baseDate).setHours(startHour + duration))
		const eventTimeRanges: [Date, Date][] = [];
		const scheme = faker.helpers.arrayElement(schemes);
		if (debug) console.log(`	Creating a ${scheme} schedule... `)
		for (let i = 0; i < numRepeatedWeeks; i++) {
			switch(scheme) {
				case "mwf":
					eventTimeRanges.push([ // mon
						new Date(new Date(start).setDate(start.getDate() + 1)),
						new Date(new Date(end).setDate(end.getDate() + 1)),
					])
					eventTimeRanges.push([ // wed
						new Date(new Date(start).setDate(start.getDate() + 3)),
						new Date(new Date(end).setDate(end.getDate() + 3)),
					])
					eventTimeRanges.push([ // fri
						new Date(new Date(start).setDate(start.getDate() + 5)),
						new Date(new Date(end).setDate(end.getDate() + 5)),
					])
					break;
				case "tt":
					eventTimeRanges.push([ // tue
						new Date(new Date(start).setDate(start.getDate() + 2)),
						new Date(new Date(end).setDate(end.getDate() + 2)),
					])
					eventTimeRanges.push([ // thur
						new Date(new Date(start).setDate(start.getDate() + 4)),
						new Date(new Date(end).setDate(end.getDate() + 4)),
					])
					break;
				case "one":
					const day: number = faker.number.int({min: 0, max: 6})
					eventTimeRanges.push([ // random day of week
						new Date(new Date(start).setDate(start.getDate() + day)),
						new Date(new Date(end).setDate(end.getDate() + day)),
					])
					break;
			}
			// Set to same time on sunday next week
			start.setDate(start.getDate() + 7)
			end.setDate(end.getDate() + 7)
		}

		// Other regularly scheduled class event details
		const title = cg.classGroup.id + " - " + cg.classGroup.title;
		const description = null;
		const eventCreatorId = 1; // set to 1 for now...
		const location = faker.location.streetAddress();
		const type = "class"
		const date = new Date();


		for (const c of cg.classes) { // Insert each for each class
			for (const student of c.participants) { // Insert for each student
				for (const timeRange of eventTimeRanges) {
					finalizedEventsToInsert.push({
							title: title,
							description: description,
							location: location,
							type: type,
							eventCreatorId: student.id, // Eventually need to assign to admin
							startTime: timeRange[0],
							endTime: timeRange[1],
							createdAt: date,
							externalId: null
						})

				}
			}
		}

	}

	// Create between 5 and 10 random events with some event participants and some types per class section within the next 5 weeks
	console.log("Making events (this may take a while)...")
	const sampleEventTypes = ["study", "external"];
	for (const cg of classGroupList) {
		for (const c of cg.classes) {
			const eventNums: number = faker.number.int({min: 5, max: 10})
			if (debug) {
				console.log(`	Creating ${eventNums} events for ${c.class.name}`)
			}

			// Create events
			for (let i = 1; i <= eventNums; i++) {

				// Event details
				const title = faker.word.words({ count: { min: 3, max: 6 }});
				const description = `${faker.lorem.sentence({ min: 10, max: 300 })}`;
				const participants = faker.helpers.arrayElements(c.participants, {min: 1, max: c.participants.length}).concat(testUsers); // Randomly select from random users but add all test users
				const eventCreatorId = faker.helpers.arrayElement(participants).id;
				const location = faker.location.streetAddress();
				const participantLimit = faker.number.int({min: 1, max: 15});
				const type = faker.helpers.arrayElement(sampleEventTypes);
				const date = new Date();
				const registrationDeadline = faker.date.soon({days: (5 * 7)}); // sometime within next 5 weeks
				const start = faker.date.soon({ refDate: registrationDeadline}); 
				const end = faker.date.soon({ refDate: start });
				const finalized = faker.datatype.boolean();

				if (finalized) {

					// Event
					finalizedEventsToInsert.push({
							title: title,
							description: description, 
							location: location,
							type: type,
							eventCreatorId: eventCreatorId,
							startTime: start,
							endTime: end,
							createdAt: date,
							externalId: null
						})
				} else {

					// TODO: pending events will stay unoptimized cuz it's taking too long for me to figure out atm

					// Event
					const event: PendingEvent = await db
						.insert(pendingEvents)
						.values({
							title: title,
							groupId: c.class.groupId!,
							description: description, 
							eventCreatorId: eventCreatorId,
							participantLimit: participantLimit,
							possibleStartTime: start,
							possibleEndTime: end,
							registrationDeadline: registrationDeadline,
							createdAt: date,
							updatedAt: date
						})
						.returning()
						.get()


						pendingEventParticipantsToInsert.push({
							eventId: event.id,
							userId: event.eventCreatorId,
							createdAt: new Date(),
						})

						// Event time options
						const numTimeOpts: number = faker.number.int({ min: 1, max: 4 })
						if (debug) {
							console.log(`			Adding ${numTimeOpts} time options`)
						}
						for (let i = 0; i < numTimeOpts; i++) {
							const dateRange: Date[] = faker.date.betweens({ from: event.possibleStartTime, to: event.possibleEndTime, count: 2 })
							const numVotes: number = faker.number.int({ min: 0, max: participants.length })

							if (debug) {
								console.log(`				Adding time opt from ${dateRange[0]} to ${dateRange[1]}`)
							}
							const timeOpt = await db
								.insert(pendingTimeOptions)
								.values({
									eventId: event.id,
									startTime: dateRange[0],
									endTime: dateRange[1],
									timeVoteCount: numVotes
								})
								.returning()
								.get()

							// Add votes
						if (debug) {
							console.log(`				Adding ${numVotes} votes`)
						}

						for (let j = 0; j < numVotes; j++) {
							const vote = await db
								.insert(timeVotes)
								.values({
									userId: participants[j].id,
									optionId: timeOpt.id,
									createdAt: date
								})
								.returning()
								.get()
						}
					}

					// Event location options
					const numLocOpts: number = faker.number.int({ min: 1, max: 4 })
					if (debug) {
						console.log(`			Adding ${numLocOpts} location options`)
					}
					for (let i = 0; i < numLocOpts; i++) {
						const location: string = faker.location.streetAddress({ useFullAddress: true });
						const numVotes: number = faker.number.int({ min: 0, max: participants.length })
						if (debug) {
							console.log(`				Adding location opt at ${location}`)
						}
						const locOpt = await db
							.insert(pendingLocationOptions)
							.values({
								eventId: event.id,
								location: location,
								locationVoteCount: numVotes
							})
							.returning()
							.get()

						// Add votes
						if (debug) {
							console.log(`				Adding ${numVotes} votes`)
						}
						for (let j = 0; j < numVotes; j++) {
							const vote = await db
								.insert(locationVotes)
								.values({
									userId: participants[j].id,
									optionId: locOpt.id,
									createdAt: date
								})
								.returning()
								.get()
						}
					}
				}
			}
		}

	}

	const finalizedEventsReturning: FinalizedEvent[] = await db
		.insert(finalizedEvents)
		.values(finalizedEventsToInsert)
		.returning()

	if (!finalizedEventsReturning || finalizedEventsReturning.length === 0) {
		throw new Error("Couldn't create finalized events")
	}

	// Add participants to the finalized event
	for (const event of finalizedEventsReturning) {
		if (debug) {
			console.log(`			Added finalized event ${event.title} from ${event.startTime.toLocaleString()} to ${event.endTime.toLocaleString()}`)
		}

		finalizedEventParticipantsToInsert.push({
			eventId: event.id,
			userId: event.eventCreatorId,
			createdAt: new Date(),
		})

	}

	const finalizedParticipants = await db
		.insert(finalizedEventParticipants)
		.values(finalizedEventParticipantsToInsert)
		.returning()

	if (!finalizedParticipants || finalizedParticipants.length === 0) {
		throw new Error("Couldn't create finalized events")
	}

	const pendingParticipants = await db
		.insert(pendingEventParticipants)
		.values(pendingEventParticipantsToInsert)
		.returning()

	if (!pendingParticipants || pendingParticipants.length === 0) {
		throw new Error("Couldn't insert pending participants")
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
