import { relations, InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import { sqliteTable, integer, text, primaryKey, blob, check } from "drizzle-orm/sqlite-core";

export const allowedThemes = ["light", "dark"] 
export type User = InferSelectModel<typeof users>;
export type UserInsert = InferInsertModel<typeof users>; 
export type PendingEvent = InferSelectModel<typeof pendingEvents>;

/*
* ---------------------------------------------------
* Hello World Test Use
* ---------------------------------------------------
*/
export const randomInts = sqliteTable("randomInts", {
	id: integer("id").primaryKey({autoIncrement: true}),
	randInt: integer("randInt").notNull()
})

/*
* ---------------------------------------------------
* Class & Groups
* ---------------------------------------------------
*/

// Classes with same "name" are put into one group (for now...)
export const groups = sqliteTable("groups", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	title: text("title").notNull(),
	numStudents: integer("num_students").default(0).notNull()
})

// Classes with same "name" but different "code" or "sectionId" are considered different classes
export const classes = sqliteTable("classes", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(),
	code: text("code").notNull(), 						// EN.601.500 etc.
	sectionId: text("section_id").notNull(), 			// (U1), (01), etc.
	groupId: integer("group_id"), 						// id of group that classes is part of
	numStudents: integer("num_students").default(0).notNull(),
	createdAt: integer("createdAt", {mode: "timestamp"}).notNull(),
	updatedAt: integer("updatedAt", {mode: "timestamp"}).notNull(),
})

// Relations
// Relation for `group` and `classes` (One-to-Many)
export const groupRelations = relations(groups, ({many}) => ({
	classes: many(classes),
}))

// Relation for `classes`, `classsParticipants` (One-to-Many), and `group` (One-to-One)
export const classesRelations = relations(classes, ({many, one}) => ({
	classParticipants: many(classParticipants),
	group: one(groups, {
		fields: [classes.groupId],
		references: [groups.id]
	})
}))

/*
* ---------------------------------------------------
* Users
* ---------------------------------------------------
*/

export const users = sqliteTable("users", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(), // default name is email
	email: text("email").notNull().unique(),
	password: text("password").notNull(),
	hashId: text(), // hashed id from SIS iCal output,
	sisLink: text("sis_link"),
	createdAt: integer("createdAt", {mode: "timestamp"}).notNull(),
	updatedAt: integer("updatedAt", {mode: "timestamp"}).notNull(),
	verified: integer("verified", {mode: "boolean"}).notNull(),
	profilePic: blob(),
	pronouns: text("pronouns"),
	major: text("major"),
	settingsId: integer("settings_id")
})

export const classParticipants = sqliteTable("class_participants", {
	userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
	classId: integer("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
	hidden: integer("hidden", { mode: "boolean" }).default(false).notNull()
	},
	(t) => [
		primaryKey({ columns: [t.userId, t.classId]}) 
	]
)

//Relations
// Relation for `users`, `classParticipants`, and `settings` 
export const usersRelations = relations(users, ({one, many}) => ({
	classParticipants: many(classParticipants),
	settings: one(settings, {
		fields: [users.id],
		references: [settings.userId]
	})
}))


// Relation for `classParticipants`, `class`, and `user`
export const classParticipantsRelations = relations(classParticipants, ({one}) => ({
	class: one(classes, {
		fields: [classParticipants.classId],
		references: [classes.id],
	  }),
	user: one(users, {
		fields: [classParticipants.userId],
		references: [users.id],
	})
}))

/*
* ---------------------------------------------------
* Events (finalized and pending)
* ---------------------------------------------------
*/

export const finalizedEvents = sqliteTable("finalized_events", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	title: text("title").notNull(),
	description: text("description"),
	eventCreatorId: integer("event_creator_id").references(() => users.id, { onDelete: "cascade" }).notNull(), // user who created the event,  null for class events
	location: text("location"),
	startTime: integer("start_time", { mode: "timestamp" }).notNull(),
	endTime: integer("end_time", { mode: "timestamp" }).notNull(),
	createdAt: integer("createdAt", {mode: "timestamp"}).notNull(),
	type: text("type").notNull().default("custom"), // 'custom', 'class', or 'google'
	externalId: text("externalId")
})

