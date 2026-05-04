import { Controller, Get, Post, Body, Query, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { Request } from 'express';

import { IssuanceService } from './issuance.service';

import {
  CreateSchemaInput,
  CreateCredDefInput,
  PaginationDto,
} from './dto/issuance-dto';

import { handleController } from '../common/utils/handle.controller';
import { OfferCredentialWithUrlDto } from './dto/offer-credential-oob.dto';

@ApiTags('issuance')
@Controller('issuance')
export class IssuanceController {
  constructor(private readonly issuanceService: IssuanceService) {}

  // small helper to log sanitized errors and extract correlation id
  private sanitizeForLog(obj: any) {
    try {
      const seen = new WeakSet();
      return JSON.parse(JSON.stringify(obj, function (_k, v) {
        if (v && typeof v === 'object') {
          if (seen.has(v)) return '[Circular]';
          seen.add(v);
        }
        if (v instanceof Buffer) return '[Buffer]';
        if (typeof v === 'string' && v.length > 2000) return `[String ${v.length} chars]`;
        return v;
      }));
    } catch {
      return { note: 'failed to serialize' };
    }
  }

  private logError(correlationId: string | undefined, context: string, err: any) {
    const meta = {
      correlationId: correlationId || null,
      context,
      error: {
        message: err?.message ?? String(err),
        name: err?.name ?? null,
        // include `extra` if indy/indy-vdr returns it
        extra: (err as any)?.extra ?? null,
      },
    };
    console.error('IssuanceController error:', this.sanitizeForLog(meta));
    // Also print stack if available (sanitized)
    if (err?.stack) {
      console.error(err.stack);
    }
  }

  /**
     * GET /verification/proofStatus?proofRecordId=...
     * Keeps the original endpoint URL
     */
    @ApiOperation({ summary: 'Get proof/request status' })
    @ApiResponse({ status: 200, description: 'Proof state (string)' })
    @ApiBadRequestResponse({ description: 'Invalid credentialExchangeId' })
    @Get('offerStatus')
    async getOfferStatus(@Query('credentialExchangeId') credentialExchangeId: string) {
      return handleController(async () => {
        if (!credentialExchangeId) {
          // Throwing here ensures handleController will normalize to a BadRequest-like response
          throw new Error('credentialExchangeId is required');
        }
        const state = await this.issuanceService.getOfferStatus(credentialExchangeId);
        return state;
      });
    }

  // -------------------------------------------------------------------------
  // LIST SCHEMAS (NON-PAGINATED)
  // -------------------------------------------------------------------------
  @Get('listSchemas')
  @ApiOperation({ summary: 'List all schemas (non-paginated)' })
  @ApiResponse({ status: 200, description: 'Schemas returned successfully' })
  async listSchemas(@Req() req: Request) {
    const correlationId = req.headers['x-correlation-id'] as string | undefined;
    return handleController(async () => {
      try {
        const data = await this.issuanceService.listSchemas();
        return { success: true, data };
      } catch (err) {
        this.logError(correlationId, 'listSchemas', err);
        // safe message to client
        throw {
          statusCode: 500,
          message: 'Failed to list schemas',
          error: 'InternalServerError',
        };
      }
    });
  }

  // -------------------------------------------------------------------------
  // LIST SCHEMAS (PAGINATED)
  // -------------------------------------------------------------------------
  @Get('schemas')
  @ApiOperation({ summary: 'List schemas (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of schemas',
  })
  async listSchemasPaginated(
    @Req() req: Request,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const correlationId = req.headers['x-correlation-id'] as string | undefined;
    return handleController(async () => {
      try {
        const p = Number(page);
        const l = Number(limit);
        if (Number.isNaN(p) || Number.isNaN(l) || p < 1 || l < 1) {
          return { success: false, message: 'Invalid pagination parameters', statusCode: 400 };
        }
        const res = await this.issuanceService.listSchemasPaginated(p, l);
        return { success: true, data: res };
      } catch (err) {
        this.logError(correlationId, 'listSchemasPaginated', err);
        throw {
          statusCode: 500,
          message: 'Failed to fetch paginated schemas',
          error: 'InternalServerError',
        };
      }
    });
  }

  // -------------------------------------------------------------------------
  // LIST CREDENTIAL DEFINITIONS (PAGINATED)
  // -------------------------------------------------------------------------
  @Get('credential-definitions')
  @ApiOperation({ summary: 'List credential definitions (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of credential definitions',
  })
  async listCredentialDefinitionsPaginated(
    @Req() req: Request,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const correlationId = req.headers['x-correlation-id'] as string | undefined;
    return handleController(async () => {
      try {
        const p = Number(page);
        const l = Number(limit);
        if (Number.isNaN(p) || Number.isNaN(l) || p < 1 || l < 1) {
          return { success: false, message: 'Invalid pagination parameters', statusCode: 400 };
        }

        const res = await this.issuanceService.listCredentialDefinitionsPaginated(p, l);
        return { success: true, data: res };
      } catch (err) {
        this.logError(correlationId, 'listCredentialDefinitionsPaginated', err);
        throw {
          statusCode: 500,
          message: 'Failed to fetch paginated credential definitions',
          error: 'InternalServerError',
        };
      }
    });
  }

  // -------------------------------------------------------------------------
  // CREATE SCHEMA
  // -------------------------------------------------------------------------
  @Post('schemas')
  @ApiOperation({ summary: 'Create a new schema' })
  @ApiBody({ type: CreateSchemaInput })
  @ApiResponse({
    status: 201,
    description: 'Schema created successfully',
  })
  async createSchema(@Req() req: Request, @Body() body: CreateSchemaInput) {
    const correlationId = req.headers['x-correlation-id'] as string | undefined;
    return handleController(async () => {
      try {
        if (!body || !body.name || !body.version || !Array.isArray(body.attributes)) {
          return { success: false, message: 'Invalid schema payload', statusCode: 400 };
        }
        const res = await this.issuanceService.createSchema(body);
        return { success: true, data: res, statusCode: 201 };
      } catch (err) {
        this.logError(correlationId, 'createSchema', err);
        // If the service threw a known HttpException-style, return it; otherwise return generic 500
        throw {
          statusCode: 500,
          message: 'Failed to create schema',
          error: 'InternalServerError',
        };
      }
    });
  }

  // -------------------------------------------------------------------------
  // CREATE CREDENTIAL DEFINITION
  // -------------------------------------------------------------------------
  @Post('credential-definitions')
  @ApiOperation({ summary: 'Create a new credential definition' })
  @ApiBody({ type: CreateCredDefInput })
  @ApiResponse({
    status: 201,
    description: 'Credential definition created successfully',
  })
  async createCredentialDefinition(@Req() req: Request, @Body() body: CreateCredDefInput) {
    const correlationId = req.headers['x-correlation-id'] as string | undefined;
    return handleController(async () => {
      try {
        if (!body || !body.schemaId || !body.tag) {
          return { success: false, message: 'Invalid credential definition payload', statusCode: 400 };
        }
        const res = await this.issuanceService.createCredentialDefinition(body);
        return { success: true, data: res, statusCode: 201 };
      } catch (err) {
        this.logError(correlationId, 'createCredentialDefinition', err);
        throw {
          statusCode: 500,
          message: 'Failed to create credential definition',
          error: 'InternalServerError',
        };
      }
    });
  }

  // -------------------------------------------------------------------------
  // OFFER CREDENTIAL OOB
  // -------------------------------------------------------------------------
  @Post('offer')
  @ApiOperation({ summary: 'Offer credential (Out-of-Band)' })
  @ApiBody({ type: OfferCredentialWithUrlDto })
  @ApiResponse({
    status: 201,
    description: 'Credential offer created successfully',
  })
  async offerCredentialWithUrl(@Req() req: Request, @Body() body: OfferCredentialWithUrlDto) {
    const correlationId = req.headers['x-correlation-id'] as string | undefined;
    return handleController(async () => {
      try {
        if (!body || !body.credentialDefinitionId) {
          return { success: false, message: 'Missing credentialDefinitionId', statusCode: 400 };
        }

        const res = await this.issuanceService.offerCredentialWithUrl({
          credentialDefinitionId: body.credentialDefinitionId,
          connectionId: body.connectionId,
          attributes: body.attributes,
          comment: body.comment,
        });

        return { success: true, data: res, statusCode: 201 };
      } catch (err: any) {
        this.logError(correlationId, 'offerCredentialWithUrl', err);
        throw {
          statusCode: 500,
          message: err.message || 'Failed to create credential offer',
          error: 'InternalServerError',
        };
      }
    });
  }
}
