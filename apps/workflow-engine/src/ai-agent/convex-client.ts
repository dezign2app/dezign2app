import { ConvexHttpClient } from "convex/browser";
import { CONVEX_URL } from "../config";

if (!CONVEX_URL) {
  throw new Error("CONVEX_URL is not defined");
}

const convexClient = new ConvexHttpClient(CONVEX_URL);

/**
 * Creates a Convex client with optional authentication.
 * Includes a wrapper for mutations/queries that retries on connection timeouts.
 */
export const getConvexClient = (token?: string): ConvexHttpClient => {
    const client = new ConvexHttpClient(CONVEX_URL);
    if (token && !token.startsWith("sk_")) {
        client.setAuth(token);
    }

    const originalMutation = client.mutation.bind(client);
    const originalQuery = client.query.bind(client);
    
    const retryHandler = <T extends (...args: any[]) => Promise<any>>(originalFn: T) => {
        return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
            let attempts = 0;
            const maxAttempts = 3;
            
            while (attempts < maxAttempts) {
                try {
                    return await originalFn(...args);
                } catch (err: unknown) {
                    attempts++;
                    const error = err instanceof Error ? err : new Error(String(err));
                    const isTimeout = error.message.includes("fetch failed") || 
                                     error.name === "ConnectTimeoutError" ||
                                     (error as { cause?: { name?: string } }).cause?.name === "ConnectTimeoutError";
                    
                    if (isTimeout && attempts < maxAttempts) {
                        console.warn(`Convex connection timeout (attempt ${attempts}/${maxAttempts}). Retrying...`);
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempts)); // Exponential backoff
                        continue;
                    }
                    throw error;
                }
            }
            throw new Error("Max retry attempts reached");
        }) as unknown as T;
    };

    client.mutation = retryHandler(originalMutation);
    client.query = retryHandler(originalQuery);

    return client;
};
