// Contains database queries

import { TRPCError } from "@trpc/server";
import { db } from "../../db";
import { User, UserInsert, sessions, users } from "../../db/schema";
import { generateSessionId, UserSession } from "./session";
import { eq } from "drizzle-orm"
import { hash, verify } from "argon2"

// Hashes password with a salt to make sure each time is different
const hashPassword = async (password: string): Promise<string> => {

  try {
    return await hash(password)
  } catch (error) {
    console.error("Failed to hash password")
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to hash password' });
  }

}

/**
 * Inserts new user into DB
 * @param email of new user
 * @param password of new user
 * @returns User of new user or error
 */
export const insertNewUserIntoDb = async (name: string, email: string, password: string): Promise<User> => {

  const argon2Hash: string = await hashPassword(password);

  const user: UserInsert = {
    name: name,
    email: email,
    password: argon2Hash,
    hashId: '', //TODO change this
    sisLink: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    verified: false
  }

  const [newUser] = await db
    .insert(users)
    .values(user)
    .returning();

  if (!newUser) {
    console.error("Error when inserting new user");
    // throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: 'Failed to Insert User'});
  }

  return newUser;
}

export const updateUserInDb = async (email: string, password: string): Promise<User> => {

  const argon2Hash: string = await hashPassword(password);
  
  const updatedUser = await db.update(users)
  .set({ password: argon2Hash })
  .where(eq(users.email, email)).returning().get();

  if (!updatedUser) {
    console.error("Error when inserting new user");
    // throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: 'Failed to Insert User'});
  }

  return updatedUser;
}

/**
 * Gets user from DB using email
 * @param email
 * @returns userId of validated user or null
 */
export const getUserUsingEmail = async (email: string): Promise<User> => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))

  if (!user) {
    console.error("Incorrect credentials");
    // throw new TRPCError({code: 'NOT_FOUND', message: 'User could not be found'});
  }

  return user;
}

/**
 * Asks DB to verify given email and password, will return userId 
 * of validated user
 * @param email to verify
 * @param password to verify
 * @returns userId of validated user or null
 */
export const verifyLoginCredentials = async (email: string, password: string): Promise<number> => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))

  if (!user) {
    throw new TRPCError({ 'code': 'NOT_FOUND', 'message': 'User Not Found' });
  }

  // Verify password
  const passCorrect: boolean = await verify(user.password, password);
  if (!passCorrect) {
    throw new TRPCError({ 'code': 'UNAUTHORIZED', 'message': 'Incorrect Credentials' });
  }

  if (!user.id) {
    throw new TRPCError({ 'code': 'INTERNAL_SERVER_ERROR', 'message': 'User doesn\'t have an id' });
  }

  if (!user.verified) {
    throw new TRPCError({ 'code': 'UNAUTHORIZED', 'message': 'User is not verified' });
  }

  // User found
  return user.id;
}

// Insert a session into the DB
// Will throw error on unsuccessful attempt
// Returns the user session inserted
export const insertSessionInDb = async (session: UserSession): Promise<UserSession> => {

  console.log("trying to insert this session", session)

  const [response] = await db
    .insert(sessions)
    .values(session)
    .returning();

  console.log("returning session i", session)

  if (!response) {
    console.error("Error when inserting session");
    // throw new TRPCError({code: 'INTERNAL_SERVER_ERROR', message: 'Failed to Insert Session'});
  }

  return response;
}

// Updates a current session (if exists) in database with updates
// updates: Can include any keys from UserSession
// Returns updated session if successful, else will throw error
export const updateSessionInDb = async (sessionId: string, updates: Partial<UserSession>): Promise<UserSession> => {
  if (Object.keys(updates).length === 0) {
    // throw new TRPCError({code: 'BAD_REQUEST', message: 'Missing fields to update'});
  }

  const [response] = await db
    .update(sessions)
    .set(updates)
    .where(eq(sessions.sessionId, sessionId))
    .returning();

  if (!response) {
    console.error("Error when updating session");
    // throw new TRPCError({code: 'NOT_FOUND', message: 'Session not found'});
  }

  return response;
}

// Gets a session from DB given a token
// Returns session if success, else will throw error
export const getSessionFromDb = async (token: string): Promise<UserSession> => {
  const sessionId = generateSessionId(token)

  const [response] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.sessionId, sessionId))

  if (!response) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
  }

  return response;
}

// Deletes a session with given sessionId from database
// Returns deleted session if success, else throw error
export const deleteSessionFromDb = async (sessionId: string): Promise<UserSession> => {
  console.log("sessionId", sessionId);
  const [response] = await db
    .delete(sessions)
    .where(eq(sessions.sessionId, sessionId))
    .returning();
  console.log(response);

  if (!response) {
    console.error("Error when deleting session");
    // throw new TRPCError({code: 'NOT_FOUND', message: 'Session not found'});
  }

  return response;
}

