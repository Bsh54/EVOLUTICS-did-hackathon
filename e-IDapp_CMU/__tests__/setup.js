/* eslint-disable no-undef */
import 'react-native';

// Mock react-native-fs
jest.mock('react-native-fs', () => ({
	DocumentDirectoryPath: '/mock/docs',
	exists: jest.fn().mockResolvedValue(true),
	mkdir: jest.fn().mockResolvedValue(true),
	readdir: jest.fn().mockResolvedValue([]),
	readFile: jest.fn().mockResolvedValue(''),
	writeFile: jest.fn().mockResolvedValue(true),
	unlink: jest.fn().mockResolvedValue(true),
	stat: jest.fn().mockResolvedValue({ size: 1024 }),
}));

// Mock react-native-aes-crypto
jest.mock('react-native-aes-crypto', () => ({
	pbkdf2: jest.fn().mockResolvedValue('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
	encrypt: jest.fn().mockResolvedValue('encrypted-data'),
	decrypt: jest.fn().mockResolvedValue('decrypted-data'),
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
	setItem: jest.fn(),
	getItem: jest.fn(),
	removeItem: jest.fn(),
	clear: jest.fn(),
}));

// Mock crypto.getRandomValues for generateSalt/generateIv
if (typeof global.crypto === 'undefined') {
	global.crypto = {
		getRandomValues: (arr) => {
			for (let i = 0; i < arr.length; i++) {
				arr[ i ] = Math.floor(Math.random() * 256);
			}
			return arr;
		},
	};
}

