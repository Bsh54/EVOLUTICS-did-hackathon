import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CredoAgentService } from './credo-agent.service';
import { InitAgentDto } from './dto/initAgent.dto';
import { ReceiveInvitationDto } from './dto/receiveInvitation.dto';

/**
 * CredoAgentController
 *
 * IMPORTANT:
 * - Do NOT return internal library objects (Agent, Subscriber, Subscription, streams) directly to the client.
 * - Return only JSON-safe primitives and simple objects.
 * - If you need additional debugging information, include only small, explicit primitive fields in non-production mode.
 */
@ApiTags('credo-agent')
@Controller('credo-agent')
export class CredoAgentController {
  private readonly logger = new Logger(CredoAgentController.name);

  constructor(private readonly credoAgentService: CredoAgentService) { }

  /**
   * Initialize an agent on the server.
   * The service creates and keeps the agent instance internally — we don't return it.
   */
  @Post('initAgent')
  @ApiOperation({ summary: 'initializeAgent' })
  @ApiResponse({ status: 201, description: 'Agent initialized' })
  @HttpCode(HttpStatus.CREATED)
  async initAgent(@Body() body: InitAgentDto) {
    try {
      // Create the agent and register it inside the service
      const result = await this.credoAgentService.initializeAgent(body);

      // Prefer explicit DID returned from the service result when available
      const issuerDid =
        (result && (result as any).did) ??
        (typeof this.credoAgentService.getIssuerDid === 'function'
          ? (() => {
            try {
              return this.credoAgentService.getIssuerDid();
            } catch {
              return null;
            }
          })()
          : null);

      const responseBody: Record<string, any> = {
        message: 'Agent initialized',
        issuerDid: issuerDid ?? undefined,
      };

      // In non-production mode include a tiny, explicit debug object (only primitives)
      if (process.env.NODE_ENV !== 'production') {
        // Include minimal server-side status info — do NOT include the agent object itself
        responseBody.debug = {
          created: !!result,
          hasIssuerDid: !!issuerDid,
        };
      }

      return responseBody;
    } catch (err) {
      // Let the global exception filter handle formatting/logging
      this.logger.error('initAgent failed', (err as any)?.stack ?? String(err));
      throw err;
    }
  }

  /**
   * Receive and process an out-of-band invitation.
   * Map the raw library response to a small safe object.
   */
  @Post('receiveInvitation')
  @ApiOperation({ summary: 'Receive OOB invitation URL and process' })
  @ApiResponse({ status: 200, description: 'Invitation processed' })
  async receiveInvitation(@Body() body: ReceiveInvitationDto) {
    try {
      const res = await this.credoAgentService.receiveInvitation(body.invitationUrl);

      // `res` may be a complex object. Extract only safe primitive identifiers if present.
      let id: string | undefined;
      try {
        if (res && typeof res === 'object') {
          // common safe id-like fields if present
          if ('id' in res && typeof (res as any).id === 'string') id = (res as any).id;
          else if ('invitationId' in res && typeof (res as any).invitationId === 'string')
            id = (res as any).invitationId;
          else if ('connectionId' in res && typeof (res as any).connectionId === 'string')
            id = (res as any).connectionId;
        }
      } catch {
        // ignore any unexpected structure
        id = undefined;
      }

      const payload: Record<string, any> = {
        success: true,
        message: 'Invitation processed',
      };

      if (id) payload.id = id;

      // optional debug info only in non-production
      if (process.env.NODE_ENV !== 'production') {
        payload.debug = {
          rawType: res && typeof res === 'object' ? (res as any).constructor?.name ?? 'object' : typeof res,
        };
      }

      return payload;
    } catch (err) {
      this.logger.error('receiveInvitation failed', (err as any)?.stack ?? String(err));
      throw err;
    }
  }

  /**
   * Get the issuer DID (safe primitive).
   */
  @Get('getIssuerDid')
  @ApiOperation({ summary: 'Get issuer DID' })
  @ApiResponse({ status: 200, description: 'Issuer DID' })
  async getIssuerDid() {
    try {
      const did = this.credoAgentService.getIssuerDid();
      return { issuerDid: did };
    } catch (err) {
      // If not initialized or other error occurs, bubble to global exception filter
      this.logger.warn('getIssuerDid failed or agent not initialized');
      throw err;
    }
  }

  /**
   * Get a small sanitized agent status.
   * This endpoint DOES NOT return the agent object itself.
   */
  @Get('getAgent')
  @ApiOperation({ summary: 'Get agent status (sanitized)' })
  @ApiResponse({ status: 200, description: 'Agent status (sanitized)' })
  async getAgent() {
    try {
      // Do not call getAgent() and return its object. Instead, query for minimal safe status.
      let issuerDid: string | null = null;
      try {
        issuerDid = this.credoAgentService.getIssuerDid();
      } catch {
        issuerDid = null;
      }

      // Check whether the service has an internal agent (truthy check only)
      const isInitialized = !!((this.credoAgentService as any).agent);

      const payload: Record<string, any> = {
        initialized: isInitialized,
        issuerDid: issuerDid ?? undefined,
        message: isInitialized
          ? 'Agent is initialized on server (internal object omitted from response).'
          : 'Agent not initialized',
      };

      // Small non-production extra info: note constructor name only (primitive)
      if (process.env.NODE_ENV !== 'production') {
        payload.debug = {
          // do not access internal object's properties; only expose whether it exists
          agentPresent: isInitialized,
        };
      }

      return payload;
    } catch (err) {
      this.logger.error('getAgent failed', (err as any)?.stack ?? String(err));
      throw err;
    }
  }


  @Get('did')
  @ApiOperation({ summary: 'Get agent DID' })
  @ApiResponse({ status: 200, description: 'Agent DID returned' })
  async getAgentDid() {
    try {
      const agent = this.credoAgentService.getAgent();
      const dids = await agent.dids.getCreatedDids();
      const did = dids?.[0]?.did ?? 'No DID found';
      return { did };
    } catch (err) {
      this.logger.error('getAgentDid failed', (err as any)?.stack ?? String(err));
      throw err;
    }
  }
}
