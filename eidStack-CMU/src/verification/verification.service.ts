import { Injectable } from '@nestjs/common';
import { CredoAgentService } from 'src/credo-agent/credo-agent.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AutoAcceptProof } from '@credo-ts/core';
import { ShortUrlService } from 'src/short-url/short-url.service';
import { generateQRCode } from 'src/utils/qrcode';

@Injectable()
export class VerificationService {
  constructor(
    private readonly credoAgentService: CredoAgentService,
    private readonly prisma: PrismaService,
    private readonly shortUrlService: ShortUrlService,
  ) { }

  // async getProofStatus(proofRecordId: string) {
  //   const agent = this.credoAgentService.getAgent();
  //   const proof = await agent.proofs.findById(proofRecordId);
  //   return proof?.state;
  // }

  async getProofStatus(proofRecordId: string) {
    const agent = this.credoAgentService.getAgent();
 
    const proofRecord = await agent.proofs.findById(proofRecordId);
 
    if (!proofRecord) {
      return { state: 'not-found', email: null };
    }
 
    const state = proofRecord.state;
 
    if (!['presentation-received', 'done', 'verified'].includes(state)) {
      return { state, email: null };
    }
 
    let email: string | null = null;
 
    const formatData = await agent.proofs.getFormatData(proofRecordId);
 
    const presentation: any = formatData.presentation;
    const request: any = formatData.request;
 
    const revealedAttrs =
      presentation?.anoncreds?.requested_proof?.revealed_attrs;
 
    const requestedAttrs =
      request?.anoncreds?.requested_attributes;
 
    // 🔥 map attr_x → attribute name
    for (const [key, attr] of Object.entries(requestedAttrs ?? {})) {
      if ((attr as any).name === 'email') {
        email = revealedAttrs?.[key]?.raw ?? null;
        break;
      }
    }
 
    return {
      state,
      email,
    };
  }

  /**
   * Create a proof request (connection-based or connectionless)
   */
  async createProofRequest(input: {
    connectionId?: string;
    credDefId: string;
    attributes: { name: string; restrictions?: any }[];
    predicates?: { name: string; pType: string; pValue: number }[];
    comment?: string;
  }) {
    const agent = this.credoAgentService.getAgent();
    // 1️⃣ Create proof request
    const { message, proofRecord } = await agent.proofs.createRequest({
      protocolVersion: 'v2',
      proofFormats: {
        anoncreds: {
          name: 'Verification Request',
          version: '1.0',
          requested_attributes: Object.fromEntries(
            input.attributes.map((attr, i) => [
              `attr_${i}`,
              { name: attr.name, restrictions: attr.restrictions ?? [] },
            ])
          ),
          requested_predicates: Object.fromEntries(
            (input.predicates ?? []).map((pred, i) => [
              `pred_${i}`,
              { name: pred.name, p_type: pred.pType, p_value: pred.pValue },
            ])
          ),
        },
      },
      comment: input.comment ?? 'Please verify credentials',
    });
    // 2️⃣ Store proof record in DB
    await this.prisma.proof.create({
      data: {
        proofRecordId: proofRecord.id,
        orgDid: this.credoAgentService.getIssuerDid(),
        holderDid: '',
        state: proofRecord.state,
        credDefId: input.credDefId,
        threadDid: proofRecord.threadId ?? '',
      },
    });
    // 3️⃣ Create OOB invitation
    const oob = await agent.oob.createInvitation({
      label: process.env.VERIFIER_LABEL || 'e-ID Verification Request',
      handshake: false,
      messages: [message],
    });

    // 🔗 4️⃣ Generate URL + Add custom metadata "type=proof"
    let invitationUrl = oob.outOfBandInvitation.toUrl({
      domain: process.env.AGENT_PUBLIC_URL || 'http://localhost:3021',
    });

    // Append `type=proof` manually
    invitationUrl = `${invitationUrl}&type=proof&label=${process.env.VERIFIER_LABEL}`;

    const shortUrl = await this.shortUrlService.generateShortUrl(invitationUrl);
    const qrCodeDataUri = await generateQRCode(shortUrl);

    return {
      invitationUrl,
      shortUrl,
      verificationQr: qrCodeDataUri,
      outOfBandId: oob.id,
      proofRecordId: proofRecord.id,
      state: proofRecord.state,
    };
  }

}