export const pendingEvents = sqliteTable("pending_events", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	groupId: integer("group_id").references(() => groups.id, { onDelete: "cascade" }).notNull(),
	title: text("title").notNull(),
	description: text("description"),
	eventCreatorId: integer("event_creator_id").references(() => users.id),
	participantLimit: integer("participant_limit"),
	possibleStartTime: integer("possible_start_time", { mode: "timestamp" }).notNull(),
	possibleEndTime: integer("possible_end_time", { mode: "timestamp" }).notNull(),
	registrationDeadline: integer("registration_deadline", { mode: "timestamp" }).notNull(), // Deadline for attendees to join and vote
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
})

export const finalizedEventParticipants  = sqliteTable("finalized_event_participants", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	eventId: integer("event_id").references(() => finalizedEvents.id, { onDelete: "cascade" }).notNull(),
	userId: integer("user_id").references(() => users.id,  { onDelete: "cascade" }).notNull(),
	createdAt: integer("createdAt", {mode: "timestamp"}).notNull(),
})

export const pendingEventParticipants  = sqliteTable("pending_event_participants", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	eventId: integer("event_id").references(() => pendingEvents.id, { onDelete: "cascade" }),
	userId: integer("user_id").references(() => users.id,  { onDelete: "cascade" }),
	createdAt: integer("createdAt", {mode: "timestamp"}).notNull(),
})

export const pendingLocationOptions = sqliteTable("event_location_options", {
	id: integer("id").primaryKey({ autoIncrement: true }), 
	eventId: integer("event_id").notNull().references(() => pendingEvents.id, { onDelete: "cascade" }),
	location: text("location").notNull(),
	locationVoteCount: integer("location_vote_count").default(0).notNull()
})

export const pendingTimeOptions = sqliteTable("time_options", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	eventId: integer("event_id").notNull().references(() => pendingEvents.id, { onDelete: "cascade" }),	
	startTime: integer("start_time", { mode: "timestamp" }).notNull(),
	endTime: integer("end_time", { mode: "timestamp" }).notNull(),
	timeVoteCount: integer("time_vote_count").default(0).notNull()
});

