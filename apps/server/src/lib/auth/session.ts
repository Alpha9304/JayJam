/*
General Session Auth Steps:

Authentication:
1. Existing user provides credentials
2. Credentials are passed to server
2. Server verifies credentials, and if correct:
4. Create a session token
5. Send to client through cookie
6. Hash token and store in database
7. User is logged in

Authorization:
1. Any requests to DB afterwards will include session cookie
2. Server gets token from cookie
3. Generate session id from token
4. User with that session id is authorized to perform requested action
*/

import { createHash, getRandomValues, randomBytes } from "crypto";
import { deleteSessionFromDb, getSessionFromDb, insertSessionInDb } from "./db";
import { Context } from "../trpc";
import { TRPCError } from "@trpc/server";
import { makeCookie } from "../cookie";
import { error } from "console";
import { SerializeOptions } from "cookie";

export type UserSession = {
  sessionId: string,
  userId: number, 
  userEmail: string,
  expiresAt: Date
}

export const SESSION_COOKIE_NAME : string = "session-cookie"
const SESSION_DURATION = 1000 * 60 * 60 * 24 * 3 // 3 days

// Creates and returns a session token
const generateSessionToken = (): string => {
  const sessionToken = randomBytes(16).toString('hex').normalize();
  return sessionToken
}

// Creates a sessionId (to store in DB) by hashing received token
export const generateSessionId = (token: string): string => {
  const sessionId = 
    createHash('sha256') // want to create SHA256 hash
    .update(token) // hash the token
    .digest('hex')
    .normalize()
  return sessionId 
}

// Makes a session from token and userId
export const makeSession = (token: string, userId: number, userEmail: string): UserSession => {
  const sessionId = generateSessionId(token)
  console.log("Trying to insert session")
  const session: UserSession = {
    sessionId,
    userId,
    userEmail,
    expiresAt: new Date(Date.now() + SESSION_DURATION)
  }; 

  return session;
}

// Sets a session token cookie

export const setSessionTokenCookie = async (opts: Context, userId: number, userEmail: string) => {
  const token = generateSessionToken();
  
  if (!opts.res) {
    throw new TRPCError({'code': 'INTERNAL_SERVER_ERROR', 'message': 'Could not find request response'})
  }

  // Put session in DB
  await insertSessionInDb(makeSession(token, userId, userEmail))

  // and send token cookie back to client in response
  const cookieStr : string = makeCookie(SESSION_COOKIE_NAME, token);
  opts.res.appendHeader("set-cookie", cookieStr);
}

// Validate session
// Takes in token, generates session id, checks database, then returns UserSession
export const validateSessionToken = async (token: string): Promise<UserSession | null> => {
  let session: UserSession;

  try {
    session = await getSessionFromDb(token);        
  } catch (e) {
    if (e instanceof TRPCError && e.code === 'NOT_FOUND') {
      return null;
    }
    throw e
  }
  return session;
}

// Invalidate session given session id
export const invalidateSessionToken = async (opts: Context, sessionId: string): Promise<void> => {
  try {
    console.log("invalidate");
    console.log("sessionId", sessionId);
    const session = deleteSessionFromDb(sessionId);
    if (!session) {
      throw error("session not found")
    }

    // send invalid cookie back to client
    const expiredCookie : string = makeCookie(SESSION_COOKIE_NAME, "", {"expires": new Date(0)});

    if (!opts.res) {
      throw new TRPCError({'code': 'INTERNAL_SERVER_ERROR', 'message': 'Could not find request response'})
    }
    opts.res.appendHeader("set-cookie", expiredCookie);

  } catch (e) {
    console.log("Session not found")
    throw e
  }
}


// export const setSessionTokenCookie = async (
//   sessionToken: string,
//   expiresAt: Date
// ): Promise<void> => {
//   if (env.NODE_ENV === "PROD") {
//     // When deployed over HTTPS
//     setCookie(c, SESSION_COOKIE_NAME, sessionToken, {
//       path: "/",
//       sameSite: "Lax",
//       expires: expiresAt,
//       secure: true,
//     });
//   } else {
//     // When deployed over HTTP (localhost)
//     setCookie(c, SESSION_COOKIE_NAME, sessionToken, {
//       path: "/",
//       sameSite: "None",
//       expires: expiresAt,
//       secure: true,
//     });
//   }
// };