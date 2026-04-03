/**
 * Test Suite: Wallet Backup Service
 * 
 * Tests for the WalletBackupService which handles wallet export,
 * encryption, and file storage operations.
 */
import { WalletBackupService, BackupResult, BackupMetadata } from '../../../../src/features/wallet-backup/services/WalletBackupService';

// Mock RNFS
jest.mock('react-native-fs', () => ({
    DocumentDirectoryPath: '/mock/documents',
    exists: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
}));

// Mock file system utils
jest.mock('../../../../src/features/wallet-backup/utils/fileSystem', () => ({
    ensureBackupDirectory: jest.fn().mockResolvedValue(undefined),
    generateBackupFilename: jest.fn().mockReturnValue('backup_test_20240101.bak'),
    getBackupPath: jest.fn().mockReturnValue('/mock/backup/backup_test_20240101.bak'),
    getMetadataPath: jest.fn().mockReturnValue('/mock/backup/backup_test_20240101.meta.json'),
    writeFile: jest.fn().mockResolvedValue(undefined),
    getFileSize: jest.fn().mockResolvedValue(1024),
    readFile: jest.fn(),
}));

// Mock encryption utils
jest.mock('../../../../src/features/wallet-backup/utils/backupEncryption', () => ({
    encryptBackupFile: jest.fn().mockResolvedValue('encrypted-data'),
}));

// Mock localStorage
jest.mock('../../../../src/utils/localStorage', () => ({
    loadUserData: jest.fn().mockResolvedValue({
        name: 'Test User',
        email: 'test@example.com',
    }),
}));

