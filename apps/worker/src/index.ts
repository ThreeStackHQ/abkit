/**
 * AbKit Worker
 * 
 * Handles background tasks:
 * - Weekly experiment summary emails
 * - Experiment auto-completion (when significance reached)
 * - Stats aggregation
 * 
 * TODO: Implement in Sprint 3.2 (Email Notifications)
 */

import { Worker, Queue } from 'bullmq'
import IORedis from 'ioredis'

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

export const emailQueue = new Queue('abkit-emails', { connection })

// Worker stub — Sprint 3.2 will implement email digest logic
const _worker = new Worker(
  'abkit-emails',
  async (job) => {
    console.log('[Worker] Processing job:', job.name, job.id)
    // TODO: Sprint 3.2 — implement weekly digest + significance alert emails
  },
  { connection },
)

console.log('[AbKit Worker] Started — listening for jobs')
