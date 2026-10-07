export type ErrorCode = 'VALIDATION_ERROR' | 'TODO_NOT_FOUND';
export interface ErrorDetail {
  field: string;
  message: string;
}
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details: ErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'AppError';
  }
}