describe('WalletBackupService', () => {
    const mockAgent = {
        wallet: {},
        config: {
            walletConfig: {
                id: 'test-wallet-id',
                key: 'test-wallet-key',
            },
            label: 'Test Wallet',
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Silence console logs and errors during tests
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });

        const RNFS = require('react-native-fs');
        RNFS.exists.mockResolvedValue(true);
        RNFS.readFile.mockResolvedValue('base64-encoded-data');
    });

    describe('createBackup', () => {
        it('should create backup successfully', async () => {
            const result = await WalletBackupService.createBackup(
                mockAgent as any,
                '1234',
                'export-key'
            );

            expect(result.success).toBe(true);
            expect(result.backupPath).toBeDefined();
            expect(result.metadataPath).toBeDefined();
            expect(result.metadata).toBeDefined();
        });

        it('should include correct metadata in result', async () => {
            const result = await WalletBackupService.createBackup(
                mockAgent as any,
                '1234',
                'export-key'
            );

            expect(result.metadata?.walletId).toBe('test-wallet-id');
            expect(result.metadata?.walletLabel).toBe('Test Wallet');
            expect(result.metadata?.encrypted).toBe(true);
            expect(result.metadata?.version).toBeDefined();
            expect(result.metadata?.timestamp).toBeDefined();
        });

        it('should return error when agent is null', async () => {
            const result = await WalletBackupService.createBackup(
                null as any,
                '1234',
                'export-key'
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('Agent or wallet not available');
        });

        it('should return error when wallet is not available', async () => {
            const agentWithoutWallet = { config: mockAgent.config };

            const result = await WalletBackupService.createBackup(
                agentWithoutWallet as any,
                '1234',
                'export-key'
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('Agent or wallet not available');
        });

        it('should return error when wallet config is missing', async () => {
            const agentWithoutConfig = {
                wallet: {},
                config: {},
            };

            const result = await WalletBackupService.createBackup(
                agentWithoutConfig as any,
                '1234',
                'export-key'
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('Wallet configuration not found');
        });

        it('should return error when database file not found', async () => {
            const RNFS = require('react-native-fs');
            RNFS.exists.mockResolvedValue(false);

            const result = await WalletBackupService.createBackup(
                mockAgent as any,
                '1234',
                'export-key'
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('Wallet database file not found');
        });

        it('should ensure backup directory exists', async () => {
            const { ensureBackupDirectory } = require('../../../../src/features/wallet-backup/utils/fileSystem');

            await WalletBackupService.createBackup(
                mockAgent as any,
                '1234',
                'export-key'
            );

            expect(ensureBackupDirectory).toHaveBeenCalled();
        });

        it('should encrypt backup with both PIN and export key', async () => {
            const { encryptBackupFile } = require('../../../../src/features/wallet-backup/utils/backupEncryption');

            await WalletBackupService.createBackup(
                mockAgent as any,
                '1234',
                'export-key'
            );

            // Should be called twice: once for export key, once for PIN
            expect(encryptBackupFile).toHaveBeenCalledTimes(2);
        });

        it('should write encrypted backup to file', async () => {
            const { writeFile } = require('../../../../src/features/wallet-backup/utils/fileSystem');

            await WalletBackupService.createBackup(
                mockAgent as any,
                '1234',
                'export-key'
            );

            expect(writeFile).toHaveBeenCalled();
        });

        it('should write metadata file', async () => {
            const { writeFile } = require('../../../../src/features/wallet-backup/utils/fileSystem');

            await WalletBackupService.createBackup(
                mockAgent as any,
                '1234',
                'export-key'
            );

            // writeFile should be called for both backup and metadata
            expect(writeFile).toHaveBeenCalledTimes(2);
        });

        it('should read WAL and SHM files if they exist', async () => {
            const RNFS = require('react-native-fs');
            RNFS.exists.mockImplementation((path: string) => {
                return Promise.resolve(true); // All files exist
            });

            await WalletBackupService.createBackup(
                mockAgent as any,
                '1234',
                'export-key'
            );

            // Should read sqlite.db, sqlite.db-wal, and sqlite.db-shm
            expect(RNFS.readFile).toHaveBeenCalledTimes(3);
        });

        it('should handle missing WAL and SHM files gracefully', async () => {
            const RNFS = require('react-native-fs');
            RNFS.exists.mockImplementation((path: string) => {
                if (path.includes('sqlite.db-wal') || path.includes('sqlite.db-shm')) {
                    return Promise.resolve(false);
                }
                return Promise.resolve(true);
            });

            const result = await WalletBackupService.createBackup(
                mockAgent as any,
                '1234',
                'export-key'
            );

            expect(result.success).toBe(true);
        });

        it('should include user data in backup payload', async () => {
            const { loadUserData } = require('../../../../src/utils/localStorage');

            await WalletBackupService.createBackup(
                mockAgent as any,
                '1234',
                'export-key'
            );

            expect(loadUserData).toHaveBeenCalled();
        });
    });

    describe('verifyBackup', () => {
        it('should return true for valid backup file', async () => {
            const { readFile } = require('../../../../src/features/wallet-backup/utils/fileSystem');
            const RNFS = require('react-native-fs');

            RNFS.exists.mockResolvedValue(true);
            readFile.mockResolvedValue(JSON.stringify({
                version: '1.0',
                algorithm: 'aes-256-cbc',
                salt: 'test-salt',
                iv: 'test-iv',
                data: 'encrypted-data',
            }));

            const result = await WalletBackupService.verifyBackup('/path/to/backup');

            expect(result).toBeTruthy();
        });

        it('should return false when file does not exist', async () => {
            const RNFS = require('react-native-fs');
            RNFS.exists.mockResolvedValue(false);

            const result = await WalletBackupService.verifyBackup('/path/to/backup');

            expect(result).toBeFalsy();
        });

        it('should return false for invalid backup structure', async () => {
            const { readFile } = require('../../../../src/features/wallet-backup/utils/fileSystem');
            const RNFS = require('react-native-fs');

            RNFS.exists.mockResolvedValue(true);
            readFile.mockResolvedValue(JSON.stringify({
                invalid: 'structure',
            }));

            const result = await WalletBackupService.verifyBackup('/path/to/backup');

            expect(result).toBeFalsy();
        });

        it('should return false when parsing fails', async () => {
            const { readFile } = require('../../../../src/features/wallet-backup/utils/fileSystem');
            const RNFS = require('react-native-fs');

            RNFS.exists.mockResolvedValue(true);
            readFile.mockResolvedValue('invalid-json');

            const result = await WalletBackupService.verifyBackup('/path/to/backup');

            expect(result).toBeFalsy();
        });
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });
});
