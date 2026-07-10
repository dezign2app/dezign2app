import { Redis } from '@upstash/redis'
import { Realtime } from '@upstash/realtime'
import { z } from 'zod'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const schema = {
  message: z.string(),
}

export const realtime = new Realtime({
    redis,
    schema,
})
