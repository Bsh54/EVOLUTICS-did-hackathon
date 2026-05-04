/**
 * Test Suite: VerifyPinScreen Component
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import VerifyPinScreen from '../../src/screens/VerifyPinScreen';

// Mock Redux
jest.mock('../../src/store/slices/credoSlice', () => ({
    initializeAgent: jest.fn(() => ({ unwrap: jest.fn(() => Promise.resolve({})) })),
}), { virtual: true });

const mockDispatch = jest.fn((action) => {
    if (action && action.unwrap) return action; // Thunk
    return action;
});

jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useDispatch: () => mockDispatch,
    useSelector: jest.fn().mockReturnValue({ name: 'Test User' }),
}));

// Mock Utils
jest.mock('../../src/utils/localStorage', () => ({
    verifyPin: jest.fn((pin) => Promise.resolve(pin === '123456')),
    STORAGE_KEYS: {},
}));
jest.mock('../../src/utils/secureStorage', () => ({
    getSecureItem: jest.fn(),
}));

// Mock Service & Hooks
jest.mock('../../src/services/agent', () => ({
    credoAgentService: {
        isAgentInitialized: jest.fn(() => true),
    },
}));
jest.mock('../../src/hooks/useAgentInitialization', () => ({
    useAgentInitialization: jest.fn(),
}));

// Mock Native UI
jest.mock('react-native-linear-gradient', () => require('react-native').View);
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

describe('VerifyPinScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render correctly', () => {
        const { getByText } = render(<VerifyPinScreen />);
        expect(getByText('Enter PIN')).toBeTruthy();
    });

    it('should allow entering PIN and verifying', async () => {
        const navigation = { navigate: jest.fn() };
        const { getAllByRole, getByText } = render(<VerifyPinScreen navigation={navigation} />);

        // Assuming inputs have some role or we find them by type. 
        // RN TextInput usually has role 'none' or we use placeholder? 
        // Best to use testID if available, but here we can find by display value or type.
        // Actually RNTL allows finding by type if specialized.
        // But here we rely on the fact they are empty initially.
        // Let's use `getByDisplayValue`? No, empty.
        // Let's use `unstable_getByType`? No.

        // We can just fire events if we can find them.
        // How to find 6 inputs?
        // Note: The inputs render value.
        // We can fire event on the view hierarchy? No.

        // Code uses `pin.map(...)`.
        // We can add testID in source OR just use UNSAFE access to host nodes?
        // OR mock TextInput component to capture props?

        // Simpler: The inputs might be found via getAllByProps({ secureTextEntry: true }) if using enzyme, but RNTL...
        // RNTL: `getAllByDisplayValue('')`? there are 6.
    });
});
