import { handle } from "@upstash/realtime";
import { realtime } from "@/lib/redis";

export const POST = handle({ realtime });
export const GET = handle({ realtime });
