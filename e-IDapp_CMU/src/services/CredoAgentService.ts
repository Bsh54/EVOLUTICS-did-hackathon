import {
  Agent,
  InitConfig,
  ConnectionsModule,
  DidsModule,
  HttpOutboundTransport,
  WsOutboundTransport,
  ConsoleLogger,
  LogLevel,
  WalletConfig,
  OutOfBandModule,
  CredentialsModule,
  AutoAcceptCredential,
  CredentialExchangeRecord,
  V2CredentialProtocol,
  MediationRecipientModule,
  MediatorPickupStrategy,
  MediationRepository,
  ProofsModule,
  V2ProofProtocol,
  AutoAcceptProof,
  CacheModule,
  InMemoryLruCache,
} from '@credo-ts/core';
import { agentDependencies } from '@credo-ts/react-native';
import { AskarModule } from '@credo-ts/askar';
import { ariesAskar } from '@hyperledger/aries-askar-react-native';
import {
  AnonCredsModule,
  AnonCredsCredentialFormatService,
  LegacyIndyCredentialFormatService,
  V1CredentialProtocol,
  AnonCredsProofFormatService,
} from '@credo-ts/anoncreds';
import { anoncreds } from '@hyperledger/anoncreds-react-native';
import { IndyVdrAnonCredsRegistry, IndyVdrModule, IndyVdrPoolConfig } from '@credo-ts/indy-vdr';
import { indyVdr } from '@hyperledger/indy-vdr-react-native';
import { loadWalletConfig, saveWalletConfig, loadUserData, saveUserData } from '../utils/localStorage';
import { getGenesisTransactions } from '../utils/genesis';
import { setupCredentialEventListener, setupProofEventListener, setupConnectionEventListener } from './CredoEventListener';
import { getCredentials, acceptCredentialOffer } from './CredentialService';
import { getConnections, Connection as ConnectionType, extractMetadata, mapConnectionRecord, declineConnection } from './ConnectionService';
import { acceptProofRequest, declineProofRequest } from './ProofService';
import { fetchMediatorInvitation } from './mediator';
import { extractLabelParam, extractTypeParam } from '../utils/invitationDecoder';

/**
 * CredoAgentService
 *
 * Key rules:
 *  - Module registration order matters for DI (Askar -> IndyVdr -> anoncreds native bridge -> anoncreds)
 *  - Use the RN-native bridges (ariesAskar, anoncreds, indyVdr) with their wrapper modules
 */
export interface CredoAgentConfig {
  label?: string;
  walletId?: string;
  walletKey?: string;
  pin?: string;
  endpoints?: string[];
}

export interface CredentialOfferPreview {
  id: string;
  state: string;
  connectionId?: string;
  schemaId?: string;
  credDefId?: string;
  attributes: Array<{ name: string; value: string }>;
  comment?: string;
  createdAt: string;
}

export interface ProofRequestPreview {
  id: string;
  state: string;
  connectionId?: string;
  name?: string;
  version?: string;
  requestedAttributes: Record<string, any>;
  createdAt: string;
}

export default class CredoAgentService {
  private agent: Agent | null = null;
  private isInitialized = false;

