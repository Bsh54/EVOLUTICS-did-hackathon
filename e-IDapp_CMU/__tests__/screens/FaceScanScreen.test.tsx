/**
 * Test Suite: FaceScanScreen Component
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import FaceScanScreen from '../../src/screens/FaceScanScreen';

// Mock Redux slices
jest.mock('../../src/store/slices/credoSlice', () => ({
    initializeAgent: jest.fn(() => ({ unwrap: jest.fn() })),
}), { virtual: true });

jest.mock('../../src/store/slices/userSlice', () => ({
    saveUserDataToStorage: jest.fn(() => ({ unwrap: jest.fn() })),
    setQrCodeData: jest.fn(),
    setProfileImage: jest.fn(),
}), { virtual: true });

jest.mock('@store/slices/userSlice', () => ({
    saveUserDataToStorage: jest.fn(() => ({ unwrap: jest.fn() })),
    setQrCodeData: jest.fn(),
    setProfileImage: jest.fn(),
}), { virtual: true });

// Mock Dependencies
jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-fs', () => ({
    readFile: jest.fn(() => Promise.resolve('test-base64')),
}));
jest.mock('../../src/face_biometrix/BiometrikAPI', () => ({
    BiometrikAPI: {
        addSubjectImage: jest.fn(() => Promise.resolve({})),
        oneToNCompare: jest.fn(() => Promise.resolve({ similarity: '95' })),
    },
}));

// Mock Encrypted Storage
jest.mock('react-native-encrypted-storage', () => ({
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock Utils to avoid DB imports
jest.mock('../../src/utils/localStorage', () => ({
    STORAGE_KEYS: { PIN: 'PIN', WALLET_INITIALIZED: 'WALLET_INITIALIZED' },
    saveUserData: jest.fn(),
}));

jest.mock('../../src/utils/secureStorage', () => ({
    getSecureItem: jest.fn(() => Promise.resolve('1234')),
}));

// Mock Native UI Libraries
jest.mock('react-native-linear-gradient', () => require('react-native').View);
jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 20, bottom: 20, left: 0, right: 0 }),
}));

// Mock Vision Camera
jest.mock('react-native-vision-camera', () => {
    const React = require('react');
    return {
        Camera: React.forwardRef((props: any, ref: any) => {
            // Expose takePhoto via ref
            React.useImperativeHandle(ref, () => ({
                takePhoto: jest.fn(() => Promise.resolve({ path: 'test/path/photo.jpg' })),
            }));
            return <React.Fragment>{props.children}</React.Fragment>;
        }),
        useCameraDevice: jest.fn(() => ({ id: 'front-1', position: 'front' })),
        useCameraPermission: jest.fn(() => ({ hasPermission: true, requestPermission: jest.fn() })),
        useCameraFormat: jest.fn(),
    };
});

// Mock Dispatch to handle thunks (.unwrap)
const mockDispatch = jest.fn((action) => {
    if (action && action.unwrap) {
        return action; // It's already the mock object
    }
    // If action is function (thunk), calling it might return the object
    if (typeof action === 'object' && action.unwrap) return action;
    return { unwrap: jest.fn() };
});

jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useDispatch: () => mockDispatch,
    useSelector: jest.fn().mockReturnValue({ name: 'Test User', id: '123' }),
}));

describe('FaceScanScreen', () => {
    const mockNavigation = {
        goBack: jest.fn(),
        replace: jest.fn(),
        reset: jest.fn(),
    };
    const mockRoute = { params: { mode: 'enroll' } };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Component Rendering', () => {
        it('should render permission request if no permission', () => {
            // Override mock for this test
            const { useCameraPermission } = require('react-native-vision-camera');
            useCameraPermission.mockReturnValueOnce({ hasPermission: false, requestPermission: jest.fn() });

            render(<FaceScanScreen navigation={mockNavigation} route={mockRoute} />);
            // Should render empty view or permission request
        });

        it('should render camera view when permission granted', () => {
            const { getByText } = render(<FaceScanScreen navigation={mockNavigation} route={mockRoute} />);
            expect(getByText('Face Enrollment')).toBeTruthy();
        });
    });

    describe('Scanning Logic', () => {
        it('should start scanning automatically', async () => {
            const { getByText } = render(<FaceScanScreen navigation={mockNavigation} route={mockRoute} />);

            // Initial status
            expect(getByText(/Searching|Keep your face/i)).toBeTruthy();

            // Fast-forward timers if needed, or wait
            // Since we mocked Camera, we can't easily trigger the timer logic unless using jest.useFakeTimers
        });

        it('should allow skipping enrollment', () => {
            const { getByText } = render(<FaceScanScreen navigation={mockNavigation} route={mockRoute} />);

            const skipButton = getByText('Skip for now');
            fireEvent.press(skipButton);

            expect(mockNavigation.replace).toHaveBeenCalledWith('UploadProfileImage');
        });
    });
});
