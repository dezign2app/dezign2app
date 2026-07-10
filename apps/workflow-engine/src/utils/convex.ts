import { CONVEX_URL } from "../config";

export async function callConvexAPI(
  method: string,
  args: any,
  token?: string,
): Promise<any> {
  try {
    const url = new URL(CONVEX_URL);
    url.pathname = "/api/query";

    if (method.includes(":")) {
      // Check if it's a mutation or query based on naming convention
      const isMutation = method.startsWith("mutation:");
      url.pathname = isMutation ? "/api/mutation" : "/api/query";

      // Extract the actual function name (remove prefix if present)
      const functionName = method.replace(/^(mutation:|query:)/, "");

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && !token.startsWith("sk_") ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          path: functionName,
          args,
        }),
      });

      if (!response.ok) {
        console.error(
          `[CONVEX] Request failed: ${response.status}`,
          await response.text(),
        );
        throw new Error(`Convex API error: ${response.status}`);
      }

      return await response.json();
    }

    throw new Error(`Invalid method format: ${method}`);
  } catch (err) {
    console.error("[CONVEX] Error calling API:", err);
    throw err;
  }
}