  async initialize(config?: CredoAgentConfig): Promise<{ success: boolean; agentId?: string; agentLabel?: string }> {
    try {
      console.log('Initializing Credo Agent with Askar Wallet...');

      // Try to load persisted wallet config
      const persisted = await loadWalletConfig();

      let walletConfig: WalletConfig;
      if (persisted) {
        walletConfig = {
          id: persisted.walletId,
          key: persisted.walletKey,
        };
        console.log('Using persisted wallet config from storage:', walletConfig);
      } else {
        // Create wallet configuration from provided config
        const computedId =
          config?.walletId ||
          `polyid-${(config?.label || 'holder').toLowerCase().replace(/\s+/g, '-')}`;
        const computedKey =
          config?.walletKey || config?.pin || 'wallet-key-' + Math.random().toString(36).substring(7);
        walletConfig = { id: computedId, key: computedKey };
        console.log('No persisted wallet found. Creating new wallet config:', walletConfig);
      }

      const agentConfig: InitConfig = {
        label: config?.label || (await loadUserData())?.name || 'PolyID Holder',
        walletConfig,
        logger: new ConsoleLogger(LogLevel.fatal),
        endpoints: config?.endpoints || [],
      };

      // IndyVDR networks (keep as you had; shorten for readability)
      const genesisTransactions = await getGenesisTransactions();

      const indyNetworks: [ IndyVdrPoolConfig, ...IndyVdrPoolConfig[] ] = [
        {
          isProduction: false,
          indyNamespace: 'bcovrin:test',
          genesisTransactions: genesisTransactions,
        }
      ];

      /**
       * IMPORTANT: Module order matters:
       *  1. askar (with ariesAskar)
       *  2. indyVdr (ledger access)
       *  3. anoncreds (Credo wrapper) - references the registry that uses indyVdr
       *  4. connections, credentials, oob, etc.
       */
      const legacyIndyCredentialFormatService = new LegacyIndyCredentialFormatService()

      // ✅ FIX: Fetch invitation URL with error handling - allow failure during restore
      // This makes the mediator connection optional so restore can complete even if network fails
      let invitationUrl: string | null = null;
      try {
        console.log('Attempting to fetch mediator invitation...');
        invitationUrl = await fetchMediatorInvitation(true); // allowFailure = true
        if (invitationUrl) {
          console.log('Successfully fetched mediator invitation URL');
        } else {
          console.warn('Mediator invitation fetch returned null. Mediator connection will be skipped. This is OK during restore.');
        }
      } catch (error: any) {
        console.warn('Failed to fetch mediator invitation, but continuing with initialization:', {
          error: error?.message || String(error),
          note: 'Mediator connection can be established later if needed',
        });
        // Don't throw - allow initialization to continue without mediator
      }

      // Build modules object
      const modules: any = {
        askar: new AskarModule({
          ariesAskar,
        }),
        indyVdr: new IndyVdrModule({
          indyVdr,
          networks: indyNetworks,
        }),

        anoncreds: new AnonCredsModule({
          registries: [ new IndyVdrAnonCredsRegistry() ],
          anoncreds: anoncreds,
        }),

        connections: new ConnectionsModule({
          autoAcceptConnections: true,
        }),

        credentials: new CredentialsModule({
          autoAcceptCredentials: AutoAcceptCredential.Never,
          credentialProtocols: [
            new V1CredentialProtocol({
              indyCredentialFormat: legacyIndyCredentialFormatService,
            }),
            new V2CredentialProtocol({
              credentialFormats: [
                legacyIndyCredentialFormatService,
                new AnonCredsCredentialFormatService(),
              ],
            }),
          ],
        }),

        proofs: new ProofsModule({
          autoAcceptProofs: AutoAcceptProof.Never,
          proofProtocols: [
            new V2ProofProtocol({
              proofFormats: [ new AnonCredsProofFormatService() ],
            }),
          ],
        }),

        cache: new CacheModule({
          cache: new InMemoryLruCache({ limit: 500 }),
        }),
        dids: new DidsModule(),
        oob: new OutOfBandModule(),
      };

      // Only add mediationRecipient module if we have an invitation URL
      if (invitationUrl) {
        modules.mediationRecipient = new MediationRecipientModule({
          mediatorInvitationUrl: invitationUrl,
          mediatorPickupStrategy: MediatorPickupStrategy.PickUpV2, // Or PickUpV1
        });
        console.log('MediationRecipient module added with invitation URL');
      } else {
        console.log('Skipping MediationRecipient module - no invitation URL available');
      }

      this.agent = new Agent({
        config: agentConfig,
        dependencies: agentDependencies,
        modules,
      });

      // Register transports
      this.agent.registerOutboundTransport(new HttpOutboundTransport());
      this.agent.registerOutboundTransport(new WsOutboundTransport());

      // ✅ IMPORTANT: Register event listener BEFORE initializing
      setupCredentialEventListener(this.agent);
      setupProofEventListener(this.agent);
      setupConnectionEventListener(this.agent);

      // Initialize the agent
      await this.agent.initialize();

      // ✅ FIX: Clean up duplicate mediator records after initialization
      try {
        const mediationRepository = this.agent.dependencyManager.resolve(MediationRepository);
        const allMediationRecords = await mediationRepository.getAll(this.agent.context);

        // Find all default mediator records
        const defaultRecords = allMediationRecords.filter(record => {
          try {
            const defaultValue: any = record.metadata?.get('default');
            return defaultValue === true ||
              defaultValue === 'true' ||
              (record as any).default === true;
          } catch {
            return false;
          }
        });

        // If there are multiple default records, keep only the most recent one
        if (defaultRecords.length > 1) {
          console.log(`⚠️ Found ${defaultRecords.length} default mediator records. Cleaning up duplicates...`);

          // Sort by creation date (most recent first)
          const sortedRecords = defaultRecords.sort((a: any, b: any) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });

          // Keep the first one, delete the rest
          for (let i = 1; i < sortedRecords.length; i++) {
            await mediationRepository.delete(this.agent.context, sortedRecords[ i ]);
            console.log(`✅ Deleted duplicate mediator record: ${sortedRecords[ i ].id}`);
          }
        }
      } catch (cleanupError) {
        console.warn('⚠️ Error cleaning up duplicate mediator records:', cleanupError);
        // Don't throw - this is a non-critical cleanup operation
      }


      this.isInitialized = true;
      console.log('Agent initialized successfully with Askar Wallet!');

      // Persist wallet config after a successful initialization if it wasn't already saved
      if (!persisted) {
        await saveWalletConfig(walletConfig.id, walletConfig.key);
        console.log('Persisted new wallet config to storage');
      }

      // Non-blocking mediator connect
      // this.connectToMediatorInBackground();

      return {
        success: true,
        agentId: walletConfig.id,
        agentLabel: this.agent.config.label || '',
      };
    } catch (error: any) {
      // More informative error logging for DI problems
      console.error('=== Agent initialization failed ===', {
        error: error?.message || String(error),
        errorType: error?.name || 'Unknown',
        stack: error?.stack,
        timestamp: new Date().toISOString(),
        note: 'This may be due to network request failures. Check environment variables GENESIS_URL and MEDIATOR_URL.',
      });
      // Re-throw so caller can handle
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    if (this.agent) {
      try {
        await this.agent.shutdown();
      } catch (e) {
        console.warn('Error during agent.shutdown():', e);
      }
      this.agent = null;
      this.isInitialized = false;
    }
  }

