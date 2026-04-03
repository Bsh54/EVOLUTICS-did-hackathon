import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import {
	getDocumentsDirectory,
	getBackupDirectory,
	ensureBackupDirectory,
	listBackups,
	getBackupPath,
	getMetadataPath,
	readFile,
	writeFile,
	deleteFile,
	deleteBackup,
	fileExists,
	getFileSize,
	generateBackupFilename,
	BACKUP_DIRECTORY,
} from '../fileSystem';

// Mock RNFS
jest.mock('react-native-fs', () => ({
	DocumentDirectoryPath: '/mock/docs',
	exists: jest.fn(),
	mkdir: jest.fn(),
	readdir: jest.fn(),
	readFile: jest.fn(),
	writeFile: jest.fn(),
	unlink: jest.fn(),
	stat: jest.fn(),
}));

describe('fileSystem', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('getDocumentsDirectory', () => {
		it('should return the document directory path', () => {
			const path = getDocumentsDirectory();
			expect(path).toBe('/mock/docs');
		});
	});

	describe('getBackupDirectory', () => {
		it('should return the backup directory path', () => {
			const path = getBackupDirectory();
			expect(path).toBe(`/mock/docs/${BACKUP_DIRECTORY}`);
		});
	});

	describe('ensureBackupDirectory', () => {
		it('should create directory if it does not exist', async () => {
			(RNFS.exists as jest.Mock).mockResolvedValue(false);
			const path = await ensureBackupDirectory();

			expect(RNFS.exists).toHaveBeenCalledWith(expect.stringContaining(BACKUP_DIRECTORY));
			expect(RNFS.mkdir).toHaveBeenCalledWith(expect.stringContaining(BACKUP_DIRECTORY));
			expect(path).toBe(`/mock/docs/${BACKUP_DIRECTORY}`);
		});

		it('should not create directory if it already exists', async () => {
			(RNFS.exists as jest.Mock).mockResolvedValue(true);
			const path = await ensureBackupDirectory();

			expect(RNFS.exists).toHaveBeenCalled();
			expect(RNFS.mkdir).not.toHaveBeenCalled();
			expect(path).toBe(`/mock/docs/${BACKUP_DIRECTORY}`);
		});
	});

	describe('listBackups', () => {
		it('should return only .backup files', async () => {
			(RNFS.exists as jest.Mock).mockResolvedValue(true);
			(RNFS.readdir as jest.Mock).mockResolvedValue([
				'backup1.backup',
				'backup1.meta.json',
				'other.txt',
				'backup2.backup',
			]);

			const backups = await listBackups();

			expect(backups).toEqual(['backup1.backup', 'backup2.backup']);
		});

		it('should return empty array on error', async () => {
			(RNFS.exists as jest.Mock).mockRejectedValue(new Error('error'));
			const backups = await listBackups();
			expect(backups).toEqual([]);
		});
	});

	describe('getBackupPath', () => {
		it('should return full path for a backup file', () => {
			const filename = 'test.backup';
			const path = getBackupPath(filename);
			expect(path).toBe(`/mock/docs/${BACKUP_DIRECTORY}/${filename}`);
		});
	});

	describe('getMetadataPath', () => {
		it('should return metadata path for a backup filename', () => {
			const filename = 'test.backup';
			const path = getMetadataPath(filename);
			expect(path).toBe(`/mock/docs/${BACKUP_DIRECTORY}/test.meta.json`);
		});
	});

	describe('readFile/writeFile', () => {
		it('should call RNFS.readFile', async () => {
			(RNFS.readFile as jest.Mock).mockResolvedValue('content');
			const content = await readFile('path');
			expect(RNFS.readFile).toHaveBeenCalledWith('path', 'utf8');
			expect(content).toBe('content');
		});

		it('should call RNFS.writeFile', async () => {
			await writeFile('path', 'content');
			expect(RNFS.writeFile).toHaveBeenCalledWith('path', 'content', 'utf8');
		});
	});

	describe('deleteFile', () => {
		it('should unlink file if it exists', async () => {
			(RNFS.exists as jest.Mock).mockResolvedValue(true);
			await deleteFile('path');
			expect(RNFS.unlink).toHaveBeenCalledWith('path');
		});

		it('should not unlink file if it does not exist', async () => {
			(RNFS.exists as jest.Mock).mockResolvedValue(false);
			await deleteFile('path');
			expect(RNFS.unlink).not.toHaveBeenCalled();
		});
	});

	describe('deleteBackup', () => {
		it('should delete both backup and metadata files', async () => {
			(RNFS.exists as jest.Mock).mockResolvedValue(true);
			await deleteBackup('test.backup');

			expect(RNFS.unlink).toHaveBeenCalledTimes(2);
			expect(RNFS.unlink).toHaveBeenCalledWith(expect.stringContaining('test.backup'));
			expect(RNFS.unlink).toHaveBeenCalledWith(expect.stringContaining('test.meta.json'));
		});
	});

	describe('fileExists', () => {
		it('should return true if file exists', async () => {
			(RNFS.exists as jest.Mock).mockResolvedValue(true);
			const exists = await fileExists('path');
			expect(exists).toBe(true);
		});

		it('should return false if file does not exist', async () => {
			(RNFS.exists as jest.Mock).mockResolvedValue(false);
			const exists = await fileExists('path');
			expect(exists).toBe(false);
		});
	});

	describe('getFileSize', () => {
		it('should return file size', async () => {
			(RNFS.stat as jest.Mock).mockResolvedValue({ size: 1234 });
			const size = await getFileSize('path');
			expect(size).toBe(1234);
		});
	});

	describe('generateBackupFilename', () => {
		it('should generate filename with timestamp and walletId', () => {
			const walletId = 'wallet-123';
			const filename = generateBackupFilename(walletId);

			expect(filename).toContain(walletId);
			expect(filename).toMatch(/\.backup$/);
			expect(filename).toMatch(/^\d{4}-\d{2}-\d{2}T/); // Starts with date
		});
	});
});

