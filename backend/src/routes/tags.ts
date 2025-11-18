import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { NotFoundError, ConflictError, asyncHandler } from '../errors';
import { eventBus } from '../lib/events';

const CreateTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  description: z.string().max(200).optional(),
  category: z.string().max(50).optional(),
});

const UpdateTagSchema = CreateTagSchema.partial();

const AssignTagsSchema = z.object({
  tagIds: z.array(z.string().cuid()),
});

export async function tagRoutes(app: FastifyInstance) {
  /**
   * Get all tags
   */
  app.get('/api/tags', asyncHandler(async (request, reply) => {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { repos: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return reply.send({
      success: true,
      data: tags,
    });
  }));

  /**
   * Create a tag
   */
  app.post('/api/tags', asyncHandler(async (request, reply) => {
    const body = CreateTagSchema.parse(request.body);

    // Check for duplicate name
    const existing = await prisma.tag.findUnique({
      where: { name: body.name },
    });

    if (existing) {
      throw new ConflictError(`Tag "${body.name}" already exists`);
    }

    const tag = await prisma.tag.create({
      data: body,
    });

    return reply.status(201).send({
      success: true,
      data: tag,
    });
  }));

  /**
   * Update a tag
   */
  app.patch<{ Params: { id: string } }>(
    '/api/tags/:id',
    asyncHandler(async (request, reply) => {
      const { id } = request.params;
      const body = UpdateTagSchema.parse(request.body);

      const existing = await prisma.tag.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundError('Tag', id);
      }

      const tag = await prisma.tag.update({
        where: { id },
        data: body,
      });

      return reply.send({
        success: true,
        data: tag,
      });
    })
  );

  /**
   * Delete a tag
   */
  app.delete<{ Params: { id: string } }>(
    '/api/tags/:id',
    asyncHandler(async (request, reply) => {
      const { id } = request.params;

      const tag = await prisma.tag.findUnique({ where: { id } });
      if (!tag) {
        throw new NotFoundError('Tag', id);
      }

      await prisma.tag.delete({ where: { id } });

      return reply.status(204).send();
    })
  );

  /**
   * Assign tags to a repository
   */
  app.post<{ Params: { repoId: string } }>(
    '/api/repos/:repoId/tags',
    asyncHandler(async (request, reply) => {
      const { repoId } = request.params;
      const { tagIds } = AssignTagsSchema.parse(request.body);

      // Verify repo exists
      const repo = await prisma.repoRecord.findUnique({ where: { id: repoId } });
      if (!repo) {
        throw new NotFoundError('Repository', repoId);
      }

      // Remove existing tags
      await prisma.repoTag.deleteMany({ where: { repoId } });

      // Add new tags
      const repoTags = await prisma.repoTag.createMany({
        data: tagIds.map((tagId) => ({
          repoId,
          tagId,
        })),
        skipDuplicates: true,
      });

      // Emit events
      for (const tagId of tagIds) {
        await eventBus.publish('tag.added', 'RepoTag', repoId, { repoId, tagId });
      }

      return reply.send({
        success: true,
        data: { assigned: repoTags.count },
      });
    })
  );

  /**
   * Get repos by tag
   */
  app.get<{ Params: { tagId: string } }>(
    '/api/tags/:tagId/repos',
    asyncHandler(async (request, reply) => {
      const { tagId } = request.params;

      const tag = await prisma.tag.findUnique({
        where: { id: tagId },
        include: {
          repos: {
            include: {
              repo: {
                include: {
                  analysisRuns: {
                    take: 1,
                    orderBy: { startedAt: 'desc' },
                  },
                },
              },
            },
          },
        },
      });

      if (!tag) {
        throw new NotFoundError('Tag', tagId);
      }

      return reply.send({
        success: true,
        data: {
          tag,
          repos: tag.repos.map((rt) => rt.repo),
        },
      });
    })
  );
}
