import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";


// This handles API request to /google/callback
export async function GET(request: NextRequest) {
  console.log("req: ", request.url);

   
  const params = new URL(request.url).searchParams;
  
  const code = params.get("code");
  const userId = params.get("state");
  const scope = params.get("scope");
  
  //const frontend_url = process.env.NEXT_PUBLIC_FRONTEND_FALLBACK_URL || process.env.NEXT_PUBLIC_FRONTEND_URL  || "http://localhost:3002";

  let frontend_url = "http://localhost:3002";
  
  // Check if we're in a browser environment
  if (typeof window !== "undefined") {
    const currentUrl = window.location.href;
    
    // If we're on the fallback URL, use the fallback frontend URL
    if (currentUrl.includes(process.env.NEXT_PUBLIC_FRONTEND_FALLBACK_URL || "")) {
      frontend_url = process.env.NEXT_PUBLIC_FRONTEND_FALLBACK_URL || frontend_url ;
    } 
    // If we're on the public URL, use the public frontend URL
    else if (currentUrl.includes(process.env.NEXT_PUBLIC_FRONTEND_URL || "")) {
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
  }

  const req_url = new URL(`${frontend_url}/google/callback?state=${userId}&code=${code}&scope=${scope}`);
  
  console.log("google client",  process.env.GOOGLE_ENV)
  /*
  if(process.env.GOOGLE_ENV && process.env.GOOGLE_ENV === "local_dev"){
    console.log("here");
    req_url = new URL(`http://localhost:3002/google/callback?state=${userId}&code=${code}&scope=${scope}`);
    console.log("change?: ", req_url)
  }*/

  console.log("new req", req_url);

  //const backend_url = process.env.NEXT_PUBLIC_BACKEND_FALLBACK_URL || process.env.NEXT_PUBLIC_BACKEND_URL  || "http://localhost:4002";
  let backend_url = "http://localhost:4002";
  
  // Check if we're in a browser environment
  if (typeof window !== "undefined") {
    const currentUrl = window.location.href;
    
    // If we're on the fallback URL, use the fallback backend URL
    if (currentUrl.includes(process.env.NEXT_PUBLIC_FRONTEND_FALLBACK_URL || "")) {
      backend_url = process.env.NEXT_PUBLIC_BACKEND_FALLBACK_URL || backend_url ;
    } 
    // If we're on the public URL, use the public backend URL
    else if (currentUrl.includes(process.env.NEXT_PUBLIC_FRONTEND_URL || "")) {
      backend_url = process.env.NEXT_PUBLIC_BACKEND_URL || backend_url ;
    }
    // If neither, fall back to the public URL if available, then fallback URL
    else {
      if (process.env.NEXT_PUBLIC_BACKEND_URL) {
        backend_url  = process.env.NEXT_PUBLIC_BACKEND_URL;
      } else if (process.env.NEXT_PUBLIC_BACKEND_FALLBACK_URL) {
        backend_url  = process.env.NEXT_PUBLIC_BACKEND_FALLBACK_URL;
      }
    }
  }
  
  for(let i = 0; i < 2; i++) { //retry one time because for some reason first time it fails 
    try {
      const sendCode = await fetch(`${backend_url}/google/callback`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: req_url })
      });
      const res = await sendCode.json()
      console.log("Response from server about callback : ", res)

      if (!res.success) {
        throw new Error(res.message)
      }

      console.log("Authorized to Sync with Google Calendar!")
      // redirect(new URL("/google-calendar", request.url))
      return NextResponse.redirect(new URL("/calendar?success=true", req_url));

    } catch (error) {
      console.error(`Something went wrong: ${error}`)
      if(i == 1) {
        redirect(`/calendar?authError=${error}`);
      }
    }
  }
// TODO: tell user something went wrong



// const params = request.nextUrl.searchParams
//
// const error: string | undefined = params.get("error")?.toString().normalize()
// if (error) {
//   console.error("Auth error from Google: ", error)
// }
//
// const code: string | undefined = params.get("code")?.toString().normalize()
// if (!code) {
//   console.error("No code found in Google auth callback")
// }
//
// // redirect to success page or error page
//
// return Response.json({ "message": "received", "code": response });
}
