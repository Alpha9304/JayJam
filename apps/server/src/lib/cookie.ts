import { serialize, SerializeOptions } from "cookie"
import { Context } from "./trpc";

export const DEFAULT_COOKIE_EXPIRATION : number = 1000 * 60 * 60 * 24 * 1 // 1 day

// Specify default cookie options here
const getDefaultOptions = (): SerializeOptions => ({
  expires: new Date(Date.now() + DEFAULT_COOKIE_EXPIRATION), 
  secure: false,
  httpOnly: true,
  // sameSite: process.env.NODE_ENV == "production" ? "none" : "lax",
  sameSite: "lax"
});

export type Cookie = {
  name: string,
  value: string,
  options?: SerializeOptions;
}

// Allows you to make a cookie with just name and string
export const makeCookie = (name: string, value: string, options?: Partial<SerializeOptions>): string  => {
  const cookieOpts: SerializeOptions = {...getDefaultOptions(), ...options}
  const cookie: Cookie = {
    name,
    value, 
    options: cookieOpts
  }

  const cookieStr: string = makeCookieWithCookie(cookie)
  return cookieStr;
}

// Takes in cookie: Cookie, allowing you to specify all the options
// Returns cookie in string form to be passed to client
export const makeCookieWithCookie = (cookie: Cookie): string => {
  return serialize(cookie.name, cookie.value, cookie.options);
}

// Takes in an object of cookies (most likely from context)
// Returns value as string or null if DNE
export const getValueFromCookies = (cookies: Record<string, any>, name: string): string | null => {

  const cookie: string = JSON.parse(JSON.stringify(cookies))[name];
  if (!cookie || cookie == undefined) {
    console.log("no cookie found from client")
    return null;
  }
  // console.log("Cookie response from client", cookie)

  return cookie;
}

// Invalidate cookie
export const invalidateCookie = (opt: Context, cookie: string): void => {

}