import { Queue, QueueScheduler } from 'bullmq';
import IORedis from 'ioredis';
import { config } from './config';
import { JobData } from './types';

const connection = new IORedis({
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,
});

export const analysisQueue = new Queue<JobData>('repo-analysis', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 3600, // 24 hours
    },
    removeOnFail: {
      count: 50,
    },
  },
});

// Queue scheduler for delayed/repeating jobs
export const queueScheduler = new QueueScheduler('repo-analysis', {
  connection,
});

export async function addAnalysisJob(repoId: string, githubFullName: string) {
  const job = await analysisQueue.add(
    'analyze-repo',
    { repoId, githubFullName },
    {
      jobId: `analyze-${repoId}-${Date.now()}`,
    }
  );

  console.log(`✓ Added analysis job for ${githubFullName} (Job ID: ${job.id})`);
  return job;
}

export async function getRedisConnection() {
  return connection;
}
