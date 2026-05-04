import AES from 'react-native-aes-crypto';

/**
 * Backup Encryption Utilities
 * Provides additional encryption layer for wallet backups using user PIN
 */

const ALGORITHM = 'aes-256-cbc';
const ITERATIONS = 10000; // PBKDF2 iterations
const KEY_SIZE = 256; // AES-256
const IV_SIZE = 16; // 128 bits for CBC mode

/**
 * Derive encryption key from PIN using PBKDF2
 */
const deriveKeyFromPin = async (pin: string, salt: string): Promise<string> => {
	try {
		// pbkdf2(password, salt, cost, length, algorithm)
		// For react-native-aes-crypto, the length parameter behavior can be inconsistent (bits vs bytes).
		// The error "returned key of length 4 bytes" when passing 32 suggests it interpreted 32 as bits.
		// Passing 256 (KEY_SIZE) should result in 32 bytes (256 bits).
		const keyLength = KEY_SIZE;

		console.log('PBKDF2 params:', { pinLength: pin.length, saltLength: salt.length, iterations: ITERATIONS, keyLength, algorithm: 'sha256' });

		const key = await AES.pbkdf2(pin, salt, ITERATIONS, keyLength, 'sha256');

		console.log('Derived key:', key.substring(0, 20) + '...', 'length:', key.length, 'hex chars (', key.length / 2, 'bytes)');

		// Ensure we have the correct key length
		if (key.length < 64) {
			throw new Error(`PBKDF2 returned key of length ${key.length} hex chars (${key.length / 2} bytes), expected 64 hex chars (32 bytes)`);
		}

		return key;
	} catch (error) {
		console.error('Error deriving key from PIN:', error);
		throw new Error('Failed to derive encryption key from PIN');
	}
};

/**
 * Generate a random salt for key derivation
 */
export const generateSalt = (): string => {
	// Generate 32 bytes of random data and convert to hex
	// Using crypto.getRandomValues if available, otherwise fallback to Math.random
	const randomBytes = new Uint8Array(32);
	if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
		crypto.getRandomValues(randomBytes);
	} else {
		// Fallback for environments without crypto API
		for (let i = 0; i < 32; i++) {
			randomBytes[ i ] = Math.floor(Math.random() * 256);
		}
	}
	return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Generate a random IV (Initialization Vector)
 */
const generateIv = (): string => {
	// Generate 16 bytes (IV_SIZE) of random data and convert to hex
	const randomBytes = new Uint8Array(IV_SIZE);
	if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
		crypto.getRandomValues(randomBytes);
	} else {
		// Fallback for environments without crypto API
		for (let i = 0; i < IV_SIZE; i++) {
			randomBytes[ i ] = Math.floor(Math.random() * 256);
		}
	}
	return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Encrypt data with PIN
 * Returns: { encryptedData, salt, iv } as base64 strings
 */
export const encryptWithPin = async (
	data: string,
	pin: string
): Promise<{ encryptedData: string; salt: string; iv: string }> => {
	try {
		const salt = generateSalt();
		const iv = generateIv(); // 32 hex chars = 16 bytes

		const key = await deriveKeyFromPin(pin, salt);

		// Verify key length (should be 64 hex chars = 32 bytes for AES-256)
		if (key.length !== 64) {
			throw new Error(`Invalid key length: expected 64 hex chars (32 bytes), got ${key.length} hex chars`);
		}

		const encryptedData = await AES.encrypt(data, key, iv, ALGORITHM);

		return {
			encryptedData,
			salt,
			iv,
		};
	} catch (error) {
		console.error('Error encrypting data with PIN:', error);
		throw new Error('Failed to encrypt backup data');
	}
};

/**
 * Decrypt data with PIN
 */
export const decryptWithPin = async (
	encryptedData: string,
	pin: string,
	salt: string,
	iv: string
): Promise<string> => {
	try {
		const key = await deriveKeyFromPin(pin, salt);

		const decryptedData = await AES.decrypt(encryptedData, key, iv, ALGORITHM);

		return decryptedData;
	} catch (error) {
		console.error('Error decrypting data with PIN:', error);
		throw new Error('Failed to decrypt backup data. Invalid PIN or corrupted data.');
	}
};

/**
 * Encrypt backup file content
 * Wraps the encrypted data with metadata
 */
export const encryptBackupFile = async (
	data: string,
	pin: string
): Promise<string> => {
	const { encryptedData, salt, iv } = await encryptWithPin(data, pin);

	// Create a JSON wrapper with encrypted data and metadata
	const encryptedPackage = {
		version: '1.0',
		algorithm: ALGORITHM,
		iterations: ITERATIONS,
		salt,
		iv,
		data: encryptedData,
	};

	return JSON.stringify(encryptedPackage);
};

/**
 * Decrypt backup file content
 */
export const decryptBackupFile = async (
	encryptedPackageJson: string,
	pin: string
): Promise<string> => {
	try {
		const encryptedPackage = JSON.parse(encryptedPackageJson);

		// Validate package structure
		if (!encryptedPackage.salt || !encryptedPackage.iv || !encryptedPackage.data) {
			throw new Error('Invalid backup file format');
		}

		// Decrypt the data
		const decryptedData = await decryptWithPin(
			encryptedPackage.data,
			pin,
			encryptedPackage.salt,
			encryptedPackage.iv
		);

		return decryptedData;
	} catch (error) {
		if (error instanceof Error && error.message.includes('Invalid backup file format')) {
			throw error;
		}
		throw new Error('Failed to decrypt backup file. Invalid PIN or corrupted file.');
	}
};

