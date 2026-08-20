/** Keep users signed in for 1 year after a single login */
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 365;

export function sessionCookieOptions(maxAge = SESSION_MAX_AGE_SEC) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
