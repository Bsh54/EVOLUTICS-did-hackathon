/**
 * Mock for Database
 * 
 * Mocks the local database initialization
 */

module.exports = {
    database: {
        write: jest.fn((callback) => Promise.resolve(callback())),
        read: jest.fn((callback) => Promise.resolve(callback())),
        collections: {
            get: jest.fn(() => ({
                query: jest.fn(() => Promise.resolve([])),
                create: jest.fn(() => Promise.resolve({})),
            })),
        },
    },
};
