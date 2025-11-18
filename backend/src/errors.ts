import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(404, `${resource}${id ? ` with id ${id}` : ''} not found`);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, details);
    this.name = 'ValidationError';
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, details);
    this.name = 'BadRequestError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(409, message, details);
    this.name = 'ConflictError';
  }
}

export class InternalError extends AppError {
  constructor(message: string, details?: any) {
    super(500, message, details);
    this.name = 'InternalError';
  }
}

/**
 * Centralized error handler for Fastify
 */
export function errorHandler(
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log error for debugging
  console.error('Error:', {
    name: error.name,
    message: error.message,
    path: request.url,
    method: request.method,
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      error: 'Validation failed',
      details: error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      })),
    });
  }

  // Handle custom AppError instances
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: error.message,
      details: error.details,
    });
  }

  // Handle Fastify errors
  if ('statusCode' in error && typeof error.statusCode === 'number') {
    return reply.status(error.statusCode).send({
      success: false,
      error: error.message,
    });
  }

  // Handle unknown errors
  console.error('Unhandled error:', error);
  return reply.status(500).send({
    success: false,
    error: 'Internal server error',
  });
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler<T>(
  handler: (request: FastifyRequest, reply: FastifyReply) => Promise<T>
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      return await handler(request, reply);
    } catch (error) {
      throw error; // Let errorHandler handle it
    }
  };
}
