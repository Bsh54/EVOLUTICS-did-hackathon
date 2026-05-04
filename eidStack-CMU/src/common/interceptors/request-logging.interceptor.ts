import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;
    const correlationId = req.correlationId || req.headers['x-correlation-id'] || null;

    const now = Date.now();
    return next.handle().pipe(
      tap(() => this.logger.log(`${correlationId || '-'} ${method} ${url} ${Date.now() - now}ms`)),
    );
  }
}