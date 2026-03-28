import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  RegisterSchemaReturn,
  RegisterCredentialDefinitionReturn,
  getUnqualifiedSchemaId,
  getUnqualifiedCredentialDefinitionId,
  parseIndyCredentialDefinitionId
} from '@credo-ts/anoncreds';
import { parseIndySchemaId } from '@credo-ts/anoncreds';
import * as QRCode from 'qrcode';
import { AutoAcceptCredential, CredentialExchangeRecord, CredentialsApi } from '@credo-ts/core';
import * as dotenv from 'dotenv';
import { CreateSchemaInput, CreateCredDefInput } from './dto/issuance-dto';
import { log } from 'console';
import { ShortUrlService } from 'src/short-url/short-url.service';
import { generateQRCode } from 'src/utils/qrcode';
import { CredoAgentService } from 'src/credo-agent/credo-agent.service';
dotenv.config();

@Injectable()
export class IssuanceService {
  constructor(
    private prisma: PrismaService,
    private credoAgentService: CredoAgentService,
    private readonly shortUrlService: ShortUrlService,
  ) { }

  async getOfferStatus(credentialExchangeId: string) {
    const agent = this.credoAgentService.getAgent();
 
    const credentialRecord = await agent.credentials.findById(credentialExchangeId);
 
    if (!credentialRecord) {
      return { state: 'not-found' };
    }

    const state = credentialRecord.state;

    return state;
  }


  async listSchemas() {
    return this.prisma.schema.findMany({
      include: {
        attributes: true,
        credentialDefinitions: true,
      },
      orderBy: { create_date: 'desc' },
    });
  }

  async listCredentialDefinitions() {
    return this.prisma.credentialDefinition.findMany({
      include: {
        schema: true, // include linked schema
      },
      orderBy: { create_date: 'desc' },
    });
  }

