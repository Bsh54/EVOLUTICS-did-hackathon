/**
 * Mock for React Native Async Storage
 * 
 * Provides an in-memory storage implementation for testing.
 * All storage operations are synchronous in tests for simplicity.
 */

let storage = {};

const AsyncStorage = {
    /**
     * Set a value in storage
     */
    setItem: jest.fn((key, value) => {
        return new Promise((resolve) => {
            storage[key] = value;
            resolve(null);
        });
    }),

    /**
     * Get a value from storage
     */
    getItem: jest.fn((key) => {
        return new Promise((resolve) => {
            resolve(storage[key] || null);
        });
    }),

    /**
     * Remove a value from storage
     */
    removeItem: jest.fn((key) => {
        return new Promise((resolve) => {
            delete storage[key];
            resolve(null);
        });
    }),

    /**
     * Merge a value with existing storage
     */
    mergeItem: jest.fn((key, value) => {
        return new Promise((resolve) => {
            storage[key] = JSON.stringify({
                ...JSON.parse(storage[key] || '{}'),
                ...JSON.parse(value),
            });
            resolve(null);
        });
    }),

    /**
     * Clear all storage
     */
    clear: jest.fn(() => {
        return new Promise((resolve) => {
            storage = {};
            resolve(null);
        });
    }),

    /**
     * Get all keys
     */
    getAllKeys: jest.fn(() => {
        return new Promise((resolve) => {
            resolve(Object.keys(storage));
        });
    }),

    /**
     * Multi get
     */
    multiGet: jest.fn((keys) => {
        return new Promise((resolve) => {
            const result = keys.map((key) => [key, storage[key] || null]);
            resolve(result);
        });
    }),

    /**
     * Multi set
     */
    multiSet: jest.fn((keyValuePairs) => {
        return new Promise((resolve) => {
            keyValuePairs.forEach(([key, value]) => {
                storage[key] = value;
            });
            resolve(null);
        });
    }),

    /**
     * Multi remove
     */
    multiRemove: jest.fn((keys) => {
        return new Promise((resolve) => {
            keys.forEach((key) => {
                delete storage[key];
            });
            resolve(null);
        });
    }),
};

export default AsyncStorage;
