import {
  Module,
  DependencyManager,
  WalletApi,
  Wallet,
  WalletConfig,
  WalletConfigRekey,
  WalletExportImportConfig,
  WalletCreateKeyOptions,
  WalletSignOptions,
  WalletVerifyOptions,
  Key,
  KeyType,
  Buffer,
  WalletError,
  WalletDuplicateError,
  WalletNotFoundError,
  WalletInvalidKeyError,
  EncryptedMessage,
  UnpackedMessageContext,
  Logger,
  InjectionSymbols,
  AgentContext
} from '@credo-ts/core';

// Simple React Native compatible wallet implementation
export class ReactNativeWallet implements Wallet {
  private logger: Logger;
  private agentContext: AgentContext;
  private isInitialized = false;
  private isOpened = false;
  private walletConfig?: WalletConfig;
  private storage = new Map<string, any>();

  public constructor(agentContext: AgentContext) {
    this.agentContext = agentContext;
    this.logger = agentContext.dependencyManager.resolve(InjectionSymbols.Logger);
  }

  public get isProvisioned() {
    return this.isInitialized;
  }

  public get publicDid() {
    return this.storage.get('publicDid') || undefined;
  }

  public async create(walletConfig: WalletConfig): Promise<void> {
    this.logger.debug('Creating React Native wallet', { walletId: walletConfig.id });
    
    if (this.isInitialized) {
      throw new WalletDuplicateError('Wallet already exists', { walletType: 'ReactNativeWallet' });
    }

    this.walletConfig = walletConfig;
    this.isInitialized = true;
    this.storage.clear();
  }

  public async createAndOpen(walletConfig: WalletConfig): Promise<void> {
    await this.create(walletConfig);
    await this.open(walletConfig);
  }

  public async open(walletConfig: WalletConfig): Promise<void> {
    this.logger.debug('Opening React Native wallet', { walletId: walletConfig.id });
    
    if (!this.isInitialized) {
      throw new WalletNotFoundError('Wallet not found', { walletType: 'ReactNativeWallet' });
    }

    if (this.walletConfig?.key !== walletConfig.key) {
      throw new WalletInvalidKeyError('Invalid wallet key', { walletType: 'ReactNativeWallet' });
    }

    this.isOpened = true;
  }

  public async close(): Promise<void> {
    this.logger.debug('Closing React Native wallet');
    this.isOpened = false;
  }

  public async delete(): Promise<void> {
    this.logger.debug('Deleting React Native wallet');
    this.storage.clear();
    this.isInitialized = false;
    this.isOpened = false;
    this.walletConfig = undefined;
  }

  public async export(exportConfig: WalletExportImportConfig): Promise<void> {
    throw new WalletError('Export not supported in ReactNativeWallet');
  }

  public async import(walletConfig: WalletConfig, importConfig: WalletExportImportConfig): Promise<void> {
    throw new WalletError('Import not supported in ReactNativeWallet');
  }

  public async rotateKey(walletConfig: WalletConfigRekey): Promise<void> {
    throw new WalletError('Key rotation not supported in ReactNativeWallet');
  }

  public async createKey(options: WalletCreateKeyOptions): Promise<Key> {
    // Generate a simple key for demo purposes
    const keyType = options.keyType || KeyType.Ed25519;
    const seed = options.seed || Buffer.from('simple-seed-' + Date.now());
    
    // Create a simple key implementation
    const keyData = {
      keyType,
      publicKey: seed.slice(0, 32), // Use first 32 bytes as public key
      privateKey: seed, // Use full seed as private key
    };
    
    const keyId = `key-${Date.now()}`;
    this.storage.set(keyId, keyData);

    // Return a Key object
    return Key.fromPublicKey(keyData.publicKey, keyType);
  }

  public async sign(options: WalletSignOptions): Promise<Buffer> {
    // Simple signing implementation - just return a mock signature
    const data = Array.isArray(options.data) ? Buffer.concat(options.data) : options.data;
    return Buffer.from(`signed-${data.toString('hex')}`);
  }

  public async verify(options: WalletVerifyOptions): Promise<boolean> {
    // Simple verification - always return true for demo
    return true;
  }

  public async pack(payload: Record<string, unknown>, recipientKeys: string[], senderVerkey?: string): Promise<EncryptedMessage> {
    // Simple packing - return a mock encrypted message
    const message = JSON.stringify({ payload, recipientKeys, senderVerkey });
    return {
      protected: Buffer.from('protected').toString('base64'),
      iv: Buffer.from('iv').toString('base64'),
      ciphertext: Buffer.from(message).toString('base64'),
      tag: Buffer.from('tag').toString('base64'),
    };
  }

  public async unpack(encryptedMessage: EncryptedMessage): Promise<UnpackedMessageContext> {
    // Simple unpacking
    const message = Buffer.from(encryptedMessage.ciphertext, 'base64').toString();
    const parsed = JSON.parse(message);
    
    return {
      plaintextMessage: parsed.payload,
      senderKey: parsed.senderVerkey,
      recipientKey: parsed.recipientKeys[0],
    };
  }

  public async generateNonce(): Promise<string> {
    return Math.random().toString(36).substring(7);
  }

  public async generateWalletKey(): Promise<string> {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private ensureWalletIsOpened(): void {
    if (!this.isOpened) {
      throw new WalletError('Wallet is not opened');
    }
  }
}

// Wallet API implementation
export class ReactNativeWalletApi extends WalletApi {
  public wallet: ReactNativeWallet;
  public agentContext: AgentContext;
  public logger: Logger;

  public constructor(agentContext: AgentContext) {
    super();
    this.agentContext = agentContext;
    this.logger = agentContext.dependencyManager.resolve(InjectionSymbols.Logger);
    this.wallet = new ReactNativeWallet(agentContext);
  }

  public async initialize(): Promise<void> {
    // Initialize the wallet API
    this.logger.info('ReactNativeWalletApi initialized');
  }
}

// Module implementation
export class ReactNativeWalletModule implements Module {
  public api = WalletApi;

  public register(dependencyManager: DependencyManager) {
    dependencyManager.registerSingleton(WalletApi, ReactNativeWalletApi);
  }
}