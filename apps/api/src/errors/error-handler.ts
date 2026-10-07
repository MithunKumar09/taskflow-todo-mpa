import type { FastifyInstance } from 'fastify';
import { AppError } from './app-error.js';

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    let statusCode = 500;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Something went wrong. Please try again.';
    let details: AppError['details'] = [];
    if (error instanceof AppError) {
      statusCode = error.code === 'TODO_NOT_FOUND' ? 404 : 400;
      ({ code, message, details } = error);
    } else if (
      error instanceof Error &&
      'statusCode' in error &&
      typeof error.statusCode === 'number' &&
      error.statusCode >= 400 &&
      error.statusCode < 500
    ) {
      statusCode = error.statusCode;
      code =
        statusCode === 429
          ? 'RATE_LIMITED'
          : statusCode === 413
            ? 'PAYLOAD_TOO_LARGE'
            : statusCode === 415
              ? 'UNSUPPORTED_MEDIA_TYPE'
              : 'INVALID_REQUEST';
      message =
        statusCode === 429
          ? 'Too many requests. Please wait and try again.'
          : statusCode === 413
            ? 'Request body is too large.'
            : 'The request could not be accepted.';
    }
    if (statusCode >= 500) request.log.error({ err: error }, 'Unexpected request failure');
    return reply
      .code(statusCode)
      .send({ error: { code, message, details, requestId: request.id } });
  });
  app.setNotFoundHandler((request, reply) =>
    reply.code(404).send({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'Endpoint not found.',
        details: [],
        requestId: request.id,
      },
    }),
  );
}
