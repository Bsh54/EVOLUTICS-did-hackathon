import { ReactNativeWallet, ReactNativeWalletApi, ReactNativeWalletModule } from '../../src/services/ReactNativeWalletModule';

// Mock Credo core
jest.mock('@credo-ts/core', () => {
    return {
        WalletApi: class MockWalletApi { },
        InjectionSymbols: { Logger: 'Logger' },
        Key: { fromPublicKey: jest.fn().mockImplementation((pk, type) => ({ publicKey: pk, keyType: type })) },
        KeyType: { Ed25519: 'Ed25519' },
        Buffer: {
            from: jest.fn().mockImplementation((data, enc) => ({
                toString: jest.fn().mockReturnValue(data),
                slice: jest.fn().mockReturnThis(),
            })),
            concat: jest.fn().mockImplementation((arr) => ({
                toString: jest.fn().mockReturnValue('concatenated'),
            })),
        },
        WalletDuplicateError: class extends Error { },
        WalletNotFoundError: class extends Error { },
        WalletInvalidKeyError: class extends Error { },
        WalletError: class extends Error { },
    };
});

describe('ReactNativeWalletModule', () => {
    let mockAgentContext: any;
    let mockLogger: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        mockAgentContext = {
            dependencyManager: {
                resolve: jest.fn().mockReturnValue(mockLogger),
                registerSingleton: jest.fn(),
            }
        };
    });

    describe('ReactNativeWallet', () => {
        let wallet: ReactNativeWallet;

        beforeEach(() => {
            wallet = new ReactNativeWallet(mockAgentContext);
        });

        it('should create a wallet', async () => {
            const config = { id: 'test-id', key: 'test-key' };
            await wallet.create(config as any);
            expect(wallet.isProvisioned).toBe(true);
        });

        it('should open a created wallet with correct key', async () => {
            const config = { id: 'test-id', key: 'test-key' };
            await wallet.create(config as any);
            await expect(wallet.open(config as any)).resolves.not.toThrow();
        });

        it('should handle key creation', async () => {
            const key = await wallet.createKey({ keyType: 'Ed25519' as any });
            expect(key).toBeDefined();
            expect(key.keyType).toBe('Ed25519');
        });

        it('should mock sign and verify', async () => {
            const data = { toString: () => 'test-data' };
            const signature = await wallet.sign({ data, key: {} as any } as any);
            expect(signature.toString()).toContain('signed-');

            const verified = await wallet.verify({ data, signature, key: {} as any } as any);
            expect(verified).toBe(true);
        });

        it('should pack and unpack messages', async () => {
            const payload = { hello: 'world' };
            const packed = await wallet.pack(payload, ['recipient-key']);
            const unpacked = await wallet.unpack(packed);

            expect(unpacked.plaintextMessage).toEqual(payload);
        });
    });

    describe('ReactNativeWalletApi', () => {
        it('should initialize successfully', async () => {
            const api = new ReactNativeWalletApi(mockAgentContext);
            await api.initialize();
            expect(mockLogger.info).toHaveBeenCalledWith('ReactNativeWalletApi initialized');
        });
    });

    describe('ReactNativeWalletModule', () => {
        it('should register ReactNativeWalletApi as a singleton', () => {
            const module = new ReactNativeWalletModule();
            module.register(mockAgentContext.dependencyManager);
            expect(mockAgentContext.dependencyManager.registerSingleton).toHaveBeenCalled();
        });
    });
});
