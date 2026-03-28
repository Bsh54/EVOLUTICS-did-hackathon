import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import util from 'util';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId = (request as any).correlationId || request.headers['x-correlation-id'] || null;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorName = 'InternalServerError';
    let message: any = 'Internal server error';

    // Normalize known error shapes
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const excRes = exception.getResponse();
      if (typeof excRes === 'string') {
        message = excRes;
        errorName = (exception as any).name || 'HttpException';
      } else if (typeof excRes === 'object' && excRes !== null) {
        errorName = (excRes as any).error || (exception as any).name || errorName;
        message = (excRes as any).message ?? (excRes as any).msg ?? message;
      }
    } else if (exception instanceof Error) {
      errorName = (exception as any).name || errorName;
      message = exception.message || message;
    } else if (typeof exception === 'string') {
      message = exception;
      errorName = 'Error';
    } else if (exception && typeof exception === 'object') {
      const maybe = exception as any;
      errorName = maybe.name || maybe.constructor?.name || errorName;
      message = maybe.message ?? maybe.error ?? message;
    }

    // Safe payload: do NOT include the raw exception object (may contain circular references)
    const payload = {
      correlationId: correlationId,
      statusCode: status,
      error: String(errorName),
      message: message,
    };

    // Safe logging: use util.inspect instead of JSON.stringify which throws on circular refs
    try {
      this.logger.error(
        `${correlationId || '-'} - ${request.method} ${request.url} - ${status} - ${String(message)}`,
        util.inspect(exception, { depth: 4, breakLength: 120 })
      );
    } catch (logErr) {
      this.logger.error(`${correlationId || '-'} - ${request.method} ${request.url} - ${status} - (failed to inspect exception)`);
    }

    if (correlationId) {
      response.setHeader('X-Correlation-ID', correlationId);
    }

    response.status(status).json(payload);
  }
}
