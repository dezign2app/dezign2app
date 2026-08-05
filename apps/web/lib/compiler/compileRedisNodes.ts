import { BackendNode, BackendEdge } from "@/types/canvas";
import { CompiledFile, CompiledRedisResult } from "@workspace/canvas/types";

/**
 * Compiles Redis nodes into a shared microservices package: packages/redis (@workspace/redis)
 */
export function compileRedisNodes(
  allNodes: BackendNode[],
  allEdges: BackendEdge[] = [],
): CompiledRedisResult {
  const files: CompiledFile[] = [];

  const redisNodes = allNodes.filter(
    (n) =>
      n.type === "redis-streams" ||
      n.type === "redis-pubsub" ||
      n.type === "redis-cache" ||
      ((n.type === "queue" ||
        n.type === "pubsub" ||
        n.type === "eventstream" ||
        n.type === "database" ||
        n.type === "storage") &&
        ((n.data as any)?.implementation?.toLowerCase()?.includes("redis") ||
          (n.data as any)?.dbType?.toLowerCase() === "redis" ||
          (n.data as any)?.engine?.toLowerCase() === "redis")),
  );

  if (redisNodes.length === 0) {
    return { files: [] };
  }

  // 1. package.json
  const packageJson = JSON.stringify(
    {
      name: "@workspace/redis",
      version: "0.0.0",
      private: true,
      description:
        "Shared Redis client, caching, pub/sub, streams, and helper functions",
      main: "src/index.ts",
      types: "src/index.ts",
      scripts: {
        build: "tsc",
        "check-types": "tsc --noEmit",
      },
      dependencies: {
        ioredis: "^5.4.1",
        "@workspace/logger": "workspace:*",
        "@workspace/types": "workspace:*",
      },
      devDependencies: {
        "@workspace/typescript-config": "workspace:*",
        typescript: "^5.3.3",
      },
    },
    null,
    2,
  );
  files.push({
    filename: "package.json",
    language: "json",
    content: packageJson,
  });

  // 2. tsconfig.json
  const tsconfig = JSON.stringify(
    {
      extends: "@workspace/typescript-config/base.json",
      compilerOptions: {
        outDir: "./dist",
        rootDir: "./src",
      },
      include: ["src/**/*"],
    },
    null,
    2,
  );
  files.push({
    filename: "tsconfig.json",
    language: "json",
    content: tsconfig,
  });

  // 3. src/config.ts
  const configContent = `/**
 * Redis Client Configuration Defaults & Environment Resolvers
 */
export interface RedisClientConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  url?: string;
  keyPrefix?: string;
}

export function getRedisConfig(): RedisClientConfig {
  const url = process.env.REDIS_URL;
  const host = process.env.REDIS_HOST || "localhost";
  const port = Number(process.env.REDIS_PORT) || 6379;
  const password = process.env.REDIS_PASSWORD || undefined;
  const db = Number(process.env.REDIS_DB) || 0;
  const keyPrefix = process.env.REDIS_KEY_PREFIX || "";

  return {
    url,
    host,
    port,
    password,
    db,
    keyPrefix,
  };
}
`;
  files.push({
    filename: "src/config.ts",
    language: "typescript",
    content: configContent,
  });

  // 4. src/client.ts
  const clientContent = `import Redis, { RedisOptions } from "ioredis";
import { getRedisConfig } from "./config";
import { createLogger } from "@workspace/logger";

const logger = createLogger("RedisClient");

let sharedRedisInstance: Redis | null = null;

export function createRedisClient(overrides?: RedisOptions): Redis {
  if (sharedRedisInstance && !overrides) {
    return sharedRedisInstance;
  }

  const config = getRedisConfig();
  const client = config.url
    ? new Redis(config.url, { keyPrefix: config.keyPrefix, ...overrides })
    : new Redis({
        host: overrides?.host || config.host,
        port: overrides?.port || config.port,
        password: overrides?.password || config.password,
        db: overrides?.db !== undefined ? overrides.db : config.db,
        keyPrefix: overrides?.keyPrefix || config.keyPrefix,
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        ...overrides,
      });

  client.on("connect", () => {
    logger.info(\`Connected to Redis instance [\${config.host}:\${config.port}]\`);
  });

  client.on("error", (err) => {
    logger.error("Redis client encountered an error", err);
  });

  if (!overrides) {
    sharedRedisInstance = client;
  }

  return client;
}

export async function getRedisClient(): Promise<Redis> {
  const client = createRedisClient();
  if (client.status === "wait" || client.status === "close") {
    await client.connect();
  }
  return client;
}
`;
  files.push({
    filename: "src/client.ts",
    language: "typescript",
    content: clientContent,
  });

  // 5. src/cache.ts
  const cacheContent = `import { getRedisClient } from "./client";
import { createLogger } from "@workspace/logger";

const logger = createLogger("RedisCache");

export async function getCache<T = unknown>(key: string): Promise<T | null> {
  try {
    const redis = await getRedisClient();
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    logger.error(\`Error reading key [\${key}] from Redis cache\`, error);
    return null;
  }
}

export async function setCache<T = unknown>(
  key: string,
  value: T,
  ttlSeconds?: number,
): Promise<void> {
  try {
    const redis = await getRedisClient();
    const serialized = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await redis.setex(key, ttlSeconds, serialized);
    } else {
      await redis.set(key, serialized);
    }
    logger.info(\`Cached key [\${key}]\${ttlSeconds ? \` with TTL \${ttlSeconds}s\` : ""}\`);
  } catch (error) {
    logger.error(\`Error setting key [\${key}] in Redis cache\`, error);
    throw error;
  }
}

export async function deleteCache(key: string): Promise<boolean> {
  try {
    const redis = await getRedisClient();
    const result = await redis.del(key);
    return result > 0;
  } catch (error) {
    logger.error(\`Error deleting key [\${key}] from Redis cache\`, error);
    return false;
  }
}

export async function flushCache(): Promise<void> {
  try {
    const redis = await getRedisClient();
    await redis.flushdb();
    logger.info("Flushed current Redis database");
  } catch (error) {
    logger.error("Error flushing Redis database", error);
    throw error;
  }
}
`;
  files.push({
    filename: "src/cache.ts",
    language: "typescript",
    content: cacheContent,
  });

  // 6. src/pubsub.ts
  const pubsubContent = `import Redis from "ioredis";
import { createRedisClient } from "./client";
import { createLogger } from "@workspace/logger";

const logger = createLogger("RedisPubSub");

let pubClient: Redis | null = null;
let subClient: Redis | null = null;

export async function publishRedisMessage<T = Record<string, unknown>>(
  channel: string,
  message: T,
): Promise<number> {
  try {
    if (!pubClient) {
      pubClient = createRedisClient();
    }
    const payload = JSON.stringify(message);
    const count = await pubClient.publish(channel, payload);
    logger.info(
      \`Published message to Redis channel [\${channel}], received by \${count} subscriber(s)\`,
    );
    return count;
  } catch (error) {
    logger.error(\`Failed to publish message to Redis channel [\${channel}]\`, error);
    throw error;
  }
}

export async function subscribeRedisChannel<T = Record<string, unknown>>(
  channel: string,
  handler: (message: T, channelName: string) => void | Promise<void>,
): Promise<Redis> {
  if (!subClient) {
    subClient = createRedisClient();
  }

  await subClient.subscribe(channel);
  logger.info(\`Subscribed to Redis channel [\${channel}]\`);

  subClient.on("message", async (chan, rawMsg) => {
    if (chan === channel) {
      try {
        const parsed = JSON.parse(rawMsg) as T;
        await handler(parsed, chan);
      } catch (err) {
        logger.error(\`Failed to process message on channel [\${chan}]\`, err);
      }
    }
  });

  return subClient;
}
`;
  files.push({
    filename: "src/pubsub.ts",
    language: "typescript",
    content: pubsubContent,
  });

  // 7. src/streams.ts
  const streamsContent = `import { getRedisClient } from "./client";
import { createLogger } from "@workspace/logger";

const logger = createLogger("RedisStreams");

export async function addStreamEntry(
  streamKey: string,
  values: Record<string, string>,
): Promise<string> {
  try {
    const redis = await getRedisClient();
    const args: string[] = [];
    Object.entries(values).forEach(([k, v]) => {
      args.push(k, v);
    });
    const entryId = await redis.xadd(streamKey, "*", ...args);
    logger.info(\`Added entry [\${entryId}] to Redis Stream [\${streamKey}]\`);
    return entryId as string;
  } catch (error) {
    logger.error(\`Failed to add entry to Redis Stream [\${streamKey}]\`, error);
    throw error;
  }
}

export async function createConsumerGroup(
  streamKey: string,
  groupName: string,
  startId: string = "$",
): Promise<void> {
  try {
    const redis = await getRedisClient();
    await redis.xgroup("CREATE", streamKey, groupName, startId, "MKSTREAM");
    logger.info(
      \`Created Redis Stream consumer group [\${groupName}] on stream [\${streamKey}]\`,
    );
  } catch (error: any) {
    if (error?.message?.includes("BUSYGROUP")) {
      logger.info(
        \`Consumer group [\${groupName}] already exists on stream [\${streamKey}]\`,
      );
    } else {
      logger.error(\`Error creating consumer group [\${groupName}]\`, error);
      throw error;
    }
  }
}

export async function readStreamGroup(
  streamKey: string,
  groupName: string,
  consumerName: string,
  count: number = 10,
): Promise<Array<{ id: string; message: Record<string, string> }>> {
  try {
    const redis = await getRedisClient();
    const response = (await redis.xreadgroup(
      "GROUP",
      groupName,
      consumerName,
      "COUNT",
      count,
      "STREAMS",
      streamKey,
      ">",
    )) as any;

    if (!response || response.length === 0) {
      return [];
    }

    const results: Array<{ id: string; message: Record<string, string> }> = [];
    const [, entries] = response[0] as [string, Array<[string, string[]]>];

    for (const [id, rawFields] of entries) {
      const messageObj: Record<string, string> = {};
      for (let i = 0; i < rawFields.length; i += 2) {
        messageObj[rawFields[i]] = rawFields[i + 1];
      }
      results.push({ id, message: messageObj });
    }

    return results;
  } catch (error) {
    logger.error(
      \`Error reading from stream group [\${groupName}] on stream [\${streamKey}]\`,
      error,
    );
    throw error;
  }
}
`;
  files.push({
    filename: "src/streams.ts",
    language: "typescript",
    content: streamsContent,
  });

  // 8. src/index.ts
  const indexContent = `/**
 * Shared Redis Package (@workspace/redis)
 */
export * from "./config";
export * from "./client";
export * from "./cache";
export * from "./pubsub";
export * from "./streams";
`;
  files.push({
    filename: "src/index.ts",
    language: "typescript",
    content: indexContent,
  });

  // 9. docker-compose.yml
  const dockerComposeContent = `version: "3.8"

services:
  redis:
    image: redis:7-alpine
    container_name: redis-cache
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  redis_data:
`;
  files.push({
    filename: "docker-compose.yml",
    language: "yaml",
    content: dockerComposeContent,
  });

  return { files };
}