export const locationVotes = sqliteTable("location_votes", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
	optionId: integer("option_id").notNull().references(() => pendingLocationOptions.id, { onDelete: "cascade" }),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
  
export const timeVotes = sqliteTable("time_votes", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
	optionId: integer("option_id").notNull().references(() => pendingTimeOptions.id, { onDelete: "cascade" }),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Relations
// Relations for `pendingEvents` (One-to-Many)
export const pendingEventRelations = relations(pendingEvents, ({ many }) => ({
	attendees: many(pendingEventParticipants),
	locationOptions: many(pendingLocationOptions),
	timeOptions: many(pendingTimeOptions),
}));
// Relations for `pendingEvents` (Many-to-One)
export const pendingEventGroupRelations = relations(pendingEvents, ({ one }) => ({
	group: one(groups, {
		fields: [pendingEvents.groupId],
		references: [groups.id]
	})
}))

// Relations for `pendingEventParticipants` (Many-to-One)
export const pendingEventParticipantsRelations = relations(pendingEventParticipants, ({ one }) => ({
    event: one(pendingEvents, {
        fields: [pendingEventParticipants.eventId],
        references: [pendingEvents.id]
    }),
    user: one(users, {
        fields: [pendingEventParticipants.userId],
        references: [users.id]
    }),
}))

// Relations for `pendingLocationOptions` (Many-to-One)
export const eventLocationOptionsRelations = relations(pendingLocationOptions, ({ one }) => ({
    event: one(pendingEvents, {
        fields: [pendingLocationOptions.eventId],
        references: [pendingEvents.id]
    })
}))

// Relations for `pendingTimeOptions` (Many-to-One)
export const eventTimeOptionsRelations = relations(pendingTimeOptions, ({ one }) => ({
    event: one(pendingEvents, {
        fields: [pendingTimeOptions.eventId],
        references: [pendingEvents.id]
    })
}))

// Relations for `finalizedEvents`,  `finalizedEventParticipants`	(One-to-Many), `location` (One-to-One), `time` (One-to-One)
export const finalizedEventRelations = relations(finalizedEvents, ({ many, one }) => ({
	attendees: many(finalizedEventParticipants),
	// locationOptions: one(pendingLocationOptions),
	// timeOptions: one(pendingTimeOptions),
}));

// Relations for `finalizedEventsParticipants` (Many-to-One)
export const finalizedEventParticipantsRelations = relations(finalizedEventParticipants, ({ one }) => ({
    event: one(finalizedEvents, {
        fields: [finalizedEventParticipants.eventId],
        references: [finalizedEvents.id]
    }),
    user: one(users, {
        fields: [finalizedEventParticipants.userId],
        references: [users.id]
    }),
}))

/*
* ---------------------------------------------------
* Email Verification 
* ---------------------------------------------------
*/

export const verificationCode = sqliteTable("verificationCode", {
	id: integer("id").primaryKey({autoIncrement: true}),
	code: text("code").notNull().unique(),
	expiresAt: integer("expiresAt").notNull(), 			//code will expire in five minutes
	userId: integer("userId").references(() => users.id, { onDelete: "cascade" }).notNull() 				//this will need to be a foreign key for the user
})

/*
* ---------------------------------------------------
* Sessions
* ---------------------------------------------------
*/

export const sessions = sqliteTable("sessions", {
  sessionId: text("session_id").primaryKey(), // hashed token
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }), 	// Delete all sessions associated with user
  userEmail: text("user_email").notNull(),
  expiresAt: integer("expires_at", {mode: 'timestamp_ms'}).notNull(),
});

/*
* ---------------------------------------------------
* Google Tokens (currently not used, tokens we have are not refresh tokens, and expire very fast)
* ---------------------------------------------------
*/

export const googleTokens = sqliteTable("googleTokens", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	userId: integer("user_id")
	  .notNull()
	  .references(() => users.id, { onDelete: "cascade" }), 	// Delete all sessions associated with user
	refreshToken: text("refresh_token"), 						// Google refresh token
	scope: text("scope").notNull(), 							// URL defining what scope user has
	expiryDate: integer("expiry_date", { mode: 'timestamp_ms' }).notNull(),
  });

/*
* ---------------------------------------------------
* Settings
* ---------------------------------------------------
*/

// One-to-One relationship with "users" through foreign key "userId"
export const settings = sqliteTable("settings", {
	id: integer("id").primaryKey({autoIncrement: true}),
	theme: text("theme").notNull().default("light"), 				// default theme is light
	updatedAt: integer("updatedAt", {mode: "timestamp"}).notNull(),
	userId: integer("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" })
})

/*
* ---------------------------------------------------
* Messages
* ---------------------------------------------------
*/

export const channels = sqliteTable("channels", {
	id: integer("id").primaryKey({autoIncrement: true}),
	finalizedEventId: integer("finalized_event_id").references(() => finalizedEvents.id),
	pendingEventId: integer("pending_event_id").references(() => pendingEvents.id)
},
(table) => [
	check("fk_check", sql`${table.finalizedEventId} IS NOT NULL OR ${table.pendingEventId} IS NOT NULL `)
]
)

export const messages = sqliteTable("messages", {
	id: integer("id").primaryKey({autoIncrement: true}),
	channelId: integer("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
	userId: integer("user_id").notNull().references(() => users.id),
	createdAt: integer("created_at", {mode: "timestamp"}).notNull(),
	modifiedAt: integer("modified_at", {mode: "timestamp"}).notNull(),
	content: text("content").notNull()

})

export const messagesRelations = relations(messages, ({ one }) => ({
	channel: one(channels, { fields: [messages.channelId], references: [channels.id] }),
  }));
  
  export const ChannelRelations = relations(channels, ({ many }) => ({
	posts: many(messages),
  }));