import { Injectable } from '@nestjs/common';
import axios from 'axios';
import {
  Agent,
  ConnectionsModule,
  InitConfig,
  ConsoleLogger,
  LogLevel,
  HttpOutboundTransport,
  WsOutboundTransport,
  DidsModule,
  TypedArrayEncoder,
  KeyType,
  CredentialsModule,
  ProofsModule,
  V2CredentialProtocol,
  V2ProofProtocol,
} from '@credo-ts/core';

import { agentDependencies, HttpInboundTransport } from '@credo-ts/node';
import { AskarModule } from '@credo-ts/askar';

import {
  IndyVdrModule,
  IndyVdrAnonCredsRegistry,
  IndyVdrIndyDidRegistrar,
  IndyVdrIndyDidResolver,
} from '@credo-ts/indy-vdr';

import {
  AnonCredsModule,
  LegacyIndyCredentialFormatService,
  LegacyIndyProofFormatService,
  AnonCredsCredentialFormatService,
  AnonCredsProofFormatService,
} from '@credo-ts/anoncreds';

import { ariesAskar } from '@hyperledger/aries-askar-nodejs';
import { indyVdr } from '@hyperledger/indy-vdr-nodejs';
import { anoncreds } from '@hyperledger/anoncreds-nodejs';

import * as dotenv from 'dotenv';
import { PrismaService } from 'src/prisma/prisma.service';
import { CredoEventsService } from './credo-events.service';

dotenv.config();

@Injectable()
export class CredoAgentService {
  private agent: Agent | null = null;
  private issuerDid: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: CredoEventsService
  ) {}

  // ---------------------------------------------------------
  // INIT AGENT
  // ---------------------------------------------------------
  async initializeAgent(input: {
    walletId: string;
    walletKey: string;
    endpoint: string;
    label: string;
    seed: string;
  }) {
    if (this.agent) return this.agent;

    const { walletId, walletKey, endpoint, label, seed } = input;

    // Dynamic genesis load
    const genesisTxn = await axios
      .get('https://test.bcovrin.vonx.io/genesis')
      .then((r) => r.data);
      
    const config: InitConfig = {
      label,
      walletConfig: { id: walletId, key: walletKey },
      endpoints: [endpoint],
      logger: new ConsoleLogger(LogLevel.info),
    };

    const didsModule = new DidsModule({
      registrars: [new IndyVdrIndyDidRegistrar()],
      resolvers: [new IndyVdrIndyDidResolver()],
    });

    // Build agent
    const agent = new Agent({
      config,
      dependencies: agentDependencies,
      modules: {
        indyVdr: new IndyVdrModule({
          indyVdr,
          networks: [
            {
                indyNamespace: process.env.INDY_NETWORK_NAMESPACE,
                genesisTransactions: genesisTxn.toString(),
                connectOnStartup: true,
                isProduction: false
            },
          ],
        }),

        anoncreds: new AnonCredsModule({
          registries: [new IndyVdrAnonCredsRegistry()],
          anoncreds,
        }),

        askar: new AskarModule({ ariesAskar }),

        connections: new ConnectionsModule({
          autoAcceptConnections: true,
        }),

        dids: didsModule,

        credentials: new CredentialsModule({
          credentialProtocols: [
            new V2CredentialProtocol({
              credentialFormats: [
                new LegacyIndyCredentialFormatService(),
                new AnonCredsCredentialFormatService(),
              ],
            }),
          ],
        }),

        proofs: new ProofsModule({
          proofProtocols: [
            new V2ProofProtocol({
              proofFormats: [
                new LegacyIndyProofFormatService(),
                new AnonCredsProofFormatService(),
              ],
            }),
          ],
        }),
      },
    });

    // Transports
    agent.registerInboundTransport(
      new HttpInboundTransport({ port: parseInt(process.env.AGENT_PORT) || 3021 })
    );
    agent.registerOutboundTransport(new HttpOutboundTransport());
    agent.registerOutboundTransport(new WsOutboundTransport());

    await agent.initialize();
    this.agent = agent;

    // DID Registration
    const did = await this.registerBcovrinDid(agent, seed);
    this.issuerDid = `did:indy:bcovrin:test:${did}`;
    console.log('✅ Credo Agent DID registered:', this.issuerDid);

    // ---------------------------------------------------------
    // AUTO MEDIATOR CONNECTION (NEW)
    // ---------------------------------------------------------
    await this.connectToMediator(agent);

    // Register events (single call)
    this.eventsService.registerEventHandlers(agent);

    return { agent, did: this.issuerDid };
  }

  // ---------------------------------------------------------
  // AUTO CONNECT MEDIATOR
  // ---------------------------------------------------------
  private async connectToMediator(agent: Agent) {
    console.log("🔗 Connecting to mediator...");

    const resp = await axios.post(
      "https://polyid-mediator.onrender.com/createMediatorInvitation"
    );
    
    const mediatorUrl = resp.data.url;

    const oob = await agent.oob.receiveInvitationFromUrl(mediatorUrl);

    console.log("🎉 Agent connected to mediator automatically! ");
    return oob;
  }

  /**
   * Register a DID on the BCovrin test ledger using seed.
   */
  private async registerBcovrinDid(agent: Agent, seed: string): Promise<string> {

    interface BcovrinResponse {
      did: string;
      verkey?: string;
      role?: string;
    }
    try {
      console.log('🔄 Registering DID on BCovrin with ENDORSER role...');

      const response = await axios.post<BcovrinResponse>(process.env.BCOVRIN_TESTNET_URL, {
        role: 'ENDORSER',
        alias: 'eID-Backend-Agent',
        seed,
      });

      if (response.data && response.data.did) {
        console.log('✅ DID registered on BCovrin:', response.data.did);

        // Log the full response to see what BCovrin returned
        console.log('📋 BCovrin response:', JSON.stringify(response.data, null, 2));

        // Warning if role is not explicitly confirmed
        if (!response.data.role || response.data.role !== 'ENDORSER') {
          console.warn('⚠️  WARNING: BCovrin may not have granted ENDORSER role!');
          console.warn('⚠️  If schema creation fails, manually register this DID with ENDORSER role at:');
          console.warn('⚠️  http://test.bcovrin.vonx.io/');
          console.warn('⚠️  Seed:', seed);
          console.warn('⚠️  DID:', response.data.did);
        }

        // Import the DID into the wallet with private key
        await agent.dids.import({
          did: `did:indy:bcovrin:test:${response.data.did}`,
          overwrite: true,
          privateKeys: [
            {
              keyType: KeyType.Ed25519,
              privateKey: TypedArrayEncoder.fromString(seed),
            },
          ],
        });

        return response.data.did;
      } else {
        throw new Error('Invalid response from BCovrin registration API');
      }
    } catch (err: any) {
      console.error('❌ Failed to register DID on BCovrin:', err.message);
      console.error('💡 Try manually registering at: http://test.bcovrin.vonx.io/');
      console.error('💡 Seed:', seed);
      throw err;
    }
  }


/**
   * Receive an OOB invitation (for connection)
   */
  async receiveInvitation(invitationUrl: string) {
    if (!this.agent) throw new Error('Agent not initialized');
    const res = await this.agent.oob.receiveInvitationFromUrl(invitationUrl);
    return res;
  } 

  getAgent() {
    if (!this.agent) throw new Error('Agent not initialized');
    return this.agent;
  }

  getIssuerDid() {
    if (!this.issuerDid) throw new Error('Issuer DID not set');
    return this.issuerDid;
  }
}
