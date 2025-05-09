import { google } from "googleapis";
import { readFileSync } from "fs";
import { resolve } from "path";
import dotenv from "dotenv";

dotenv.config();

export const makeClient = (frontendURL: string) => {
  /**
   * To use OAuth2 authentication, we need access to a CLIENT_ID, CLIENT_SECRET, AND REDIRECT_URI
   * from the client_secret.json file. To get these credentials for your application, visit
   * https://console.cloud.google.com/apis/credentials.
   */
  const keyPath = resolve(process.cwd(), ".googlekeys.json").toString()

  const keys = JSON.parse(readFileSync(keyPath, "utf8")).web

  //let redirect_uri = keys.redirect_uris[1];

  //const frontend_url = process.env.NEXT_PUBLIC_FRONTEND_FALLBACK_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3002";
  let frontend_url = frontendURL;
  console.log("front url", frontend_url);
  

  
  const redirect_uri = `${frontend_url}/google/callback`;
  console.log("google", process.env.GOOGLE_ENV);
  
  /*
  if(process.env.GOOGLE_ENV && process.env.GOOGLE_ENV === "local_dev"){
    redirect_uri = keys.redirect_uris[0];
  }

  if(process.env.NEXT_PUBLIC_FRONTEND_URL === "https://dev.team03.crabdance.com/") {
    redirect_uri = keys.redirect_uris[2];
  }*/
 
  const oauth2Client = new google.auth.OAuth2(
    keys.client_id,
    keys.client_secret,
    redirect_uri
  );

  // Use this auth client for all Google API auths
  google.options({ auth: oauth2Client });

  return oauth2Client;
}



export const getGoogleUrl = (userId: string, frontendURL: string): string => {
  const oauth2Client = makeClient(frontendURL);

  // Access scopes for Google Calendar.
  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly'
  ];

  // Get authURL
  // TODO: Generate a secure random state value to prevent CSRF
  let authURL = oauth2Client.generateAuthUrl({
    access_type: "offline", // Enables us to use API even if user isn't online (e.g., for auto refresh)
    scope: scopes.join(),
    include_granted_scopes: true, // Incremental auth
    state: userId

    // Include the state parameter to reduce the risk of CSRF attacks.
    // state: state
  })
  //authURL += `&userId=${userId}`;
  console.log(authURL);
  return authURL;
}