  async listSchemasPaginated(page: number = 1, limit: number = 10) {
    const [items, total] = await Promise.all([
      this.prisma.schema.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: {
          attributes: true,
          credentialDefinitions: true,
        },
        orderBy: { create_date: 'desc' },
      }),
      this.prisma.schema.count(),
    ]);

    return { items, total, page, limit };
  }

  async listCredentialDefinitionsPaginated(page: number = 1, limit: number = 10) {
    const [items, total] = await Promise.all([
      this.prisma.credentialDefinition.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: {
          schema: true,
        },
        orderBy: { create_date: 'desc' },
      }),
      this.prisma.credentialDefinition.count(),
    ]);

    return { items, total, page, limit };
  }


  async createSchema(input: CreateSchemaInput) {
    const agent = this.credoAgentService.getAgent();
    const issuerDid = this.credoAgentService.getIssuerDid();

    // Extract only attribute names for ledger
    const attrNames = input.attributes.map(a => a.attributeName);

    // Register schema on ledger
    const schemaResult = await agent.modules.anoncreds.registerSchema({
      schema: {
        name: input.name,
        version: input.version,
        attrNames,
        issuerId: issuerDid,
      },
      options: {},
    });

    if (schemaResult.schemaState.state === 'failed') {
      throw new Error(`Schema creation failed: ${schemaResult.schemaState.reason}`);
    }
    if (schemaResult.schemaState.state !== 'finished') {
      throw new Error('Unexpected schema registration state.');
    }

    const ledgerSchemaId = schemaResult.schemaState.schemaId!;

    // Convert into unqualified
    const indySchema = parseIndySchemaId(ledgerSchemaId);

    const unqualifiedSchemaId = await getUnqualifiedSchemaId(
      indySchema.namespaceIdentifier,
      indySchema.schemaName,
      indySchema.schemaVersion
    );

    // Save Schema in DB
    const createdSchema = await this.prisma.schema.create({
      data: {
        name: input.name,
        version: input.version,
        issuerId: issuerDid,
        schema_id: ledgerSchemaId,
        unqualified_schema_id: unqualifiedSchemaId,
      },
    });

    // Insert attributes WITH relation
    await this.prisma.attribute.createMany({
      data: input.attributes.map(attr => ({
        name: attr.attributeName,
        schemaDataType: attr.schemaDataType,
        displayName: attr.displayName,
        schemaId: createdSchema.id, // FK to Schema.id
      })),
    });

    return {
      schemaId: ledgerSchemaId,
      unqualifiedSchemaId,
      issuerDid,
    };
  }

  async createCredentialDefinition(input: CreateCredDefInput) {
    const agent = this.credoAgentService.getAgent();
    const issuerDid = this.credoAgentService.getIssuerDid();

    // Find schema by ledger schema_id (unique)
    const schema = await this.prisma.schema.findUnique({
      where: { schema_id: input.schemaId },
    });

    if (!schema) {
      throw new Error(`Schema with id ${input.schemaId} does not exist.`);
    }

    // Register credential definition on ledger
    const result = await agent.modules.anoncreds.registerCredentialDefinition({
      credentialDefinition: {
        schemaId: schema.schema_id,  // ⚠ ledger schemaId, NOT PK
        tag: input.tag,
        issuerId: issuerDid,
      },
      options: {
        supportRevocation: input.supportRevocation ?? false,
      },
    });

    if (result.credentialDefinitionState.state === 'failed') {
      throw new Error(`Cred def creation failed: ${result.credentialDefinitionState.reason}`);
    }
    if (result.credentialDefinitionState.state !== 'finished') {
      throw new Error('Unexpected credential definition registration state');
    }

    const fullCredDefId = result.credentialDefinitionState.credentialDefinitionId!;

    // Compute unqualified cred def id
    const indyCredDefId = parseIndyCredentialDefinitionId(fullCredDefId);

    const unqualifiedCredDefId = await getUnqualifiedCredentialDefinitionId(
      indyCredDefId.namespaceIdentifier,
      indyCredDefId.schemaSeqNo || schema.schema_id,
      indyCredDefId.tag
    );

    // Save to DB using NEW FK name = schemaId
    await this.prisma.credentialDefinition.create({
      data: {
        name: input.tag,
        issuerId: issuerDid,
        schemaId: schema.id,  // <-- NEW FIXED FIELD
        cred_def_id: fullCredDefId,
        unqualified_cred_def_id: unqualifiedCredDefId,
      },
    });

    return {
      credDefId: fullCredDefId,
      unqualifiedCredDefId,
      issuerDid,
    };
  }

  async offerCredentialWithUrl(input: {
    connectionId?: string;
    credentialDefinitionId: string;
    attributes?: { name: string; value: string }[];
    comment?: string;
  }) {
    const agent = this.credoAgentService.getAgent();

    console.log('🪪 Creating credential offer...');

    // Step 1️⃣ Create AFJ offer
    const { message, credentialRecord } = await (agent.credentials as any).createOffer({
      protocolVersion: process.env.CREDENTIAL_PROTOCOL_VERSION || 'v2',
      connectionId: input?.connectionId,
      credentialFormats: {
        anoncreds: {
          credentialDefinitionId: input.credentialDefinitionId,
          attributes: input.attributes || [],
        },
      },
    });

    // 🔍 Find the Cred-Def in DB
    const credDef = await this.prisma.credentialDefinition.findUnique({
      where: { cred_def_id: input.credentialDefinitionId }
    });

    if (!credDef) {
      throw new Error(`Credential Definition not found for ID: ${input.credentialDefinitionId}`);
    }

    // 🔍 Fetch linked Schema (IMPORTANT FIX)
    const schema = await this.prisma.schema.findUnique({
      where: { id: credDef.schemaId! }
    });

    if (!schema) {
      throw new Error(`Schema not found for cred-def ${credDef.id}`);
    }

    // 💾 Save in DB
    await this.prisma.credential.create({
      data: {
        credExId: credentialRecord.id,
        threadId: credentialRecord.threadId ?? '',
        credentialState: credentialRecord.state,
        schemaId: schema.id,  // ✅ FIXED — store DB Schema PK
        protocolVersion: credentialRecord.protocolVersion,
        connectionId: input.connectionId ?? '',
        issuerDid: this.credoAgentService.getIssuerDid(),
        credentialDefId: credDef.id,  // FK to credentialDefinition table
      }
    });

    // Create invitation
    const outOfBandRecord = await agent.oob.createInvitation({
      label: process.env.ISSUER_LABEL,
      handshake: false,
      messages: [message],
    });

    let invitationUrl = outOfBandRecord.outOfBandInvitation.toUrl({
      domain: process.env.AGENT_PUBLIC_URL || 'http://localhost:3021',
    });

    // Append `type=offer` manually
    invitationUrl = `${invitationUrl}&type=offer&label=${process.env.ISSUER_LABEL}`;

    const shortUrl = await this.shortUrlService.generateShortUrl(invitationUrl);
    const qrCodeDataUri = await generateQRCode(shortUrl);

    console.log('✅ Credential offer + invitation URL ready');

    return {
      invitationUrl,
      shortUrl,
      invitationQr: qrCodeDataUri,
      outOfBandId: outOfBandRecord.id,
      credentialExchangeId: credentialRecord.id,
      credentialAttributes: input.attributes,
      state: credentialRecord.state,
    };
  }

}
