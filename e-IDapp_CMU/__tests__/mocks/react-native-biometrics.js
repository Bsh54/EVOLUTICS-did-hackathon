/**
 * Mock for React Native Biometrics
 * 
 * Provides mock implementations for biometric authentication in tests.
 */

export default {
    /**
     * Check if biometrics are available
     */
    isSensorAvailable: jest.fn(() =>
        Promise.resolve({
            available: true,
            biometryType: 'FaceID',
        })
    ),

    /**
     * Create a signature
     */
    createSignature: jest.fn(() =>
        Promise.resolve({
            success: true,
            signature: 'mock-signature',
        })
    ),

    /**
     * Simple prompt
     */
    simplePrompt: jest.fn(() =>
        Promise.resolve({
            success: true,
        })
    ),

    /**
     * Create keys
     */
    createKeys: jest.fn(() =>
        Promise.resolve({
            publicKey: 'mock-public-key',
        })
    ),

    /**
     * Delete keys
     */
    deleteKeys: jest.fn(() =>
        Promise.resolve({
            keysDeleted: true,
        })
    ),

    /**
     * Check if keys exist
     */
    biometricKeysExist: jest.fn(() =>
        Promise.resolve({
            keysExist: true,
        })
    ),
};
