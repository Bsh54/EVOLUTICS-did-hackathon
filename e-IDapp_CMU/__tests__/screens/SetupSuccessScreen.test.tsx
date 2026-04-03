/**
 * Test Suite: SetupSuccessScreen Component
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SetupSuccessScreen from '../../src/screens/SetupSuccessScreen';

// Mock Redux user slice
jest.mock('../../src/store/slices/userSlice', () => ({
    saveUserDataToStorage: jest.fn(() => ({ type: 'user/saveUserDataToStorage' })),
}), { virtual: true });

jest.mock('@store/slices/userSlice', () => ({
    saveUserDataToStorage: jest.fn(() => ({ type: 'user/saveUserDataToStorage' })),
}), { virtual: true });

describe('SetupSuccessScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render notification text', () => {
        const { getByText } = render(<SetupSuccessScreen />);
        expect(getByText(/User gets a popup/i)).toBeTruthy();
    });

    it('should save data and navigate on Accept', () => {
        const navigation = { navigate: jest.fn() };
        const { getByText } = render(<SetupSuccessScreen navigation={navigation} />);

        const acceptButton = getByText('Accept');
        fireEvent.press(acceptButton);

        const { saveUserDataToStorage } = require('../../src/store/slices/userSlice');
        expect(saveUserDataToStorage).toHaveBeenCalled();
        expect(navigation.navigate).toHaveBeenCalledWith('Dashboard');
    });
});
