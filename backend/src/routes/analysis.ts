import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { AnalysisIdSchema } from '../validation';
import { NotFoundError, asyncHandler } from '../errors';

export async function analysisRoutes(app: FastifyInstance) {
  /**
   * Get analysis run details
   */
  app.get<{ Params: { id: string } }>(
    '/api/analysis/:id',
    asyncHandler(async (request, reply) => {
      const { id } = AnalysisIdSchema.parse(request.params);

      const analysis = await prisma.analysisRun.findUnique({
        where: { id },
        include: {
          repo: true,
          createdActions: true,
        },
      });

      if (!analysis) {
        throw new NotFoundError('Analysis', id);
      }

      return reply.send({
        success: true,
        data: analysis,
      });
    })
  );

  /**
   * Get all analysis runs for a repository
   */
  app.get<{ Params: { repoId: string } }>(
    '/api/repos/:repoId/analysis',
    asyncHandler(async (request, reply) => {
      const { repoId } = request.params;

      const analyses = await prisma.analysisRun.findMany({
        where: { repoId },
        orderBy: {
          startedAt: 'desc',
        },
        include: {
          createdActions: true,
        },
      });

      return reply.send({
        success: true,
        data: analyses,
      });
    })
  );

  /**
   * Get queue statistics
   */
  app.get(
    '/api/queue/stats',
    asyncHandler(async (request, reply) => {
      const { analysisQueue } = await import('../queue');

      const [waiting, active, completed, failed] = await Promise.all([
        analysisQueue.getWaitingCount(),
        analysisQueue.getActiveCount(),
        analysisQueue.getCompletedCount(),
        analysisQueue.getFailedCount(),
      ]);

      return reply.send({
        success: true,
        data: {
          waiting,
          active,
          completed,
          failed,
          total: waiting + active + completed + failed,
        },
      });
    })
  );
}
