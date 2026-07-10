"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

export async function generateUserToken() {
  const session = await auth();

  if (!session || !session.userId || !session.sessionId) {
    throw new Error("Unauthorized");
  }

  const client = await clerkClient();

  // Get the token for the specific session
  // We can use a template if configured, but default JWT works for standard auth
  const token = await client.sessions.getToken(session.sessionId, "convex");

  // If the template returns an object, extract jwt. If string, execute directly.
  let jwt = "";
  if (token && typeof token === 'object' && 'jwt' in token) {
      jwt = token.jwt;
  } else if (typeof token === 'string') {
      jwt = token;
  } else {
      // Fallback to default
      const defaultToken = await client.sessions.getToken(session.sessionId);
      jwt = defaultToken.jwt || "";
  }

  return jwt;
}
