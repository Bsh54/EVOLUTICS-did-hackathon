import { WalletRestoreService } from '../WalletRestoreService';
import * as fileSystem from '../../utils/fileSystem';
import * as backupEncryption from '../../utils/backupEncryption';

// Mock dependencies
jest.mock('../../utils/fileSystem', () => ({
	getBackupPath: jest.fn().mockReturnValue('/mock/docs/wallet-backups/test-backup.backup'),
	getMetadataPath: jest.fn().mockReturnValue('/mock/docs/wallet-backups/test-backup.meta.json'),
	readFile: jest.fn(),
	fileExists: jest.fn(),
}));

jest.mock('../../utils/backupEncryption', () => ({
	decryptBackupFile: jest.fn(),
}));

describe('WalletRestoreService', () => {
	const mockFilename = 'test-backup.backup';
	const mockPin = '123456';
	const mockExportKey = 'export-key';
	const mockMetadata = {
		walletId: 'test-id',
		walletLabel: 'Test Label',
		timestamp: '2023-01-01T00:00:00.000Z',
		version: '1.0',
		encrypted: true,
		backupSize: 100,
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('loadMetadata', () => {
		it('should load and parse metadata', async () => {
			(fileSystem.fileExists as jest.Mock).mockResolvedValue(true);
			(fileSystem.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockMetadata));

			const result = await WalletRestoreService.loadMetadata(mockFilename);

			expect(fileSystem.getMetadataPath).toHaveBeenCalledWith(mockFilename);
			expect(result).toEqual(mockMetadata);
		});

		it('should return null if metadata file does not exist', async () => {
			(fileSystem.fileExists as jest.Mock).mockResolvedValue(false);
			const result = await WalletRestoreService.loadMetadata(mockFilename);
			expect(result).toBeNull();
		});

		it('should return null on parse error', async () => {
			(fileSystem.fileExists as jest.Mock).mockResolvedValue(true);
			(fileSystem.readFile as jest.Mock).mockResolvedValue('invalid-json');
			const result = await WalletRestoreService.loadMetadata(mockFilename);
			expect(result).toBeNull();
		});
	});

	describe('prepareBackup', () => {
		it('should successfully decrypt and prepare backup', async () => {
			(fileSystem.fileExists as jest.Mock).mockResolvedValue(true);
			(fileSystem.readFile as jest.Mock)
				.mockResolvedValueOnce(JSON.stringify(mockMetadata)) // first call in loadMetadata (if called)
				.mockResolvedValueOnce('encrypted-content'); // second call for backup file

			// Need to mock loadMetadata specifically since it's a static method called within prepareBackup
			jest.spyOn(WalletRestoreService, 'loadMetadata').mockResolvedValue(mockMetadata);

			(backupEncryption.decryptBackupFile as jest.Mock)
				.mockResolvedValueOnce('outer-decrypted') // PIN layer
				.mockResolvedValueOnce(JSON.stringify({ some: 'payload' })); // Export key layer

			const result = await WalletRestoreService.prepareBackup(mockFilename, mockPin, mockExportKey);

			expect(result.payload).toEqual({ some: 'payload' });
			expect(result.metadata).toEqual(mockMetadata);
			expect(backupEncryption.decryptBackupFile).toHaveBeenCalledTimes(2);
		});

		it('should fail if backup file is missing', async () => {
			(fileSystem.fileExists as jest.Mock).mockResolvedValue(false);
			await expect(WalletRestoreService.prepareBackup(mockFilename, mockPin, mockExportKey))
				.rejects.toThrow('Backup file not found');
		});

		it('should fail if metadata is missing', async () => {
			(fileSystem.fileExists as jest.Mock).mockResolvedValue(true);
			jest.spyOn(WalletRestoreService, 'loadMetadata').mockResolvedValue(null);

			await expect(WalletRestoreService.prepareBackup(mockFilename, mockPin, mockExportKey))
				.rejects.toThrow('Backup metadata not found');
		});
	});

	describe('validateBackup', () => {
		it('should return valid true for correct PIN and existing files', async () => {
			(fileSystem.fileExists as jest.Mock).mockResolvedValue(true);
			jest.spyOn(WalletRestoreService, 'loadMetadata').mockResolvedValue(mockMetadata);
			(fileSystem.readFile as jest.Mock).mockResolvedValue('content');
			(backupEncryption.decryptBackupFile as jest.Mock).mockResolvedValue('decrypted');

			const result = await WalletRestoreService.validateBackup(mockFilename, mockPin);

			expect(result.valid).toBe(true);
			expect(result.metadata).toEqual(mockMetadata);
		});

		it('should return valid false for incorrect PIN', async () => {
			(fileSystem.fileExists as jest.Mock).mockResolvedValue(true);
			jest.spyOn(WalletRestoreService, 'loadMetadata').mockResolvedValue(mockMetadata);
			(fileSystem.readFile as jest.Mock).mockResolvedValue('content');
			(backupEncryption.decryptBackupFile as jest.Mock).mockRejectedValue(new Error('Decryption failed'));

			const result = await WalletRestoreService.validateBackup(mockFilename, mockPin);

			expect(result.valid).toBe(false);
			expect(result.error).toContain('Invalid PIN or corrupted backup file');
		});
	});
});

