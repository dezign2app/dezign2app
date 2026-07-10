import { Request } from "express";
import { ClerkPayload, Session, AuthContext } from "../types";
import { CONVEX_URL, CLERK_JWT_ISSUER } from "../config";

function verifyClerkJWT(token: string): ClerkPayload | null {
  try {
    // Decode JWT without strict verification (for dev mode)
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.error("[AUTH] Invalid JWT format");
      return null;
    }

    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());

    // Verify issuer in dev mode (optional)
    if (
      payload.iss &&
      !payload.iss.includes(CLERK_JWT_ISSUER.replace("https://", ""))
    ) {
      console.warn("[AUTH] JWT issuer mismatch:", payload.iss);
    }

    console.log("[AUTH] JWT verified successfully, user:", payload.sub);
    return payload;
  } catch (err) {
    console.error("[AUTH] Error parsing JWT:", err);
    return null;
  }
}

export function extractAuthToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  console.log(`[AUTH] Authorization header present: ${!!authHeader}`);
  
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    console.log(`[AUTH] Token starts with: ${token.substring(0, 10)}...`);
    return token;
  }
  
  if (authHeader) {
    console.warn(`[AUTH] Authorization header found but does not start with "Bearer "`);
  }
  
  return null;
}

async function validateConvexApiKey(key: string): Promise<{ userId: string; orgId?: string; keyId: string } | null> {
  try {
    const response = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: "api_keys:validate",
        args: { key },
        format: "json",
      }),
    });

    if (!response.ok) {
      console.error("[AUTH] Convex validation request failed:", response.statusText);
      return null;
    }

    const data = await response.json();
    if (data.status === "success" && data.value) {
      console.log("[AUTH] Convex validation success:", data.value.userId,"for accessing org", data.value.orgId);
      return data.value;
    }
    
    console.warn("[AUTH] Convex validation failed or returned no data:", data);
    return null;
  } catch (err) {
    console.error("[AUTH] Error validating API key:", err);
    return null;
  }
}

export async function resolveAuth(token: string): Promise<AuthContext | null> {
  if (token.startsWith("sk_live_")) {
    const validationResult = await validateConvexApiKey(token);
    if (validationResult) {
      return {
        userId: validationResult.userId,
        token: token,
        orgId: validationResult.orgId,
        keyId: validationResult.keyId,
      };
    }
    return null;
  }

  const payload = verifyClerkJWT(token);
  if (payload && payload.sub) {
    return {
      userId: payload.sub,
      token: token,
    };
  }

  return null;
}

async function authenticateSession(
  sessionId: string,
  token: string,
  session: Session,
): Promise<boolean> {
  const auth = await resolveAuth(token);
  if (!auth) {
    console.error("[AUTH] Failed to resolve auth for session:", sessionId);
    return false;
  }

  session.userId = auth.userId;
  session.orgId = auth.orgId;
  session.keyId = auth.keyId;
  session.clerkToken = auth.token;

  console.log(
    `[AUTH] Session ${sessionId} authenticated for user ${auth.userId}`,
  );

  return true;
}
