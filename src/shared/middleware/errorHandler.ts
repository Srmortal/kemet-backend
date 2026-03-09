import type { NextFunction, Request, Response } from "express";
import { error as OpenApiValidatorError } from "express-openapi-validator";
import { ApiError } from "#app/shared/utils/core/ApiError.js";
import logger from "#app/shared/utils/metrics/logger.js";

export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = "Internal Server Error";

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
    ...(err instanceof Error && err.stack ? { stack: err.stack } : {}),
    statusCode,
  });

  // Only include stack traces and detailed errors in development
  const isDevelopment = process.env.NODE_ENV === "development";
  const isServerError = statusCode === 500;
  const shouldHideSensitiveError = !isDevelopment && isServerError;
  const responseMessage = shouldHideSensitiveError
    ? "Internal Server Error"
    : message;

  const response: {
    success: boolean;
    message: string;
    stack?: string;
  } = {
    success: false,
    message: responseMessage,
  };

  // Never expose stack traces in production
  if (
    process.env.NODE_ENV === "development" &&
    err instanceof Error &&
    err.stack
  ) {
    response.stack = err.stack.toString();
  }

  res.status(statusCode).json(response);
};
