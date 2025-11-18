import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { GitHubClient } from '../github-client';
import { addAnalysisJob } from '../queue';
import {
  CreateRepoSchema,
  UpdateRepoSchema,
  RepoIdSchema,
  PaginationSchema,
  RepoFilterSchema,
} from '../validation';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  asyncHandler,
} from '../errors';

export async function repoRoutes(app: FastifyInstance) {
  const githubClient = new GitHubClient();

  /**
   * Get all repositories with pagination and filtering
   */
  app.get(
    '/api/repos',
    asyncHandler(async (request, reply) => {
      const query = request.query as Record<string, any>;
      const { page, limit } = PaginationSchema.parse(query);
      const { status, search } = RepoFilterSchema.parse(query);

      const skip = (page - 1) * limit;

      const where: any = {};

      if (status === 'analyzed') {
        where.lastAnalyzedAt = { not: null };
      } else if (status === 'pending') {
        where.lastAnalyzedAt = null;
      }

      if (search) {
        where.githubFullName = {
          contains: search,
          mode: 'insensitive',
        };
      }

      const [repos, total] = await Promise.all([
        prisma.repoRecord.findMany({
          where,
          skip,
          take: limit,
          orderBy: [
            { lastAnalyzedAt: 'desc' },
            { createdAt: 'desc' },
          ],
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
        }),
        prisma.repoRecord.count({ where }),
      ]);

      return reply.send({
        success: true,
        data: {
          repos,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    })
  );

  /**
   * Create a new repository record
   */
  app.post(
    '/api/repos',
    asyncHandler(async (request, reply) => {
      const body = CreateRepoSchema.parse(request.body);

      // Check if repository already exists
      const existing = await prisma.repoRecord.findUnique({
        where: { githubFullName: body.githubFullName },
      });

      if (existing) {
        throw new ConflictError(
          `Repository ${body.githubFullName} already exists`
        );
      }

      const repo = await prisma.repoRecord.create({
        data: {
          githubFullName: body.githubFullName,
          metaJson: body.metaJson || {},
        },
      });

      return reply.status(201).send({
        success: true,
        data: repo,
      });
    })
  );

  /**
   * Get a specific repository by ID
   */
  app.get<{ Params: { id: string } }>(
    '/api/repos/:id',
    asyncHandler(async (request, reply) => {
      const { id } = RepoIdSchema.parse(request.params);

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
        throw new NotFoundError('Repository', id);
      }

      return reply.send({
        success: true,
        data: repo,
      });
    })
  );

  /**
   * Update a repository
   */
  app.patch<{ Params: { id: string } }>(
    '/api/repos/:id',
    asyncHandler(async (request, reply) => {
      const { id } = RepoIdSchema.parse(request.params);
      const body = UpdateRepoSchema.parse(request.body);

      // Check if repo exists
      const existing = await prisma.repoRecord.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundError('Repository', id);
      }

      // Check for name conflict if updating githubFullName
      if (body.githubFullName && body.githubFullName !== existing.githubFullName) {
        const conflict = await prisma.repoRecord.findUnique({
          where: { githubFullName: body.githubFullName },
        });

        if (conflict) {
          throw new ConflictError(
            `Repository ${body.githubFullName} already exists`
          );
        }
      }

      const updated = await prisma.repoRecord.update({
        where: { id },
        data: body,
      });

      return reply.send({
        success: true,
        data: updated,
      });
    })
  );

  /**
   * Delete a repository
   */
  app.delete<{ Params: { id: string } }>(
    '/api/repos/:id',
    asyncHandler(async (request, reply) => {
      const { id } = RepoIdSchema.parse(request.params);

      const repo = await prisma.repoRecord.findUnique({
        where: { id },
      });

      if (!repo) {
        throw new NotFoundError('Repository', id);
      }

      await prisma.repoRecord.delete({
        where: { id },
      });

      return reply.status(204).send();
    })
  );

  /**
   * Discover and sync repositories from GitHub
   */
  app.post(
    '/api/repos/discover',
    asyncHandler(async (request, reply) => {
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

      return reply.send({
        success: true,
        data: {
          total: repos.length,
          new: newCount,
          existing: updatedCount,
        },
      });
    })
  );

  /**
   * Trigger analysis for a specific repository
   */
  app.post<{ Params: { id: string } }>(
    '/api/repos/:id/analyze',
    asyncHandler(async (request, reply) => {
      const { id } = RepoIdSchema.parse(request.params);

      const repo = await prisma.repoRecord.findUnique({
        where: { id },
      });

      if (!repo) {
        throw new NotFoundError('Repository', id);
      }

      const job = await addAnalysisJob(repo.id, repo.githubFullName);

      return reply.send({
        success: true,
        data: {
          jobId: job.id,
          repoId: repo.id,
          githubFullName: repo.githubFullName,
        },
      });
    })
  );

  /**
   * Trigger analysis for all repositories
   */
  app.post(
    '/api/repos/analyze-all',
    asyncHandler(async (request, reply) => {
      const repos = await prisma.repoRecord.findMany();

      if (repos.length === 0) {
        throw new BadRequestError('No repositories found to analyze');
      }

      const jobs = await Promise.all(
        repos.map((repo) => addAnalysisJob(repo.id, repo.githubFullName))
      );

      console.log(`✓ Queued ${jobs.length} analysis jobs`);

      return reply.send({
        success: true,
        data: {
          count: jobs.length,
          jobs: jobs.map((j) => ({ id: j.id, name: j.name })),
        },
      });
    })
  );
}
