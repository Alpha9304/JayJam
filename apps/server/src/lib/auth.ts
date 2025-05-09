import { TRPCError } from "@trpc/server";
import { getUserUsingEmail, insertNewUserIntoDb, updateUserInDb, verifyLoginCredentials } from "./auth/db";
import { invalidateSessionToken, setSessionTokenCookie, UserSession, validateSessionToken } from "./auth/session";
import { Context } from "./trpc";
import { db } from "../db";
import { User, users, settings } from "../db/schema";
import { eq } from "drizzle-orm"

export const registerUser = async (opts: Context, name: string, email: string, password: string) => {

  const user = db.select().from(users).where(eq(users.email, email)).get();

  try {
    if (!user) {

      console.log("inserting user")

      const user: User = await insertNewUserIntoDb(name, email, password)

      await db
        .insert(settings)
        .values({
          userId: user.id,
          updatedAt: new Date()
        })

      await setSessionTokenCookie(opts, user.id, email)

      return true
    } else {
      return false
    }
  } catch (error) {
    console.error("Eror in reg: ", error)
  }
}

export const loginUser = async (opts: Context, email: string, password: string): Promise<number> => {
  if (opts.session) {
    throw new TRPCError({ 'code': 'FORBIDDEN', 'message': 'A user is still logged in' })
  }

  const userId: number = await verifyLoginCredentials(email, password);

  await setSessionTokenCookie(opts, userId, email)

  return userId;
}

export const logoutUser = async (opts: Context): Promise<void> => {
  try {
    if (!opts.session) { // just allow logout to happen
      console.error("Requested logout but user not logged in")
      // throw new TRPCError({'code': 'FORBIDDEN', 'message': 'A user is not logged in'})
      opts.session = null;
      return;
    }
    const session: UserSession = opts.session

    // Get user
    const user: User = await getUserUsingEmail(session.userEmail);
    if (!user) {
      console.error("Logout but user does not exist")
      //throw new Error("Couldn't log out user: user dne")
      opts.session = null;
      return;
    }

    // Invalidate session
    if (opts.res) {
      invalidateSessionToken(opts, session.sessionId)
      //throw new Error("Couldn't log out user: response dne")
      opts.session = null;
      return;
    }

    console.error("Logout but could not find response")
    opts.session = null;
    return;

  } catch (e: unknown) {
    console.error("Could not log out user, ", e);
  }
}

export const requestPasswordReset = (email: string) => {
  // TODO: Implement
}

export const resetPassword = async (email: string, password: string) => {
  const updatedUser = updateUserInDb(email, password);
  if (!updatedUser) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: "User could not be updated" });
  }
  return true;
}