  isAgentInitialized(): boolean {
    return this.isInitialized && this.agent !== null;
  }

  /**
   * Verifies that the wallet is ready and accessible
   * Uses the agent's internal state and wallet initialization flag
   * @returns Promise<boolean> - true if wallet is ready, false otherwise
   */
  async isWalletReady(): Promise<boolean> {
    if (!this.isInitialized || !this.agent) {
      return false;
    }

    try {
      // If the agent is initialized, the wallet is generally ready
      // We can check the wallet's own initialization status if available
      return this.agent.wallet.isInitialized;
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      console.warn('Wallet readiness check encountered error:', errorMessage);
      return false;
    }
  }

  getAgentId(): string {
    return this.agent?.config.walletConfig?.id || '';
  }

  getAgentLabel(): string {
    return this.agent?.config.label || '';
  }

  async getConnections(): Promise<ConnectionType[]> {
    if (!this.isInitialized || !this.agent) throw new Error('Agent not initialized');
    return getConnections(this.agent);
  }

  async declineConnection(invitationUrl: string): Promise<void> {
    if (!this.isInitialized || !this.agent) throw new Error('Agent not initialized');
    return declineConnection(this.agent, invitationUrl);
  }

  async getCredentials(): Promise<{ record: CredentialExchangeRecord; connectionLabel?: string }[]> {
    if (!this.isInitialized || !this.agent) throw new Error('Agent not initialized');
    return getCredentials(this.agent);
  }

