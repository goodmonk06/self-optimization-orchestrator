import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { config, validateConfig } from './config';
import { connectDatabase, prisma } from './db';
import { GitHubClient } from './github-client';
import { LLMService } from './llm-service';
import { JobData } from './types';

// Validate configuration
validateConfig();

const connection = new IORedis({
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,
});

const githubClient = new GitHubClient();
const llmService = new LLMService();

/**
 * Process a repository analysis job
 */
async function processAnalysis(job: Job<JobData>) {
  const { repoId, githubFullName } = job.data;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Starting analysis for: ${githubFullName}`);
  console.log(`${'='.repeat(60)}\n`);

  // Update job progress
  await job.updateProgress(10);

  try {
    // Mark analysis as in progress
    const analysisRun = await prisma.analysisRun.create({
      data: {
        repoId,
        status: 'IN_PROGRESS',
      },
    });

    await job.updateProgress(20);

    // Fetch repository data from GitHub
    console.log('📥 Fetching repository data...');
    const repoData = await githubClient.fetchRepoData(githubFullName);

    // Update repo metadata
    await prisma.repoRecord.update({
      where: { id: repoId },
      data: {
        metaJson: repoData as any,
        lastAnalyzedAt: new Date(),
      },
    });

    await job.updateProgress(40);

    // Analyze with LLM
    console.log('🤖 Analyzing with LLM...');
    const analysis = await llmService.analyzeRepository(repoData);

    await job.updateProgress(60);

    // Format summary
    const summaryMarkdown = `# Analysis Summary for ${githubFullName}

${analysis.summary}

**Health Score:** ${analysis.healthScore}/100

## Improvement Suggestions

${analysis.suggestions
  .map(
    (s, i) => `### ${i + 1}. ${s.title}

**Priority:** ${s.priority.toUpperCase()}
**Category:** ${s.category}

${s.description}
`
  )
  .join('\n---\n\n')}

*Analysis completed at ${new Date().toISOString()}*
`;

    // Update analysis run
    await prisma.analysisRun.update({
      where: { id: analysisRun.id },
      data: {
        status: 'COMPLETED',
        finishedAt: new Date(),
        summaryMarkdown,
        suggestionsJson: analysis.suggestions as any,
      },
    });

    await job.updateProgress(80);

    // Optionally create GitHub issues
    if (config.analysis.autoCreateIssues && analysis.suggestions.length > 0) {
      console.log('📝 Creating GitHub issues...');

      for (const suggestion of analysis.suggestions) {
        try {
          const issueUrl = await githubClient.createIssue(
            githubFullName,
            suggestion.title,
            suggestion.issueBody || suggestion.description,
            ['automated', 'improvement', suggestion.category]
          );

          await prisma.createdAction.create({
            data: {
              runId: analysisRun.id,
              type: 'ISSUE',
              targetUrl: issueUrl,
              payloadJson: suggestion as any,
            },
          });

          console.log(`  ✓ Created issue: ${issueUrl}`);
        } catch (error) {
          console.error(`  ✗ Failed to create issue for "${suggestion.title}":`, error);
        }
      }
    }

    await job.updateProgress(100);

    console.log(`\n✓ Analysis completed for ${githubFullName}`);
    console.log(`  Health Score: ${analysis.healthScore}/100`);
    console.log(`  Suggestions: ${analysis.suggestions.length}`);
    console.log(`${'='.repeat(60)}\n`);

    return {
      success: true,
      analysisId: analysisRun.id,
      healthScore: analysis.healthScore,
    };
  } catch (error) {
    console.error(`\n✗ Analysis failed for ${githubFullName}:`, error);

    // Mark analysis as failed
    const failedRun = await prisma.analysisRun.findFirst({
      where: {
        repoId,
        status: 'IN_PROGRESS',
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (failedRun) {
      await prisma.analysisRun.update({
        where: { id: failedRun.id },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      });
    }

    throw error;
  }
}

/**
 * Start the worker
 */
async function startWorker() {
  console.log('🚀 Starting Self-Optimization Orchestrator Worker\n');

  // Connect to database
  await connectDatabase();

  // Create worker
  const worker = new Worker<JobData>('repo-analysis', processAnalysis, {
    connection,
    concurrency: 2, // Process 2 repos at a time
    limiter: {
      max: 10, // Max 10 jobs
      duration: 60000, // per minute
    },
  });

  worker.on('completed', (job) => {
    console.log(`✓ Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`✗ Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });

  console.log('✓ Worker is ready and listening for jobs\n');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('\nShutting down worker...');
    await worker.close();
    await connection.quit();
    process.exit(0);
  });
}

// Start the worker if this file is run directly
if (require.main === module) {
  startWorker().catch((error) => {
    console.error('Failed to start worker:', error);
    process.exit(1);
  });
}

export { startWorker };
