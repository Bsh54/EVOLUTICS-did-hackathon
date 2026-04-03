/**
 * Mock for React Native Permissions
 * 
 * Provides mock implementations for permission handling in tests.
 */

export const PERMISSIONS = {
    IOS: {
        CAMERA: 'ios.permission.CAMERA',
        MICROPHONE: 'ios.permission.MICROPHONE',
        PHOTO_LIBRARY: 'ios.permission.PHOTO_LIBRARY',
        LOCATION_WHEN_IN_USE: 'ios.permission.LOCATION_WHEN_IN_USE',
        FACE_ID: 'ios.permission.FACE_ID',
    },
    ANDROID: {
        CAMERA: 'android.permission.CAMERA',
        RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
        READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
        WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
        ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
    },
};

export const RESULTS = {
    UNAVAILABLE: 'unavailable',
    DENIED: 'denied',
    GRANTED: 'granted',
    BLOCKED: 'blocked',
    LIMITED: 'limited',
};

export const check = jest.fn(() => Promise.resolve(RESULTS.GRANTED));
export const request = jest.fn(() => Promise.resolve(RESULTS.GRANTED));
export const checkMultiple = jest.fn((permissions) => {
    const result = {};
    permissions.forEach((permission) => {
        result[permission] = RESULTS.GRANTED;
    });
    return Promise.resolve(result);
});
export const requestMultiple = jest.fn((permissions) => {
    const result = {};
    permissions.forEach((permission) => {
        result[permission] = RESULTS.GRANTED;
    });
    return Promise.resolve(result);
});

export default {
    PERMISSIONS,
    RESULTS,
    check,
    request,
    checkMultiple,
    requestMultiple,
};
