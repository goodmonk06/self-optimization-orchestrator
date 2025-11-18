import { describe, it, expect } from 'vitest';
import {
  CreateRepoSchema,
  UpdateRepoSchema,
  RepoIdSchema,
  PaginationSchema,
} from '../validation';

describe('Validation Schemas', () => {
  describe('CreateRepoSchema', () => {
    it('should validate a valid repository creation input', () => {
      const input = {
        githubFullName: 'owner/repo-name',
        metaJson: { description: 'Test repo' },
      };

      const result = CreateRepoSchema.parse(input);
      expect(result).toEqual(input);
    });

    it('should reject invalid repository name format', () => {
      const input = {
        githubFullName: 'invalid-format',
      };

      expect(() => CreateRepoSchema.parse(input)).toThrow();
    });

    it('should allow optional metaJson', () => {
      const input = {
        githubFullName: 'owner/repo',
      };

      const result = CreateRepoSchema.parse(input);
      expect(result.githubFullName).toBe('owner/repo');
      expect(result.metaJson).toBeUndefined();
    });
  });

  describe('UpdateRepoSchema', () => {
    it('should validate a valid update input', () => {
      const input = {
        githubFullName: 'owner/new-name',
        metaJson: { stars: 100 },
      };

      const result = UpdateRepoSchema.parse(input);
      expect(result).toEqual(input);
    });

    it('should allow partial updates', () => {
      const input = {
        metaJson: { updated: true },
      };

      const result = UpdateRepoSchema.parse(input);
      expect(result.metaJson).toEqual({ updated: true });
      expect(result.githubFullName).toBeUndefined();
    });
  });

  describe('RepoIdSchema', () => {
    it('should validate a valid CUID', () => {
      const input = {
        id: 'clh1234567890abcdefghijk',
      };

      const result = RepoIdSchema.parse(input);
      expect(result.id).toBe(input.id);
    });

    it('should reject invalid CUID format', () => {
      const input = {
        id: 'invalid-id',
      };

      expect(() => RepoIdSchema.parse(input)).toThrow();
    });
  });

  describe('PaginationSchema', () => {
    it('should apply default values', () => {
      const result = PaginationSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should coerce string numbers', () => {
      const result = PaginationSchema.parse({
        page: '2',
        limit: '50',
      });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
    });

    it('should reject page 0 or negative', () => {
      expect(() => PaginationSchema.parse({ page: 0 })).toThrow();
      expect(() => PaginationSchema.parse({ page: -1 })).toThrow();
    });

    it('should reject limit over 100', () => {
      expect(() => PaginationSchema.parse({ limit: 101 })).toThrow();
    });
  });
});
