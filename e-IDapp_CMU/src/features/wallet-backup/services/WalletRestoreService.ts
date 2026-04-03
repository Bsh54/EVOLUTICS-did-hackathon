import {
	readFile,
	getBackupPath,
	getMetadataPath,
	fileExists,
} from '../utils/fileSystem';
import { decryptBackupFile } from '../utils/backupEncryption';

export interface BackupMetadata {
	walletId: string;
	walletLabel: string;
	timestamp: string;
	version: string;
	encrypted: boolean;
	backupSize: number;
}

export interface RestoreResult {
	success: boolean;
	error?: string;
}

/**
 * Wallet Restore Service
 * Handles backup decryption and preparation
 */
export class WalletRestoreService {
	/**
	 * Load backup metadata
	 */
	static async loadMetadata(backupFilename: string): Promise<BackupMetadata | null> {
		try {
			const metadataPath = getMetadataPath(backupFilename);
			const exists = await fileExists(metadataPath);

			if (!exists) {
				return null;
			}

			const metadataContent = await readFile(metadataPath);
			return JSON.parse(metadataContent) as BackupMetadata;
		} catch (error) {
			console.error('Error loading backup metadata:', error);
			return null;
		}
	}

	/**
	 * Prepare backup for restore: decrypts file and returns payload + metadata
	 */
	static async prepareBackup(
		backupFilename: string,
		pin: string,
		exportKey: string
	): Promise<{ payload: any; metadata: BackupMetadata }> {
		try {
			const backupPath = getBackupPath(backupFilename);
			const exists = await fileExists(backupPath);

			if (!exists) {
				throw new Error('Backup file not found');
			}

			// Load metadata
			const metadata = await this.loadMetadata(backupFilename);
			if (!metadata) {
				throw new Error('Backup metadata not found');
			}

			// Read encrypted backup file as UTF-8
			const encryptedContent = await readFile(backupPath, 'utf8');

			// First layer decrypt with PIN
			const outerDecrypted = await decryptBackupFile(encryptedContent, pin);

			// Second layer decrypt with export key
			const innerDecrypted = await decryptBackupFile(outerDecrypted, exportKey);
			console.log(`Decrypted data header (json/b64): ${innerDecrypted.substring(0, 50)}...`);
			console.log(`Decrypted data length: ${innerDecrypted.length}`);

			const payload = JSON.parse(innerDecrypted);

			return { payload, metadata };
		} catch (error: any) {
			console.error('Error preparing backup for restore:', error);
			throw new Error(error.message || 'Failed to prepare backup');
		}
	}

	/**
	 * Validate backup file before restore
	 */
	static async validateBackup(
		backupFilename: string,
		pin: string
	): Promise<{ valid: boolean; error?: string; metadata?: BackupMetadata }> {
		try {
			const backupPath = getBackupPath(backupFilename);
			const backupExists = await fileExists(backupPath);

			if (!backupExists) {
				return {
					valid: false,
					error: 'Backup file not found',
				};
			}

			// Load metadata
			const metadata = await this.loadMetadata(backupFilename);
			if (!metadata) {
				return {
					valid: false,
					error: 'Backup metadata not found',
				};
			}

			// Try to decrypt to validate PIN (encrypted data is JSON string, so use utf8)
			try {
				const encryptedContent = await readFile(backupPath, 'utf8');
				await decryptBackupFile(encryptedContent, pin);
			} catch (decryptError) {
				return {
					valid: false,
					error: 'Invalid PIN or corrupted backup file',
				};
			}

			return {
				valid: true,
				metadata,
			};
		} catch (error: any) {
			return {
				valid: false,
				error: error.message || 'Failed to validate backup',
			};
		}
	}
}

