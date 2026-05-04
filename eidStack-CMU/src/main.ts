import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Use correlation id middleware
  app.use(new CorrelationIdMiddleware().use);

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    errorHttpStatusCode: 400,
  }));

  // Global exception filter & interceptor
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new RequestLoggingInterceptor());

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('e-ID REST API')
    .setDescription('REST APIs converted from GraphQL')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Ensure ErrorResponse model is present
  (document.components = document.components || {});
  (document.components.schemas = document.components.schemas || {});
  document.components.schemas['ErrorResponse'] = {
    type: 'object',
    properties: {
      correlationId: { type: 'string' },
      statusCode: { type: 'integer', format: 'int32' },
      error: { type: 'string' },
      message: { oneOf: [{ type: 'string' }, { type: 'array' }, { type: 'object' }] },
    },
  };

  // Add common error responses to operations
  if (document.paths) {
    for (const p of Object.keys(document.paths)) {
      const methods = document.paths[p];
      for (const m of Object.keys(methods)) {
        const op = methods[m];
        op.responses = op.responses || {};
        const commonErrors = {
          '400': { description: 'Bad Request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '403': { description: 'Forbidden', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '404': { description: 'Not Found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '429': { description: 'Too Many Requests', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '500': { description: 'Internal Server Error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        };
        for (const code of Object.keys(commonErrors)) {
          if (!op.responses[code]) op.responses[code] = commonErrors[code];
        }
      }
    }
  }



  // Write OpenAPI files (safe)
  const outDir = path.join(process.cwd(), 'openapi');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  // Safe stringify to avoid "Converting circular structure to JSON"
  function safeStringify(obj: any, space = 2) {
    const seen = new WeakSet();
    return JSON.stringify(obj, function (_key, value) {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
      }
      return value;
    }, space);
  }

  // Only attempt JSON output in non-production (optional)
  if (process.env.NODE_ENV !== 'production') {
    try {
      fs.writeFileSync(path.join(outDir, 'openapi.json'), safeStringify(document, 2), 'utf8');
    } catch (err) {
      // Log but don't crash startup when OpenAPI JSON cannot be written
      console.warn('Failed to write openapi.json:', err?.message ?? err);
    }
  }

  // YAML output (still useful / human readable)
  try {
    fs.writeFileSync(path.join(outDir, 'openapi.yaml'), yaml.dump(document), 'utf8');
  } catch (err) {
    console.warn('Failed to write openapi.yaml:', err?.message ?? err);
  }

  // main.ts mein - yaml write ke baad yeh add karo
  const docsPublicDir = path.join(process.cwd(), 'docs', 'public');
  if (fs.existsSync(docsPublicDir)) {
    fs.copyFileSync(
      path.join(outDir, 'openapi.yaml'),
      path.join(docsPublicDir, 'openapi.yaml')
    );
  }

  SwaggerModule.setup('api/docs', app, document);


  app.getHttpAdapter().get('/api/docs-json', (req, res) => {
    res.sendFile(path.join(outDir, 'openapi.json'));
  });
  app.getHttpAdapter().get('/api/docs-yaml', (req, res) => {
    res.sendFile(path.join(outDir, 'openapi.yaml'));
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`Server listening on 0.0.0.0:${port}`);
}
bootstrap();