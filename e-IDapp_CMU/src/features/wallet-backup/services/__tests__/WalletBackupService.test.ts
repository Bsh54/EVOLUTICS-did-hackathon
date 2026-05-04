import RNFS from 'react-native-fs';
import { WalletBackupService } from '../WalletBackupService';
import * as fileSystem from '../../utils/fileSystem';
import * as backupEncryption from '../../utils/backupEncryption';
import { loadUserData } from '../../../../utils/localStorage';

// Mock dependencies
jest.mock('react-native-fs', () => ({
	DocumentDirectoryPath: '/mock/docs',
	exists: jest.fn().mockResolvedValue(true),
	readFile: jest.fn().mockResolvedValue('mock-file-content'),
}));

jest.mock('../../utils/fileSystem', () => ({
	ensureBackupDirectory: jest.fn().mockResolvedValue('/mock/docs/wallet-backups'),
	generateBackupFilename: jest.fn().mockReturnValue('test-backup.backup'),
	getBackupPath: jest.fn().mockReturnValue('/mock/docs/wallet-backups/test-backup.backup'),
	getMetadataPath: jest.fn().mockReturnValue('/mock/docs/wallet-backups/test-backup.meta.json'),
	writeFile: jest.fn().mockResolvedValue(undefined),
	getFileSize: jest.fn().mockResolvedValue(100),
	readFile: jest.fn().mockResolvedValue('mock-content'),
}));

jest.mock('../../utils/backupEncryption', () => ({
	encryptBackupFile: jest.fn().mockResolvedValue('{"encrypted":"data"}'),
}));

jest.mock('../../../../utils/localStorage', () => ({
	loadUserData: jest.fn().mockResolvedValue({ name: 'Test User' }),
}));

describe('WalletBackupService', () => {
	const mockAgent = {
		config: {
			walletConfig: {
				id: 'test-wallet-id',
				key: 'test-wallet-key',
			},
			label: 'Test Agent',
		},
		wallet: {},
	};

	const mockPin = '123456';
	const mockExportKey = 'export-key';

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('createBackup', () => {
		it('should successfully create a backup', async () => {
			const result = await WalletBackupService.createBackup(
				mockAgent as any,
				mockPin,
				mockExportKey
			);

			expect(result.success).toBe(true);
			expect(fileSystem.ensureBackupDirectory).toHaveBeenCalled();
			expect(fileSystem.writeFile).toHaveBeenCalledTimes(2); // Backup file + Metadata
			expect(backupEncryption.encryptBackupFile).toHaveBeenCalledTimes(2); // Export key then PIN
			expect(result.backupPath).toBe('/mock/docs/wallet-backups/test-backup.backup');
			expect(result.metadata).toBeDefined();
		});

		it('should fail if agent is not provided', async () => {
			const result = await WalletBackupService.createBackup(null as any, mockPin, mockExportKey);
			expect(result.success).toBe(false);
			expect(result.error).toContain('Agent or wallet not available');
		});

		it('should fail if wallet database is missing', async () => {
			(RNFS.exists as jest.Mock).mockResolvedValueOnce(false); // sqlite.db check
			const result = await WalletBackupService.createBackup(
				mockAgent as any,
				mockPin,
				mockExportKey
			);
			expect(result.success).toBe(false);
			expect(result.error).toContain('Wallet database file not found');
		});

		it('should handle errors during backup process', async () => {
			(fileSystem.writeFile as jest.Mock).mockRejectedValueOnce(new Error('Write failed'));
			const result = await WalletBackupService.createBackup(
				mockAgent as any,
				mockPin,
				mockExportKey
			);
			expect(result.success).toBe(false);
			expect(result.error).toBe('Write failed');
		});
	});

	describe('verifyBackup', () => {
		it('should return true for a valid backup file', async () => {
			(RNFS.exists as jest.Mock).mockResolvedValue(true);
			(fileSystem.readFile as jest.Mock).mockResolvedValue(JSON.stringify({
				version: '1.0',
				algorithm: 'aes-256-cbc',
				salt: 'salt',
				iv: 'iv',
				data: 'data',
			}));

			const isValid = await WalletBackupService.verifyBackup('path');
			expect(isValid).toBe(true);
		});

		it('should return false if file does not exist', async () => {
			(RNFS.exists as jest.Mock).mockResolvedValue(false);
			const isValid = await WalletBackupService.verifyBackup('path');
			expect(isValid).toBe(false);
		});

		it('should return false if content is invalid JSON', async () => {
			(RNFS.exists as jest.Mock).mockResolvedValue(true);
			(fileSystem.readFile as jest.Mock).mockResolvedValue('invalid-json');

			const isValid = await WalletBackupService.verifyBackup('path');
			expect(isValid).toBe(false);
		});
	});
});

