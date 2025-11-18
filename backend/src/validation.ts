import { z } from 'zod';

// Base response schemas
export const ApiSuccessSchema = z.object({
  success: z.literal(true),
  data: z.any().optional(),
});

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.any().optional(),
});

// Repository schemas
export const CreateRepoSchema = z.object({
  githubFullName: z.string().min(3).regex(/^[\w-]+\/[\w-]+$/, 'Must be in format: owner/repo'),
  metaJson: z.record(z.any()).optional(),
});

export const UpdateRepoSchema = z.object({
  githubFullName: z.string().min(3).regex(/^[\w-]+\/[\w-]+$/).optional(),
  metaJson: z.record(z.any()).optional(),
});

export const RepoIdSchema = z.object({
  id: z.string().cuid(),
});

// Analysis schemas
export const AnalysisIdSchema = z.object({
  id: z.string().cuid(),
});

export const CreateAnalysisSchema = z.object({
  repoId: z.string().cuid(),
});

// Query schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const RepoFilterSchema = z.object({
  status: z.enum(['analyzed', 'pending', 'all']).optional(),
  search: z.string().optional(),
});

// Type exports
export type CreateRepoInput = z.infer<typeof CreateRepoSchema>;
export type UpdateRepoInput = z.infer<typeof UpdateRepoSchema>;
export type RepoIdParam = z.infer<typeof RepoIdSchema>;
export type AnalysisIdParam = z.infer<typeof AnalysisIdSchema>;
export type PaginationQuery = z.infer<typeof PaginationSchema>;
export type RepoFilterQuery = z.infer<typeof RepoFilterSchema>;
