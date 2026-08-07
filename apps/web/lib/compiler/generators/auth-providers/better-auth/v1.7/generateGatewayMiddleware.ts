export function generateGatewayMiddleware(): string {
  return `import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function betterAuthMiddleware(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const cookieSession = request.cookies.get("better-auth.session_token");

  if (!authHeader && !cookieSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate session token / bearer token against Better Auth API
  try {
    const authBaseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
    const res = await fetch(\`\${authBaseUrl}/api/auth/get-session\`, {
      headers: {
        cookie: request.headers.get("cookie") || "",
        authorization: authHeader || "",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Invalid Session" }, { status: 401 });
    }

    const session = await res.json();
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", session.user.id);
    requestHeaders.set("x-user-email", session.user.email);
    if (session.user.role) {
      requestHeaders.set("x-user-role", session.user.role);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Authentication Failed" }, { status: 500 });
  }
}
`;
}
