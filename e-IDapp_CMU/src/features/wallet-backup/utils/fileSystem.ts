import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

/**
 * File System Utilities for Wallet Backup Operations
 * Wrapper around react-native-fs for backup file management
 */

export const BACKUP_DIRECTORY = 'wallet-backups';

/**
 * Get the app documents directory path
 */
export const getDocumentsDirectory = (): string => {
	return Platform.OS === 'ios'
		? RNFS.DocumentDirectoryPath
		: RNFS.DocumentDirectoryPath;
};

/**
 * Get the backup directory path
 */
export const getBackupDirectory = (): string => {
	const docsDir = getDocumentsDirectory();
	return `${docsDir}/${BACKUP_DIRECTORY}`;
};

/**
 * Ensure backup directory exists
 */
export const ensureBackupDirectory = async (): Promise<string> => {
	const backupDir = getBackupDirectory();
	const dirExists = await RNFS.exists(backupDir);

	if (!dirExists) {
		await RNFS.mkdir(backupDir);
	}

	return backupDir;
};

/**
 * List all backup files in the backup directory
 */
export const listBackups = async (): Promise<string[]> => {
	try {
		const backupDir = await ensureBackupDirectory();
		const files = await RNFS.readdir(backupDir);

		// Filter for backup files (exclude metadata files)
		return files.filter(file => file.endsWith('.backup'));
	} catch (error) {
		console.error('Error listing backups:', error);
		return [];
	}
};

/**
 * Get full path for a backup file
 */
export const getBackupPath = (filename: string): string => {
	const backupDir = getBackupDirectory();
	return `${backupDir}/${filename}`;
};

/**
 * Get metadata file path for a backup
 */
export const getMetadataPath = (backupFilename: string): string => {
	const baseName = backupFilename.replace('.backup', '');
	const backupDir = getBackupDirectory();
	return `${backupDir}/${baseName}.meta.json`;
};

/**
 * Read a file as string
 * @param filePath - Path to the file
 * @param encoding - Encoding to use ('utf8' for text, 'base64' for binary)
 */
export const readFile = async (filePath: string, encoding: 'utf8' | 'base64' = 'utf8'): Promise<string> => {
	try {
		return await RNFS.readFile(filePath, encoding);
	} catch (error) {
		console.error(`Error reading file ${filePath}:`, error);
		throw error;
	}
};

/**
 * Write a file
 * @param filePath - Path to the file
 * @param content - Content to write
 * @param encoding - Encoding to use ('utf8' for text, 'base64' for binary)
 */
export const writeFile = async (filePath: string, content: string, encoding: 'utf8' | 'base64' = 'utf8'): Promise<void> => {
	try {
		await RNFS.writeFile(filePath, content, encoding);
	} catch (error) {
		console.error(`Error writing file ${filePath}:`, error);
		throw error;
	}
};

/**
 * Delete a file
 */
export const deleteFile = async (filePath: string): Promise<void> => {
	try {
		const exists = await RNFS.exists(filePath);
		if (exists) {
			await RNFS.unlink(filePath);
		}
	} catch (error) {
		console.error(`Error deleting file ${filePath}:`, error);
		throw error;
	}
};

/**
 * Delete a backup file and its metadata
 */
export const deleteBackup = async (backupFilename: string): Promise<void> => {
	try {
		const backupPath = getBackupPath(backupFilename);
		const metadataPath = getMetadataPath(backupFilename);

		await deleteFile(backupPath);
		await deleteFile(metadataPath);
	} catch (error) {
		console.error(`Error deleting backup ${backupFilename}:`, error);
		throw error;
	}
};

/**
 * Check if a file exists
 */
export const fileExists = async (filePath: string): Promise<boolean> => {
	try {
		return await RNFS.exists(filePath);
	} catch (error) {
		console.error(`Error checking file existence ${filePath}:`, error);
		return false;
	}
};

/**
 * Get file size in bytes
 */
export const getFileSize = async (filePath: string): Promise<number> => {
	try {
		const stat = await RNFS.stat(filePath);
		return stat.size;
	} catch (error) {
		console.error(`Error getting file size ${filePath}:`, error);
		return 0;
	}
};

/**
 * Generate backup filename with timestamp
 */
export const generateBackupFilename = (walletId: string): string => {
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	return `${timestamp}-${walletId}.backup`;
};

