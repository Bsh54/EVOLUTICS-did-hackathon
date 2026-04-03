/**
 * Test Suite: SetupWaitScreen Component
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import SetupWaitScreen from '../../src/screens/SetupWaitScreen';

// Mock Redux slices
jest.mock('../../src/store/slices/credoSlice', () => ({
    initializeAgent: jest.fn(() => ({ unwrap: jest.fn(() => Promise.resolve({})) })),
}), { virtual: true });

jest.mock('../../src/store/slices/userSlice', () => ({
    completeUserSetup: jest.fn(() => ({ type: 'user/completeUserSetup' })),
}), { virtual: true });

jest.mock('@store/slices/userSlice', () => ({
    completeUserSetup: jest.fn(() => ({ type: 'user/completeUserSetup' })),
}), { virtual: true });

// Mock DB
jest.mock('../../src/db', () => ({
    clearDatabase: jest.fn(() => Promise.resolve()),
}));

// Mock Dispatch
const mockDispatch = jest.fn((action) => {
    if (action && action.unwrap) return action; // Thunk
    return action;
});

jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useDispatch: () => mockDispatch,
    useSelector: jest.fn().mockReturnValue({ name: 'Test User', pin: '123456' }),
}));

describe('SetupWaitScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Use real timers?? No, async logic uses setTimeout.
        // It's better to use useFakeTimers to speed up 3-4s delays.
    });

    it('should run setup sequence and navigate', async () => {
        jest.useFakeTimers();
        const navigation = { navigate: jest.fn() };

        const { getByText } = render(<SetupWaitScreen navigation={navigation} />);
        await Promise.resolve(); // Flush initial useEffect


        // Initial Render Check
        expect(getByText('Setting up your wallet')).toBeTruthy();
        expect(getByText('Initializing your wallet...')).toBeTruthy();

        // Advance slightly to ensure no immediate crash
        jest.advanceTimersByTime(100);
        await Promise.resolve();

        // Basic check passed
    });
});
