import { z } from "zod"; //uses zod for input validation
import { protectedProcedure, publicProcedure, router } from "../../lib/trpc";
import { getGoogleUrl, makeClient } from "../../lib/auth/google";
import { TRPCError } from "@trpc/server";
import { google } from "googleapis";
import { db } from "../../db";
import { finalizedEvents } from "../../db/schema";
import { and, eq } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";

export const googleRouter = router({
  url: publicProcedure // FIX: turn to protected
    .meta({
      openapi: {
        method: "GET",
        path: "/google/url",
      },
    })
    .input(z.void())
    .output(z.object({ url: z.string() }))
    .mutation(async ({ctx}) => {

      if(!ctx.session) {
        throw new TRPCError({code: "UNAUTHORIZED", message: "Must be logged in"})
      }

      // Get the frontend URL from request headers
    const referer = ctx.req?.headers?.referer || "";
    const origin = ctx.req?.headers?.origin || "";

    console.log("referer", referer);
    console.log("origin", origin);

    let frontend_url = "http://localhost:3002"; // default

    if (referer.includes(process.env.NEXT_PUBLIC_FRONTEND_URL || "")) {
      frontend_url = process.env.NEXT_PUBLIC_FRONTEND_URL!;
    } else if (referer.includes(process.env.NEXT_PUBLIC_FRONTEND_FALLBACK_URL || "")) {
      frontend_url = process.env.NEXT_PUBLIC_FRONTEND_FALLBACK_URL!;
    } else if (origin.includes(process.env.NEXT_PUBLIC_FRONTEND_URL || "")) {
      frontend_url = process.env.NEXT_PUBLIC_FRONTEND_URL!;
    } else if (origin.includes(process.env.NEXT_PUBLIC_FRONTEND_FALLBACK_URL || "")) {
      frontend_url = process.env.NEXT_PUBLIC_FRONTEND_FALLBACK_URL!;
    }

      return {
        // Return google url to client, which will make redirect
        url: getGoogleUrl(String(ctx.session.userId), frontend_url)
      }

    }),

  callback: publicProcedure // FIX: turn to protected
    .meta({
      openapi: {
        method: "POST",
        path: "/google/callback",
      },
    })
    .input(z.object({ url: z.string() }))
    .output(z.object({ success: z.boolean(), message: z.string() }))
    .mutation(async ({ ctx, input }) => {

      // Check for response
      if (!ctx.req) {
        console.error("No response found")
        throw new TRPCError({ message: "No response found", code: "INTERNAL_SERVER_ERROR" })
      }

      // If Google callback error, throw
      const authError = ctx.req.query.error?.toString().normalize()
      if (authError) {
        console.error(`Error returned from Google: ${authError}`)
        throw new TRPCError({ message: `Error returned from Google: ${authError}`, code: "BAD_REQUEST" })
      }

      // Get auth code or error from google callback:
      // GET /...?code={authorizationCode} or ?error={error}
      const url = new URL(input.url)
      const params = url.searchParams;

      let frontend_url = "http://localhost:3002";

      // Check if we're in a browser environment
      const currentUrl = url;
      console.log("cur url", currentUrl);
    
        // If we're on the fallback URL, use the fallback frontend URL
      if (String(currentUrl).includes(process.env.NEXT_PUBLIC_FRONTEND_FALLBACK_URL || "")) {
        frontend_url = process.env.NEXT_PUBLIC_FRONTEND_FALLBACK_URL || frontend_url ;
      } 
      // If we're on the public URL, use the public frontend URL
      else if (String(currentUrl).includes(process.env.NEXT_PUBLIC_FRONTEND_URL || "")) {
        frontend_url = process.env.NEXT_PUBLIC_FRONTEND_URL || frontend_url ;
      }
      // If neither, fall back to the public URL if available, then fallback URL
      else {
        if (process.env.NEXT_PUBLIC_FRONTEND_URL) {
          frontend_url  = process.env.NEXT_PUBLIC_FRONTEND_URL;
        } else if (process.env.NEXT_PUBLIC_FRONTEND_FALLBACK_URL) {
          frontend_url  = process.env.NEXT_PUBLIC_FRONTEND_FALLBACK_URL;
        }
      }
      

      // Error
      const error = params.get("error")
      if (error) {
        console.error("Error in getting Google auth code", error)
        throw new TRPCError({ message: error, code: "UNAUTHORIZED" })
      }

      // Code
      const code = params.get("code")
      if (!code) {
        console.error("No callback code found")
        throw new TRPCError({ message: "No callback code found", code: "INTERNAL_SERVER_ERROR" })
      }
      
      const userId = params.get("state");
      if(!userId){
        console.error("No userId found")
        throw new TRPCError({ message: "No userId found", code: "UNAUTHORIZED" })
      }

      
      //make client and get tokens
      console.log("using url", frontend_url);
      const client = makeClient(frontend_url);

      const { tokens } = await client.getToken(code);
      client.setCredentials(tokens);

      if (!tokens.scope?.includes("https://www.googleapis.com/auth/calendar")) {
        // TODO: user needs to grant permissions
        console.error("No valid token found, user needs to reauthenticate")
        throw new TRPCError({ message: "No valid token found, user needs to reauthenticate", code: "UNAUTHORIZED" })
      }

      //get the users calendar and insert the events
      const calendarEvents = await google.calendar("v3").events.list({
        calendarId: "primary",
        eventTypes: ["default"], //only get events, not reminders, tasks, holdiays, etc.
        singleEvents: true, //get re-occuring events as single instances,
        timeMin: new Date().toISOString(), //only get today's events
        maxResults: 2500, //this is the max amount of events it can get
        auth: client
      })

      if(!calendarEvents) {
        throw new TRPCError({ message: "Issue getting the user's events", code: "INTERNAL_SERVER_ERROR" })
      }

      for(let i = 0; i < calendarEvents.data.items!.length; i++){
          const calEvent = calendarEvents.data.items![i];
          const title = calEvent.summary || `No title for event ${calEvent.id}`;
          const description = calEvent.description || `No description for event ${calEvent.id}`;
          const location = calEvent.location || `No location for event ${calEvent.id}`;

          let startTime;
          let endTime;

          if(calEvent.start?.date && calEvent.end?.date){ //this means the event runs the whole day
            startTime = startOfDay(calEvent.start.date)
            endTime  = endOfDay(calEvent.end.date)
          } else {
            if(calEvent.start?.dateTime && calEvent.end?.dateTime) {
              startTime = new Date(calEvent.start?.dateTime);
              endTime = new Date(calEvent.end?.dateTime);
            } else {
              startTime = new Date();
              endTime = new Date();
            }
          }

          let createdAt;
          if(calEvent.created){
            createdAt = new Date(calEvent.created!);
          } else {
            createdAt = new Date();
          }

          const externalId = calEvent.id || "";

          const payload = {
            title,
            description,
            eventCreatorId: Number(userId)!,
            location,
            startTime,
            endTime,
            createdAt,
            type: "google",
            externalId
          };
          
          const duplicateEvents = await db
            .select().from(finalizedEvents)
            .where(and(eq(finalizedEvents.externalId, externalId), eq(finalizedEvents.eventCreatorId, Number(userId))));
          console.log("dupes:", duplicateEvents);
          //only insert unique events
          if(duplicateEvents.length == 0) {
            const event = await db.insert(finalizedEvents).values(payload).returning().get();

            if(!event) {
              throw new TRPCError({code: "INTERNAL_SERVER_ERROR", message: "Something went wrong when transferring your Google Calendar events"});
            }
            console.log("event added: ", event);
          }
      }



      return {
        success: true,
        message: "Google Auth complete and calendar data updated"
      }
    }),
})

export type GoogleRouter = typeof googleRouter
