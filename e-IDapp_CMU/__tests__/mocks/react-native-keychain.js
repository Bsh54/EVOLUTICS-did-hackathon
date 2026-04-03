/**
 * Mock for React Native Keychain
 * 
 * Provides mock implementations for secure credential storage in tests.
 */

let credentials = {};

export default {
    /**
     * Set generic password
     */
    setGenericPassword: jest.fn((username, password, options) => {
        return Promise.resolve({
            service: options?.service || 'default',
            storage: 'keychain',
        });
    }),

    /**
     * Get generic password
     */
    getGenericPassword: jest.fn((options) => {
        return Promise.resolve({
            username: 'testuser',
            password: 'testpassword',
            service: options?.service || 'default',
            storage: 'keychain',
        });
    }),

    /**
     * Reset generic password
     */
    resetGenericPassword: jest.fn((options) => {
        return Promise.resolve(true);
    }),

    /**
     * Check if credentials exist
     */
    hasGenericPassword: jest.fn((options) => {
        return Promise.resolve(true);
    }),

    /**
     * Set internet credentials
     */
    setInternetCredentials: jest.fn((server, username, password, options) => {
        return Promise.resolve();
    }),

    /**
     * Get internet credentials
     */
    getInternetCredentials: jest.fn((server, options) => {
        return Promise.resolve({
            username: 'testuser',
            password: 'testpassword',
        });
    }),

    /**
     * Reset internet credentials
     */
    resetInternetCredentials: jest.fn((server, options) => {
        return Promise.resolve();
    }),

    /**
     * Get supported biometry type
     */
    getSupportedBiometryType: jest.fn(() => {
        return Promise.resolve('FaceID');
    }),

    // Access control constants
    ACCESS_CONTROL: {
        USER_PRESENCE: 'UserPresence',
        BIOMETRY_ANY: 'BiometryAny',
        BIOMETRY_CURRENT_SET: 'BiometryCurrentSet',
        DEVICE_PASSCODE: 'DevicePasscode',
        APPLICATION_PASSWORD: 'ApplicationPassword',
        BIOMETRY_ANY_OR_DEVICE_PASSCODE: 'BiometryAnyOrDevicePasscode',
        BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE: 'BiometryCurrentSetOrDevicePasscode',
    },

    // Authentication type constants
    AUTHENTICATION_TYPE: {
        DEVICE_PASSCODE_OR_BIOMETRICS: 'AuthenticationWithBiometricsDevicePasscode',
        BIOMETRICS: 'AuthenticationWithBiometrics',
    },

    // Biometry type constants
    BIOMETRY_TYPE: {
        TOUCH_ID: 'TouchID',
        FACE_ID: 'FaceID',
        FINGERPRINT: 'Fingerprint',
        FACE: 'Face',
        IRIS: 'Iris',
    },
};
