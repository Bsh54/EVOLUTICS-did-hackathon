/**
 * Mock for React Native Encrypted Storage
 * 
 * Provides a mock implementation of encrypted storage for testing.
 * Uses in-memory storage similar to AsyncStorage.
 */

let encryptedStorage = {};

const EncryptedStorage = {
    /**
     * Set encrypted item
     */
    setItem: jest.fn((key, value) => {
        return new Promise((resolve) => {
            encryptedStorage[key] = value;
            resolve();
        });
    }),

    /**
     * Get encrypted item
     */
    getItem: jest.fn((key) => {
        return new Promise((resolve) => {
            resolve(encryptedStorage[key] || null);
        });
    }),

    /**
     * Remove encrypted item
     */
    removeItem: jest.fn((key) => {
        return new Promise((resolve) => {
            delete encryptedStorage[key];
            resolve();
        });
    }),

    /**
     * Clear all encrypted storage
     */
    clear: jest.fn(() => {
        return new Promise((resolve) => {
            encryptedStorage = {};
            resolve();
        });
    }),
};

export default EncryptedStorage;
