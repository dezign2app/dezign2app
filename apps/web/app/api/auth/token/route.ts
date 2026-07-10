import { generateUserToken } from "@/app/(auth)/_components/actions";
import { auth } from "@clerk/nextjs/server";

/**
 * API endpoint to generate a Clerk JWT token for MCP authentication
 *
 * Usage:
 * ```
 * const response = await fetch("/api/auth/token");
 * const { token } = await response.json();
 * ```
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.userId) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const token = await generateUserToken();

    if (!token) {
      return Response.json(
        { error: "Failed to generate token" },
        { status: 500 },
      );
    }

    return Response.json({
      token,
      userId: session.userId,
      expiresIn: 3600, // 1 hour (typical Clerk JWT expiration)
    });
  } catch (error) {
    console.error("[API] Token generation error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