  // Receives an invitation URL and returns a Connection object
  async acceptInvitation(invitationUrl: string): Promise<ConnectionType> {
    if (!this.isInitialized || !this.agent) throw new Error('Agent not initialized');
    try {
      // Extract URL parameters (type and label) before processing
      const urlLabel = extractLabelParam(invitationUrl);
      const urlType = extractTypeParam(invitationUrl);
      console.log('URL parameters - label:', urlLabel, 'type:', urlType);

      const { connectionRecord, outOfBandRecord } = await this.agent.oob.receiveInvitationFromUrl(
        invitationUrl,
        {
          autoAcceptConnection: true,
          autoAcceptInvitation: true,
        },
      );

      console.log('Created connection from out-of-band record:', JSON.stringify(connectionRecord, null, 2));
      console.log('Created out-of-band record:', JSON.stringify(outOfBandRecord, null, 2));

      // Access properties safely using type assertion
      const oobRecord = outOfBandRecord as any;

      // Extract credential attributes from out-of-band record if available
      let credentialAttributesFromOOB: Array<{ name: string; value: string }> = [];
      try {
        // Check if out-of-band record contains credential offer information
        if (oobRecord?.requests) {
          // The requests array may contain credential offers
          for (const request of oobRecord.requests) {
            if (request && typeof request === 'object') {
              // Try to extract credential attributes from the request
              if ('credential_preview' in request || 'credentialPreview' in request) {
                const preview = (request as any).credential_preview || (request as any).credentialPreview;
                if (preview?.attributes) {
                  credentialAttributesFromOOB = preview.attributes.map((attr: any) => ({
                    name: attr.name || attr[ 'mime-type' ] || 'unknown',
                    value: attr.value || '',
                  }));
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn('Error extracting credential attributes from out-of-band record:', error);
      }

      // Attempt to find connection if not returned immediately
      let finalConnectionRecord = connectionRecord;

      if (!finalConnectionRecord && outOfBandRecord) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const allConnections = await this.agent.connections.getAll();
        const relatedConnection = allConnections.find((conn) => conn.outOfBandId === outOfBandRecord.id);
        if (relatedConnection) finalConnectionRecord = relatedConnection;
      }

      if (!finalConnectionRecord) {
        const connection: ConnectionType = {
          id: outOfBandRecord?.id || 'pending',
          state: 'invitation-sent' as any,
          theirLabel: urlLabel || outOfBandRecord?.outOfBandInvitation?.label || 'Unknown',
          createdAt: new Date().toISOString(),
          theirDid: undefined,
          outOfBandId: outOfBandRecord?.id,
          outOfBandLabel: outOfBandRecord?.outOfBandInvitation?.label,
          outOfBandInvitation: outOfBandRecord?.outOfBandInvitation ? {
            label: outOfBandRecord.outOfBandInvitation.label,
            goal: outOfBandRecord.outOfBandInvitation.goal,
            goalCode: outOfBandRecord.outOfBandInvitation.goalCode,
            accept: outOfBandRecord.outOfBandInvitation.accept,
          } : undefined,
          handshakeProtocols: oobRecord?.handshakeProtocols,
          outOfBandMetadata: oobRecord?.metadata ? extractMetadata(oobRecord.metadata) : undefined,
          credentialAttributesFromOOB: credentialAttributesFromOOB.length > 0 ? credentialAttributesFromOOB : undefined,
          urlLabel: urlLabel || undefined,
          urlType: urlType || undefined,
        };
        console.log('Created connection from out-of-band record:', JSON.stringify(connection, null, 2));
        return connection;
      }

      const mapped = mapConnectionRecord(finalConnectionRecord, outOfBandRecord, urlLabel, urlType);
      console.log('Invitation accepted. Connection details:', JSON.stringify(mapped, null, 2));
      return mapped;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  // Accepts a credential offer and returns a CredentialOfferPreview
  async acceptCredentialOffer(credentialRecordId: string): Promise<CredentialOfferPreview> {
    if (!this.isInitialized || !this.agent) throw new Error('Agent not initialized');
    return acceptCredentialOffer(this.agent, credentialRecordId, (record) => this.buildCredentialOfferPreview(record));
  }

  // Accepts a proof request
  async acceptProofRequest(proofRecordId: string): Promise<any> {
    if (!this.isInitialized || !this.agent) throw new Error('Agent not initialized');
    console.log('Accepting proof request...', proofRecordId);
    return acceptProofRequest(this.agent, proofRecordId);
  }

  // Declines a proof request
  async declineProofRequest(proofRecordId: string): Promise<void> {
    if (!this.isInitialized || !this.agent) throw new Error('Agent not initialized');
    return declineProofRequest(this.agent, proofRecordId);
  }

  // Returns the current Credo Agent instance
  getAgent(): Agent | null {
    return this.agent;
  }

  // Wallet Backup and Restore Methods
  async createWalletBackup(pin: string, exportKey: string): Promise<{ success: boolean; backupPath?: string; error?: string }> {
    if (!this.isInitialized || !this.agent) {
      throw new Error('Agent not initialized');
    }

    const { WalletBackupService } = await import('../features/wallet-backup');
    const result = await WalletBackupService.createBackup(this.agent, pin, exportKey);

    return {
      success: result.success,
      backupPath: result.backupPath,
      error: result.error,
    };
  }

  async restoreWalletFromBackup(
    backupFilename: string,
    pin: string,
    exportKey: string,
    _newWalletKey?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('=== Starting wallet restore process ===', {
        backupFilename,
        hasPin: !!pin,
        hasExportKey: !!exportKey,
        timestamp: new Date().toISOString(),
      });

      const { WalletRestoreService } = await import('../features/wallet-backup');
      const RNFS = await import('react-native-fs');

      // 1. Prepare backup (decrypt and extract payload)
      console.log('[Restore Step 1/8] Preparing backup for restore...');
      let payload: any;
      let metadata: any;
      try {
        const result = await WalletRestoreService.prepareBackup(
          backupFilename,
          pin,
          exportKey
        );
        payload = result.payload;
        metadata = result.metadata;
        console.log('[Restore Step 1/8] ✅ Backup prepared successfully', {
          walletId: payload?.walletId,
          hasFiles: !!payload?.files,
          hasUserData: !!payload?.userData,
        });
      } catch (prepareError: any) {
        console.error('[Restore Step 1/8] ❌ Failed to prepare backup:', {
          error: prepareError?.message || String(prepareError),
          errorType: prepareError?.name || 'Unknown',
          stack: prepareError?.stack,
        });
        throw new Error(`Failed to prepare backup: ${prepareError?.message || String(prepareError)}`);
      }

      // 2. Shutdown current agent if initialized
      console.log('[Restore Step 2/8] Checking for existing agent...');
      if (this.agent && this.isInitialized) {
        console.log('[Restore Step 2/8] Shutting down current agent...');
        try {
          await this.shutdown();
          console.log('[Restore Step 2/8] ✅ Agent shut down successfully');
        } catch (shutdownError: any) {
          console.warn('[Restore Step 2/8] ⚠️ Error during agent shutdown (continuing):', {
            error: shutdownError?.message || String(shutdownError),
          });
          // Continue with restore even if shutdown fails
        }
      } else {
        console.log('[Restore Step 2/8] ✅ No existing agent to shut down');
      }

      // 3. Determine wallet config for import
      // Use wallet key from payload (the original wallet key)
      const walletKey = payload.walletKey;
      const walletConfig: WalletConfig = {
        id: payload.walletId,
        key: walletKey,
      };

      // 3.5. Delete existing wallet if it exists (to avoid import conflicts)
      // Helper function to recursively delete directory
      const deleteDirectoryRecursive = async (dirPath: string): Promise<void> => {
        try {
          const exists = await RNFS.default.exists(dirPath);
          if (!exists) return;

          const items = await RNFS.default.readdir(dirPath);
          for (const item of items) {
            const itemPath = `${dirPath}/${item}`;
            try {
              const stat = await RNFS.default.stat(itemPath);
              if (stat.isFile()) {
                await RNFS.default.unlink(itemPath);
              } else if (stat.isDirectory()) {
                await deleteDirectoryRecursive(itemPath);
                await RNFS.default.unlink(itemPath);
              }
            } catch (itemError) {
              console.warn(`Error deleting ${itemPath}:`, itemError);
            }
          }
          await RNFS.default.unlink(dirPath);
        } catch (error) {
          console.warn(`Error deleting directory ${dirPath}:`, error);
          throw error;
        }
      };

      const walletBaseDir = `${RNFS.default.DocumentDirectoryPath}/.afj/wallet`;
      const walletDirPath = `${walletBaseDir}/${walletConfig.id}`;
      const walletDbPath = `${walletDirPath}/sqlite.db`;

      // SQLite related files that might exist
      const sqliteFiles = [
        walletDbPath,
        `${walletDbPath}-wal`, // Write-Ahead Log
        `${walletDbPath}-shm`, // Shared Memory
        `${walletDbPath}-journal`, // Journal file
      ];

      // 3. Delete existing wallet if it exists
      console.log('[Restore Step 3/8] Deleting existing wallet if present...');
      try {
        console.log(`[Restore Step 3/8] Checking for existing wallet at: ${walletDirPath}`);

        // Delete all SQLite-related files first
        for (const filePath of sqliteFiles) {
          try {
            const exists = await RNFS.default.exists(filePath);
            if (exists) {
              await RNFS.default.unlink(filePath);
              console.log(`[Restore Step 3/8] ✅ Deleted SQLite file: ${filePath}`);
            }
          } catch (fileError: any) {
            console.warn(`[Restore Step 3/8] ⚠️ Error deleting file ${filePath}:`, {
              error: fileError?.message || String(fileError),
            });
          }
        }

        // Delete entire directory recursively
        try {
          const dirExists = await RNFS.default.exists(walletDirPath);
          if (dirExists) {
            await deleteDirectoryRecursive(walletDirPath);
            console.log('[Restore Step 3/8] ✅ Wallet directory deleted successfully');
          } else {
            console.log('[Restore Step 3/8] ✅ No existing wallet directory found');
          }
        } catch (dirError: any) {
          console.warn('[Restore Step 3/8] ⚠️ Error deleting wallet directory, trying fallback:', {
            error: dirError?.message || String(dirError),
          });
          // Try simple unlink as fallback
          try {
            await RNFS.default.unlink(walletDirPath);
            console.log('[Restore Step 3/8] ✅ Wallet directory deleted (simple unlink fallback)');
          } catch (simpleError: any) {
            console.warn('[Restore Step 3/8] ⚠️ Simple unlink also failed:', {
              error: simpleError?.message || String(simpleError),
            });
          }
        }

        // Ensure parent directory exists (for import to create wallet)
        const baseDirExists = await RNFS.default.exists(walletBaseDir);
        if (!baseDirExists) {
          await RNFS.default.mkdir(walletBaseDir);
          console.log('[Restore Step 3/8] ✅ Created wallet base directory');
        }

        // Final verification
        const dirStillExists = await RNFS.default.exists(walletDirPath);
        if (dirStillExists) {
          throw new Error(`Wallet directory still exists at ${walletDirPath} after deletion attempts`);
        }

        console.log('[Restore Step 3/8] ✅ Wallet deletion verified - ready to restore files');
      } catch (deleteError: any) {
        console.error('[Restore Step 3/8] ❌ Failed to delete existing wallet:', {
          error: deleteError?.message || String(deleteError),
          errorType: deleteError?.name || 'Unknown',
          walletDirPath,
        });
        throw new Error(`Cannot restore wallet: existing wallet could not be deleted. ${deleteError.message}`);
      }

      // 4. Recreate wallet directory and write files from payload
      console.log('[Restore Step 4/8] Recreating wallet directory and writing files...');
      try {
        await RNFS.default.mkdir(walletDirPath);
        console.log(`[Restore Step 4/8] Created wallet directory at ${walletDirPath}`);

        const files = payload.files || {};
        console.log('[Restore Step 4/8] Writing wallet files...', {
          hasSqlite: !!files.sqlite,
          hasWal: !!files.wal,
          hasShm: !!files.shm,
        });

        const writeIfPresent = async (path: string, data?: string | null) => {
          if (data) {
            await RNFS.default.writeFile(path, data, 'base64');
            console.log(`[Restore Step 4/8] ✅ Wrote file: ${path}`);
          }
        };

        await writeIfPresent(walletDbPath, files.sqlite);
        await writeIfPresent(`${walletDbPath}-wal`, files.wal);
        await writeIfPresent(`${walletDbPath}-shm`, files.shm);
        console.log('[Restore Step 4/8] ✅ All wallet files written successfully');
      } catch (writeError: any) {
        console.error('[Restore Step 4/8] ❌ Failed to write restored wallet files:', {
          error: writeError?.message || String(writeError),
          errorType: writeError?.name || 'Unknown',
          walletDirPath,
        });
        throw new Error(`Failed to write restored wallet files: ${writeError.message}`);
      }

      // 5. Restore user profile data if present
      console.log('[Restore Step 5/8] Restoring user profile data...');
      try {
        if (payload.userData) {
          await saveUserData(payload.userData);
          console.log('[Restore Step 5/8] ✅ User profile data restored from backup');
        } else {
          console.log('[Restore Step 5/8] ⚠️ No user data in backup payload');
        }
      } catch (userDataError: any) {
        console.warn('[Restore Step 5/8] ⚠️ Failed to restore user profile data (non-critical):', {
          error: userDataError?.message || String(userDataError),
        });
        // Don't fail restore if user data write fails
      }

      // 6. Save the new wallet config to local storage
      console.log('[Restore Step 6/8] Saving wallet config to storage...');
      try {
        await saveWalletConfig(walletConfig.id, walletConfig.key);
        console.log('[Restore Step 6/8] ✅ Wallet config saved to storage');
      } catch (configError: any) {
        console.error('[Restore Step 6/8] ❌ Failed to save wallet config:', {
          error: configError?.message || String(configError),
        });
        throw new Error(`Failed to save wallet config: ${configError.message}`);
      }

      // 7. Prepare for agent initialization
      console.log('[Restore Step 7/8] Preparing agent initialization...');

      // 8. Re-initialize the main agent with the restored wallet
      console.log('[Restore Step 8/8] Re-initializing agent with restored wallet...');
      const restoredLabel =
        payload.userData?.name ||
        payload.walletLabel ||
        metadata.walletLabel ||
        (await loadUserData())?.name ||
        walletConfig.id ||
        'PolyID Holder';

      try {
        console.log('[Restore Step 8/8] Initializing agent with config:', {
          walletId: walletConfig.id,
          label: restoredLabel,
          note: 'Network requests may occur during initialization',
        });

        await this.initialize({
          walletId: walletConfig.id,
          walletKey: walletConfig.key,
          label: restoredLabel,
        });

        console.log('[Restore Step 8/8] ✅ Agent initialized successfully');

        // 9. Wait for wallet readiness and fetch restored data
        console.log('[Restore Step 9/9] Waiting for wallet readiness and fetching restored data...');
        try {
          // Wait for wallet to be ready (with retries)
          let walletReady = false;
          const maxReadinessRetries = 10;
          const readinessDelay = 200;
          
          for (let attempt = 0; attempt <= maxReadinessRetries; attempt++) {
            walletReady = await this.isWalletReady();
            if (walletReady) {
              console.log('[Restore Step 9/9] ✅ Wallet is ready');
              break;
            }
            if (attempt < maxReadinessRetries) {
              console.log(`[Restore Step 9/9] Wallet not ready, waiting ${readinessDelay}ms (attempt ${attempt + 1}/${maxReadinessRetries + 1})...`);
              await new Promise(resolve => setTimeout(resolve, readinessDelay));
            }
          }

          if (walletReady) {
            // Fetch connections and credentials from restored wallet
            try {
              console.log('[Restore Step 9/9] Fetching connections from restored wallet...');
              const connections = await this.getConnections();
              console.log(`[Restore Step 9/9] ✅ Fetched ${connections.length} connections from restored wallet`);
            } catch (connError: any) {
              console.warn('[Restore Step 9/9] ⚠️ Failed to fetch connections (non-critical):', {
                error: connError?.message || String(connError),
              });
            }

            try {
              console.log('[Restore Step 9/9] Fetching credentials from restored wallet...');
              const credentials = await this.getCredentials();
              console.log(`[Restore Step 9/9] ✅ Fetched ${credentials.length} credentials from restored wallet`);
            } catch (credError: any) {
              console.warn('[Restore Step 9/9] ⚠️ Failed to fetch credentials (non-critical):', {
                error: credError?.message || String(credError),
              });
            }
          } else {
            console.warn('[Restore Step 9/9] ⚠️ Wallet not ready after max retries, data will be fetched on next app interaction');
          }
        } catch (fetchError: any) {
          console.warn('[Restore Step 9/9] ⚠️ Error during data fetch (non-critical, will retry later):', {
            error: fetchError?.message || String(fetchError),
          });
          // Don't fail restore if fetch fails - data will be fetched later
        }

        console.log('=== Wallet restore completed successfully ===', {
          walletId: walletConfig.id,
          timestamp: new Date().toISOString(),
        });

        return {
          success: true,
        };
      } catch (initError: any) {
        console.error('[Restore Step 8/8] ❌ Failed to initialize agent after restore:', {
          error: initError?.message || String(initError),
          errorType: initError?.name || 'Unknown',
          stack: initError?.stack,
          walletId: walletConfig.id,
          note: 'This may be due to network request failures. Check GENESIS_URL and MEDIATOR_URL environment variables.',
        });
        throw new Error(`Wallet files restored but agent initialization failed: ${initError?.message || String(initError)}`);
      }
    } catch (error: any) {
      console.error('=== Wallet restore failed ===', {
        error: error?.message || String(error),
        errorType: error?.name || 'Unknown',
        stack: error?.stack,
        timestamp: new Date().toISOString(),
        note: 'Check logs above for detailed step-by-step error information',
      });
      return {
        success: false,
        error: error.message || 'Failed to restore wallet',
      };
    }
  }

  // Builds a CredentialOfferPreview from a CredentialExchangeRecord
  async buildCredentialOfferPreview(record: CredentialExchangeRecord): Promise<CredentialOfferPreview> {
    const attributes: Array<{ name: string; value: string }> = [];
    if (record.credentialAttributes) {
      record.credentialAttributes.forEach(attr => {
        attributes.push({ name: attr.name, value: attr.value });
      });
    }

    const indyMetadata = record.metadata.get('_internal/indyCredential');
    const schemaId = indyMetadata?.schemaId;
    const credDefId = indyMetadata?.credentialDefinitionId;

    if (schemaId || credDefId) {
      console.log(`Credential offer preview - Record ID: ${record.id}`);
      console.log(`  Schema ID: ${schemaId || 'Not found'}`);
      console.log(`  Credential Definition ID: ${credDefId || 'Not found'}`);
      console.log(`  Attributes: ${attributes.length}`);
    }

    return {
      id: record.id,
      state: record.state,
      connectionId: record.connectionId,
      schemaId,
      credDefId,
      attributes,
      comment: record.metadata.get('comment')?.comment,
      createdAt: record.createdAt.toISOString(),
    };
  }
}

