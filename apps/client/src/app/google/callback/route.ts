import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";


// This handles API request to /google/callback
export async function GET(request: NextRequest) {
  console.log("req: ", request.url);

   
  const params = new URL(request.url).searchParams;
  
  const code = params.get("code");
  const userId = params.get("state");
  const scope = params.get("scope");
  
  const frontend_url = process.env.NEXT_PUBLIC_FRONTEND_URL  || process.env.NEXT_PUBLIC_FRONTEND_FALLBACK_URL || "http://localhost:3002";

  const req_url = new URL(`${frontend_url}/google/callback?state=${userId}&code=${code}&scope=${scope}`);
  
  console.log("google client",  process.env.GOOGLE_ENV)
  /*
  if(process.env.GOOGLE_ENV && process.env.GOOGLE_ENV === "local_dev"){
    console.log("here");
    req_url = new URL(`http://localhost:3002/google/callback?state=${userId}&code=${code}&scope=${scope}`);
    console.log("change?: ", req_url)
  }*/

  console.log("new req", req_url);

  const backend_url = process.env.NEXT_PUBLIC_BACKEND_URL  ||  process.env.NEXT_PUBLIC_BACKEND_FALLBACK_URL || "http://localhost:4002";
  

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
