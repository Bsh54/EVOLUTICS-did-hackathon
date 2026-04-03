import { Agent } from '@credo-ts/core';
import { loadUserData } from '../../../utils/localStorage';
import RNFS from 'react-native-fs';
import {
	ensureBackupDirectory,
	generateBackupFilename,
	getBackupPath,
	getMetadataPath,
	writeFile,
	getFileSize,
	readFile,
} from '../utils/fileSystem';
import { encryptBackupFile } from '../utils/backupEncryption';

export interface BackupMetadata {
	walletId: string;
	walletLabel: string;
	timestamp: string;
	version: string;
	encrypted: boolean;
	backupSize: number;
	exportKeyHint?: string; // Optional hint for export key (encrypted)
}

export interface BackupResult {
	success: boolean;
	backupPath?: string;
	metadataPath?: string;
	metadata?: BackupMetadata;
	error?: string;
}

/**
 * Wallet Backup Service
 * Handles wallet export, encryption, and file storage
 */
export class WalletBackupService {
	/**
	 * Create a backup of the wallet
	 */
	static async createBackup(
		agent: Agent,
		pin: string,
		exportKey: string
	): Promise<BackupResult> {
		try {
			if (!agent || !agent.wallet) {
				throw new Error('Agent or wallet not available');
			}

			const walletConfig = agent.config.walletConfig;
			if (!walletConfig) {
				throw new Error('Wallet configuration not found');
			}

			// Ensure backup directory exists
			await ensureBackupDirectory();

			// Generate backup filename
			const backupFilename = generateBackupFilename(walletConfig.id);
			const backupPath = getBackupPath(backupFilename);
			const metadataPath = getMetadataPath(backupFilename);

			// Read the exported file(s) directly from wallet directory to ensure validity
			const walletDir = `${RNFS.DocumentDirectoryPath}/.afj/wallet/${walletConfig.id}`;
			const dbPath = `${walletDir}/sqlite.db`;
			const walPath = `${walletDir}/sqlite.db-wal`;
			const shmPath = `${walletDir}/sqlite.db-shm`;

			const dbExists = await RNFS.exists(dbPath);
			if (!dbExists) {
				throw new Error('Wallet database file not found for backup');
			}

			const dbData = await RNFS.readFile(dbPath, 'base64');
			const walExists = await RNFS.exists(walPath);
			const shmExists = await RNFS.exists(shmPath);
			const walData = walExists ? await RNFS.readFile(walPath, 'base64') : null;
			const shmData = shmExists ? await RNFS.readFile(shmPath, 'base64') : null;

			console.log(`Wallet files collected: sqlite.db (${dbData.length} b64 chars), wal: ${walExists}, shm: ${shmExists}`);

			const userData = await loadUserData();

			const payload = {
				walletId: walletConfig.id,
				walletKey: walletConfig.key,
				walletLabel: agent.config.label || (userData?.name ?? walletConfig.id),
				userData: userData || null,
				files: {
					sqlite: dbData,
					wal: walData,
					shm: shmData,
				},
			};

			const payloadString = JSON.stringify(payload);

			// Inner encryption with export key
			const exportEncrypted = await encryptBackupFile(payloadString, exportKey);

			// Outer encryption with PIN
			const finalEncrypted = await encryptBackupFile(exportEncrypted, pin);

			// Write encrypted backup file as UTF-8 (encrypted data is JSON string)
			await writeFile(backupPath, finalEncrypted, 'utf8');

			// Get file size
			const backupSize = await getFileSize(backupPath);

			// Create metadata
			const metadata: BackupMetadata = {
				walletId: walletConfig.id,
				walletLabel: agent.config.label || 'Unknown',
				timestamp: new Date().toISOString(),
				version: '0.5.17', // TODO: Get from package.json or agent version
				encrypted: true,
				backupSize,
			};

			// Save metadata
			await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

			console.log('Backup created successfully:', backupPath);

			return {
				success: true,
				backupPath,
				metadataPath,
				metadata,
			};
		} catch (error: any) {
			console.error('Error creating backup:', error);
			return {
				success: false,
				error: error.message || 'Failed to create backup',
			};
		}
	}

	/**
	 * Verify backup file integrity
	 */
	static async verifyBackup(backupPath: string): Promise<boolean> {
		try {
			const exists = await RNFS.exists(backupPath);
			if (!exists) {
				return false;
			}

			// Try to read and parse the encrypted package (encrypted data is JSON string, so use utf8)
			const content = await readFile(backupPath, 'utf8');
			const encryptedPackage = JSON.parse(content);

			// Validate structure
			return !!(
				encryptedPackage.version &&
				encryptedPackage.algorithm &&
				encryptedPackage.salt &&
				encryptedPackage.iv &&
				encryptedPackage.data
			);
		} catch (error) {
			console.error('Error verifying backup:', error);
			return false;
		}
	}
}

