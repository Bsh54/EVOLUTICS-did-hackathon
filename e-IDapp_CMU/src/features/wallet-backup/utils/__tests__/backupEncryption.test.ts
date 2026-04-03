import AES from 'react-native-aes-crypto';
import {
	generateSalt,
	encryptWithPin,
	decryptWithPin,
	encryptBackupFile,
	decryptBackupFile,
} from '../backupEncryption';

// Mock AES crypto
jest.mock('react-native-aes-crypto', () => ({
	pbkdf2: jest.fn().mockResolvedValue('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
	encrypt: jest.fn().mockResolvedValue('encrypted-data-base64'),
	decrypt: jest.fn().mockResolvedValue('decrypted-data-string'),
}));

describe('backupEncryption', () => {
	const mockPin = '123456';
	const mockData = 'test-wallet-data';

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('generateSalt', () => {
		it('should generate a 64-character hex string (32 bytes)', () => {
			const salt = generateSalt();
			expect(salt).toHaveLength(64);
			expect(salt).toMatch(/^[0-9a-f]+$/);
		});

		it('should generate different salts on consecutive calls', () => {
			const salt1 = generateSalt();
			const salt2 = generateSalt();
			expect(salt1).not.toBe(salt2);
		});
	});

	describe('encryptWithPin', () => {
		it('should derive key and encrypt data', async () => {
			const result = await encryptWithPin(mockData, mockPin);

			expect(AES.pbkdf2).toHaveBeenCalledWith(
				mockPin,
				expect.any(String),
				10000,
				256,
				'sha256'
			);
			expect(AES.encrypt).toHaveBeenCalledWith(
				mockData,
				expect.any(String),
				expect.any(String),
				'aes-256-cbc'
			);
			expect(result).toEqual({
				encryptedData: 'encrypted-data-base64',
				salt: expect.any(String),
				iv: expect.any(String),
			});
		});

		it('should throw error if encryption fails', async () => {
			(AES.encrypt as jest.Mock).mockRejectedValueOnce(new Error('Encryption failed'));
			await expect(encryptWithPin(mockData, mockPin)).rejects.toThrow('Failed to encrypt backup data');
		});
	});

	describe('decryptWithPin', () => {
		const mockSalt = 'mock-salt';
		const mockIv = 'mock-iv';
		const mockEncryptedData = 'encrypted-data';

		it('should derive key and decrypt data', async () => {
			const result = await decryptWithPin(mockEncryptedData, mockPin, mockSalt, mockIv);

			expect(AES.pbkdf2).toHaveBeenCalledWith(
				mockPin,
				mockSalt,
				10000,
				256,
				'sha256'
			);
			expect(AES.decrypt).toHaveBeenCalledWith(
				mockEncryptedData,
				expect.any(String),
				mockIv,
				'aes-256-cbc'
			);
			expect(result).toBe('decrypted-data-string');
		});

		it('should throw error if decryption fails', async () => {
			(AES.decrypt as jest.Mock).mockRejectedValueOnce(new Error('Decryption failed'));
			await expect(decryptWithPin(mockEncryptedData, mockPin, mockSalt, mockIv))
				.rejects.toThrow('Failed to decrypt backup data');
		});
	});

	describe('encryptBackupFile', () => {
		it('should return a JSON string containing encrypted data and metadata', async () => {
			const resultJson = await encryptBackupFile(mockData, mockPin);
			const result = JSON.parse(resultJson);

			expect(result).toMatchObject({
				version: '1.0',
				algorithm: 'aes-256-cbc',
				iterations: 10000,
				salt: expect.any(String),
				iv: expect.any(String),
				data: 'encrypted-data-base64',
			});
		});
	});

	describe('decryptBackupFile', () => {
		it('should parse JSON and decrypt data', async () => {
			const mockPackage = JSON.stringify({
				version: '1.0',
				algorithm: 'aes-256-cbc',
				iterations: 10000,
				salt: 'some-salt',
				iv: 'some-iv',
				data: 'some-encrypted-data',
			});

			const result = await decryptBackupFile(mockPackage, mockPin);

			expect(result).toBe('decrypted-data-string');
			expect(AES.decrypt).toHaveBeenCalledWith(
				'some-encrypted-data',
				expect.any(String),
				'some-iv',
				'aes-256-cbc'
			);
		});

		it('should throw error for invalid JSON format', async () => {
			const invalidJson = 'invalid-json';
			await expect(decryptBackupFile(invalidJson, mockPin)).rejects.toThrow();
		});

		it('should throw error if required fields are missing', async () => {
			const incompletePackage = JSON.stringify({
				version: '1.0',
				data: 'some-data',
			});
			await expect(decryptBackupFile(incompletePackage, mockPin)).rejects.toThrow('Invalid backup file format');
		});
	});
});

