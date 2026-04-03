/**
 * Test Suite: Backup Encryption Utilities
 * 
 * Tests for the backup encryption utilities which handle PIN-based
 * encryption and decryption of wallet backups.
 */
import {
    generateSalt,
    encryptWithPin,
    decryptWithPin,
    encryptBackupFile,
    decryptBackupFile,
} from '../../../../src/features/wallet-backup/utils/backupEncryption';

// Mock react-native-aes-crypto
jest.mock('react-native-aes-crypto', () => ({
    pbkdf2: jest.fn().mockResolvedValue('a'.repeat(64)), // 64 hex chars = 32 bytes
    encrypt: jest.fn().mockResolvedValue('encrypted-data-base64'),
    decrypt: jest.fn().mockResolvedValue('decrypted-data'),
}));

// Mock crypto for salt generation
const mockGetRandomValues = jest.fn((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
});

global.crypto = {
    getRandomValues: mockGetRandomValues,
} as any;

describe('Backup Encryption Utilities', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Silence console logs and errors during tests
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    describe('generateSalt', () => {
        it('should generate a salt of 64 hex characters (32 bytes)', () => {
            const salt = generateSalt();
            expect(salt).toHaveLength(64);
        });

        it('should generate unique salts', () => {
            const salt1 = generateSalt();
            const salt2 = generateSalt();
            expect(salt1).not.toEqual(salt2);
        });

        it('should generate valid hex string', () => {
            const salt = generateSalt();
            expect(salt).toMatch(/^[0-9a-f]+$/);
        });

        it('should use crypto.getRandomValues when available', () => {
            generateSalt();
            expect(mockGetRandomValues).toHaveBeenCalled();
        });
    });

    describe('encryptWithPin', () => {
        const testData = 'test data to encrypt';
        const testPin = '123456';

        it('should return encrypted data, salt, and iv', async () => {
            const result = await encryptWithPin(testData, testPin);

            expect(result).toHaveProperty('encryptedData');
            expect(result).toHaveProperty('salt');
            expect(result).toHaveProperty('iv');
        });

        it('should generate unique salt for each encryption', async () => {
            const result1 = await encryptWithPin(testData, testPin);
            const result2 = await encryptWithPin(testData, testPin);

            expect(result1.salt).not.toEqual(result2.salt);
        });

        it('should generate unique IV for each encryption', async () => {
            const result1 = await encryptWithPin(testData, testPin);
            const result2 = await encryptWithPin(testData, testPin);

            expect(result1.iv).not.toEqual(result2.iv);
        });

        it('should call PBKDF2 for key derivation', async () => {
            const AES = require('react-native-aes-crypto');

            await encryptWithPin(testData, testPin);

            expect(AES.pbkdf2).toHaveBeenCalledWith(
                testPin,
                expect.any(String),
                10000, // iterations
                256,   // key size
                'sha256'
            );
        });

        it('should call AES encrypt with derived key', async () => {
            const AES = require('react-native-aes-crypto');

            await encryptWithPin(testData, testPin);

            expect(AES.encrypt).toHaveBeenCalledWith(
                testData,
                expect.any(String), // derived key
                expect.any(String), // iv
                'aes-256-cbc'
            );
        });

        it('should throw error when key derivation fails', async () => {
            const AES = require('react-native-aes-crypto');
            AES.pbkdf2.mockRejectedValueOnce(new Error('Key derivation failed'));

            await expect(encryptWithPin(testData, testPin))
                .rejects.toThrow('Failed to encrypt backup data');
        });

        it('should throw error when encryption fails', async () => {
            const AES = require('react-native-aes-crypto');
            AES.encrypt.mockRejectedValueOnce(new Error('Encryption failed'));

            await expect(encryptWithPin(testData, testPin))
                .rejects.toThrow('Failed to encrypt backup data');
        });

        it('should reject if key length is invalid', async () => {
            const AES = require('react-native-aes-crypto');
            AES.pbkdf2.mockResolvedValueOnce('short'); // Invalid key length

            await expect(encryptWithPin(testData, testPin))
                .rejects.toThrow();
        });
    });

    describe('decryptWithPin', () => {
        const encryptedData = 'encrypted-data-base64';
        const testPin = '123456';
        const testSalt = 'a'.repeat(64);
        const testIv = 'b'.repeat(32);

        it('should return decrypted data', async () => {
            const result = await decryptWithPin(encryptedData, testPin, testSalt, testIv);

            expect(result).toBe('decrypted-data');
        });

        it('should call PBKDF2 for key derivation', async () => {
            const AES = require('react-native-aes-crypto');

            await decryptWithPin(encryptedData, testPin, testSalt, testIv);

            expect(AES.pbkdf2).toHaveBeenCalledWith(
                testPin,
                testSalt,
                10000,
                256,
                'sha256'
            );
        });

        it('should call AES decrypt with derived key', async () => {
            const AES = require('react-native-aes-crypto');

            await decryptWithPin(encryptedData, testPin, testSalt, testIv);

            expect(AES.decrypt).toHaveBeenCalledWith(
                encryptedData,
                expect.any(String), // derived key
                testIv,
                'aes-256-cbc'
            );
        });

        it('should throw error when decryption fails', async () => {
            const AES = require('react-native-aes-crypto');
            AES.decrypt.mockRejectedValueOnce(new Error('Decryption failed'));

            await expect(decryptWithPin(encryptedData, testPin, testSalt, testIv))
                .rejects.toThrow('Failed to decrypt backup data');
        });
    });

    describe('encryptBackupFile', () => {
        const testData = 'backup file content';
        const testPin = '123456';

        it('should return JSON string with encrypted package', async () => {
            const result = await encryptBackupFile(testData, testPin);
            const parsed = JSON.parse(result);

            expect(parsed).toHaveProperty('version');
            expect(parsed).toHaveProperty('algorithm');
            expect(parsed).toHaveProperty('iterations');
            expect(parsed).toHaveProperty('salt');
            expect(parsed).toHaveProperty('iv');
            expect(parsed).toHaveProperty('data');
        });

        it('should include correct version', async () => {
            const result = await encryptBackupFile(testData, testPin);
            const parsed = JSON.parse(result);

            expect(parsed.version).toBe('1.0');
        });

        it('should include correct algorithm', async () => {
            const result = await encryptBackupFile(testData, testPin);
            const parsed = JSON.parse(result);

            expect(parsed.algorithm).toBe('aes-256-cbc');
        });

        it('should include correct iterations count', async () => {
            const result = await encryptBackupFile(testData, testPin);
            const parsed = JSON.parse(result);

            expect(parsed.iterations).toBe(10000);
        });
    });

    describe('decryptBackupFile', () => {
        const testPin = '123456';

        it('should decrypt valid encrypted package', async () => {
            const encryptedPackage = JSON.stringify({
                version: '1.0',
                algorithm: 'aes-256-cbc',
                iterations: 10000,
                salt: 'a'.repeat(64),
                iv: 'b'.repeat(32),
                data: 'encrypted-data',
            });

            const result = await decryptBackupFile(encryptedPackage, testPin);

            expect(result).toBe('decrypted-data');
        });

        it('should throw error for invalid package structure - missing salt', async () => {
            const invalidPackage = JSON.stringify({
                version: '1.0',
                iv: 'test-iv',
                data: 'encrypted-data',
            });

            await expect(decryptBackupFile(invalidPackage, testPin))
                .rejects.toThrow('Invalid backup file format');
        });

        it('should throw error for invalid package structure - missing iv', async () => {
            const invalidPackage = JSON.stringify({
                version: '1.0',
                salt: 'test-salt',
                data: 'encrypted-data',
            });

            await expect(decryptBackupFile(invalidPackage, testPin))
                .rejects.toThrow('Invalid backup file format');
        });

        it('should throw error for invalid package structure - missing data', async () => {
            const invalidPackage = JSON.stringify({
                version: '1.0',
                salt: 'test-salt',
                iv: 'test-iv',
            });

            await expect(decryptBackupFile(invalidPackage, testPin))
                .rejects.toThrow('Invalid backup file format');
        });

        it('should throw error for invalid JSON', async () => {
            await expect(decryptBackupFile('invalid-json', testPin))
                .rejects.toThrow('Failed to decrypt backup file');
        });

        it('should throw error when decryption fails', async () => {
            const AES = require('react-native-aes-crypto');
            AES.decrypt.mockRejectedValueOnce(new Error('Wrong PIN'));

            const validPackage = JSON.stringify({
                version: '1.0',
                salt: 'a'.repeat(64),
                iv: 'b'.repeat(32),
                data: 'encrypted-data',
            });

            await expect(decryptBackupFile(validPackage, testPin))
                .rejects.toThrow('Failed to decrypt backup file');
        });
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });
});
