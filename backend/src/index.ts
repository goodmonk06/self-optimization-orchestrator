import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config, validateConfig } from './config';
import { connectDatabase, prisma } from './db';
import { GitHubClient } from './github-client';
import { addAnalysisJob } from './queue';

// Validate configuration
validateConfig();

const app = Fastify({
  logger: {
    level: config.server.nodeEnv === 'development' ? 'info' : 'warn',
  },
});

// Register CORS
app.register(cors, {
  origin: true,
});

const githubClient = new GitHubClient();

/**
 * Health check endpoint
 */
app.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

/**
 * Get all repositories
 */
app.get('/api/repos', async (request, reply) => {
  const repos = await prisma.repoRecord.findMany({
    orderBy: {
      lastAnalyzedAt: 'desc',
    },
    include: {
      analysisRuns: {
        orderBy: {
          startedAt: 'desc',
        },
        take: 1,
        include: {
          createdActions: true,
        },
      },
    },
  });

  return repos;
});

/**
 * Get a specific repository
 */
app.get<{ Params: { id: string } }>('/api/repos/:id', async (request, reply) => {
  const { id } = request.params;

  const repo = await prisma.repoRecord.findUnique({
    where: { id },
    include: {
      analysisRuns: {
        orderBy: {
          startedAt: 'desc',
        },
        include: {
          createdActions: true,
        },
      },
    },
  });

  if (!repo) {
    reply.code(404);
    return { error: 'Repository not found' };
  }

  return repo;
});

/**
 * Get analysis run details
 */
app.get<{ Params: { id: string } }>('/api/analysis/:id', async (request, reply) => {
  const { id } = request.params;

  const analysis = await prisma.analysisRun.findUnique({
    where: { id },
    include: {
      repo: true,
      createdActions: true,
    },
  });

  if (!analysis) {
    reply.code(404);
    return { error: 'Analysis not found' };
  }

  return analysis;
});

/**
 * Discover and sync repositories from GitHub
 */
app.post('/api/repos/discover', async (request, reply) => {
  try {
    console.log('🔍 Discovering repositories from GitHub...');

    const repos = await githubClient.fetchAllRepos();
    console.log(`Found ${repos.length} repositories`);

    let newCount = 0;
    let updatedCount = 0;

    for (const repo of repos) {
      const existing = await prisma.repoRecord.findUnique({
        where: { githubFullName: repo.fullName },
      });

      if (existing) {
        updatedCount++;
      } else {
        await prisma.repoRecord.create({
          data: {
            githubFullName: repo.fullName,
            metaJson: { description: repo.description },
          },
        });
        newCount++;
      }
    }

    console.log(`✓ Discovery complete: ${newCount} new, ${updatedCount} existing`);

    return {
      success: true,
      total: repos.length,
      new: newCount,
      existing: updatedCount,
    };
  } catch (error) {
    console.error('Discovery failed:', error);
    reply.code(500);
    return {
      error: 'Failed to discover repositories',
      message: error instanceof Error ? error.message : String(error),
    };
  }
});

/**
 * Trigger analysis for a specific repository
 */
app.post<{ Params: { id: string } }>('/api/repos/:id/analyze', async (request, reply) => {
  const { id } = request.params;

  const repo = await prisma.repoRecord.findUnique({
    where: { id },
  });

  if (!repo) {
    reply.code(404);
    return { error: 'Repository not found' };
  }

  try {
    const job = await addAnalysisJob(repo.id, repo.githubFullName);

    return {
      success: true,
      jobId: job.id,
      repoId: repo.id,
      githubFullName: repo.githubFullName,
    };
  } catch (error) {
    console.error('Failed to queue analysis:', error);
    reply.code(500);
    return {
      error: 'Failed to queue analysis',
      message: error instanceof Error ? error.message : String(error),
    };
  }
});

/**
 * Trigger analysis for all repositories
 */
app.post('/api/repos/analyze-all', async (request, reply) => {
  try {
    const repos = await prisma.repoRecord.findMany();

    const jobs = await Promise.all(
      repos.map((repo) => addAnalysisJob(repo.id, repo.githubFullName))
    );

    console.log(`✓ Queued ${jobs.length} analysis jobs`);

    return {
      success: true,
      count: jobs.length,
      jobs: jobs.map((j) => ({ id: j.id, name: j.name })),
    };
  } catch (error) {
    console.error('Failed to queue analyses:', error);
    reply.code(500);
    return {
      error: 'Failed to queue analyses',
      message: error instanceof Error ? error.message : String(error),
    };
  }
});

/**
 * Get queue statistics
 */
app.get('/api/queue/stats', async (request, reply) => {
  try {
    const { analysisQueue } = await import('./queue');

    const [waiting, active, completed, failed] = await Promise.all([
      analysisQueue.getWaitingCount(),
      analysisQueue.getActiveCount(),
      analysisQueue.getCompletedCount(),
      analysisQueue.getFailedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      total: waiting + active + completed + failed,
    };
  } catch (error) {
    console.error('Failed to get queue stats:', error);
    reply.code(500);
    return {
      error: 'Failed to get queue statistics',
      message: error instanceof Error ? error.message : String(error),
    };
  }
});

/**
 * Start the server
 */
async function start() {
  try {
    console.log('🚀 Starting Self-Optimization Orchestrator API\n');

    // Connect to database
    await connectDatabase();

    // Start server
    await app.listen({
      port: config.server.port,
      host: '0.0.0.0',
    });

    console.log(`✓ Server listening on http://localhost:${config.server.port}`);
    console.log('\nAvailable endpoints:');
    console.log('  GET  /health');
    console.log('  GET  /api/repos');
    console.log('  GET  /api/repos/:id');
    console.log('  GET  /api/analysis/:id');
    console.log('  POST /api/repos/discover');
    console.log('  POST /api/repos/:id/analyze');
    console.log('  POST /api/repos/analyze-all');
    console.log('  GET  /api/queue/stats');
    console.log('');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\nShutting down server...');
  await app.close();
  process.exit(0);
});

// Start the server if this file is run directly
if (require.main === module) {
  start();
}

export default app;
