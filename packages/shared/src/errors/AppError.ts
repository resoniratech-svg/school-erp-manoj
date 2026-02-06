export interface ErrorDetails {
  [key: string]: unknown;
}

export interface SerializedError {
  name: string;
  message: string;
  code: string;
  statusCode: number;
  details?: ErrorDetails;
  stack?: string;
}

export abstract class AppError extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly code: string;
  public readonly isOperational: boolean = true;
  public readonly details?: ErrorDetails;
  public readonly timestamp: string;

  constructor(message: string, details?: ErrorDetails) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON(): SerializedError {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      ...(this.details && { details: this.details }),
      ...(process.env.NODE_ENV !== 'production' && { stack: this.stack }),
    };
  }

  public static isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
  }
}
