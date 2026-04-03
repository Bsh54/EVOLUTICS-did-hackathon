/**
 * Mock for React Native Vision Camera
 * 
 * Provides mock implementations for camera functionality in tests.
 * This prevents actual camera access during testing.
 */

export const Camera = 'Camera';

export const useCameraDevice = jest.fn(() => ({
    id: 'mock-camera-device',
    name: 'Mock Camera',
    position: 'back',
}));

export const useCameraPermission = jest.fn(() => ({
    hasPermission: true,
    requestPermission: jest.fn(() => Promise.resolve(true)),
}));

export const useCodeScanner = jest.fn((config) => ({
    onCodeScanned: config?.onCodeScanned || jest.fn(),
    codeTypes: config?.codeTypes || ['qr'],
}));

export const useCameraFormat = jest.fn(() => ({
    videoWidth: 1920,
    videoHeight: 1080,
}));
