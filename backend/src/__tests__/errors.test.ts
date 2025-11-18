import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  ValidationError,
  BadRequestError,
  ConflictError,
  InternalError,
} from '../errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with correct properties', () => {
      const error = new AppError(400, 'Test error', { field: 'value' });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Test error');
      expect(error.details).toEqual({ field: 'value' });
      expect(error.name).toBe('AppError');
    });
  });

  describe('NotFoundError', () => {
    it('should create 404 error', () => {
      const error = new NotFoundError('Repository', 'repo123');

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Repository with id repo123 not found');
      expect(error.name).toBe('NotFoundError');
    });

    it('should work without ID', () => {
      const error = new NotFoundError('Repository');

      expect(error.message).toBe('Repository not found');
    });
  });

  describe('ValidationError', () => {
    it('should create 400 validation error', () => {
      const details = [{ field: 'email', message: 'Invalid email' }];
      const error = new ValidationError('Validation failed', details);

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Validation failed');
      expect(error.details).toEqual(details);
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('BadRequestError', () => {
    it('should create 400 bad request error', () => {
      const error = new BadRequestError('Invalid input');

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
      expect(error.name).toBe('BadRequestError');
    });
  });

  describe('ConflictError', () => {
    it('should create 409 conflict error', () => {
      const error = new ConflictError('Resource already exists');

      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Resource already exists');
      expect(error.name).toBe('ConflictError');
    });
  });

  describe('InternalError', () => {
    it('should create 500 internal error', () => {
      const error = new InternalError('Something went wrong');

      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Something went wrong');
      expect(error.name).toBe('InternalError');
    });
  });
});
