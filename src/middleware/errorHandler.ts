import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@utils/ApiError';
import { error as OpenApiValidatorError } from 'express-openapi-validator';
// DomainError handling removed; only ApiError and OpenAPI errors are handled
import logger from '@utils/logger';

export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (
    err instanceof OpenApiValidatorError.BadRequest ||
    err instanceof OpenApiValidatorError.UnsupportedMediaType ||
    err instanceof OpenApiValidatorError.RequestEntityTooLarge ||
    err instanceof OpenApiValidatorError.MethodNotAllowed ||
    err instanceof OpenApiValidatorError.NotAcceptable ||
    err instanceof OpenApiValidatorError.NotFound ||
    err instanceof OpenApiValidatorError.Unauthorized ||
    err instanceof OpenApiValidatorError.Forbidden
  ) {
    statusCode = err.status || 400;
    message = err.message;
  }

  logger.error({
    message: err.message,
    stack: (err as Error)?.stack,
    statusCode,
  });

  // Only include stack traces and detailed errors in development
  const response: {
    success: boolean;
    message: string;
    stack?: string;
  } = {
    success: false,
    message: process.env.NODE_ENV === 'development' ? message : (statusCode === 500 ? 'Internal Server Error' : message),
  };

  // Never expose stack traces in production
  if (process.env.NODE_ENV === 'development') {
    if (err instanceof Error && err.stack) {
      response.stack = err.stack.toString();
    }
  }

  res.status(statusCode).json(response);
};
