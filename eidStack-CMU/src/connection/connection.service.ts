import { ConnectionEventTypes, ConnectionStateChangedEvent, DidExchangeState } from '@credo-ts/core';
import { PrismaService } from 'src/prisma/prisma.service'; // assuming this exists
import { Injectable } from '@nestjs/common';
import { generateQRCode } from 'src/utils/qrcode';
import { ShortUrlService } from 'src/short-url/short-url.service';
import * as dotenv from 'dotenv';
import { setOutOfBandId } from './connection-state.store';
import { CredoAgentService } from 'src/credo-agent/credo-agent.service';
dotenv.config();

@Injectable()
export class ConnectionService {
  constructor(
    private readonly credoAgentService: CredoAgentService,
    private readonly prisma: PrismaService,
    private readonly shortUrlService: ShortUrlService,
  ) { }

  async createConnectionInvitation() {
    const agent = this.credoAgentService.getAgent();    
    const outOfBandRecord = await agent.oob.createInvitation();
    setOutOfBandId(outOfBandRecord.id);  // ⭐ store id globally
    const outOfBandInvitation = outOfBandRecord.outOfBandInvitation;

    if (!outOfBandInvitation) throw new Error('Failed to create Out-of-Band invitation');

    let invitationUrl = outOfBandInvitation.toUrl({
      domain: process.env.AGENT_PUBLIC_URL || 'http://localhost:3021',//'https://example.com', 
    });

    let label = outOfBandInvitation.label;
    
    // Append `type=connection` manually
    invitationUrl = `${invitationUrl}&type=connection`;
 
    const shortUrl = await this.shortUrlService.generateShortUrl(invitationUrl);
    const qrCodeDataUri = await generateQRCode(shortUrl);

    return { invitationUrl, shortUrl, qrCodeDataUri };
  }
}
