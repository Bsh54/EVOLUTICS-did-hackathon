/**
 * Test Suite: CreatePinScreen Component
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CreatePinScreen from '../../src/screens/CreatePinScreen';
import { useNavigation } from '@react-navigation/native';

// Mock Redux user slice to avoid DB migration errors
jest.mock('../../src/store/slices/userSlice', () => ({
    setUserPin: jest.fn((pin) => ({ type: 'user/setPin', payload: pin })),
}), { virtual: true });

jest.mock('@store/slices/userSlice', () => ({
    setUserPin: jest.fn((pin) => ({ type: 'user/setPin', payload: pin })),
}), { virtual: true });

// Mock dependencies
jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

describe('CreatePinScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Component Rendering', () => {
        it('should render without crashing', () => {
            render(<CreatePinScreen />);
        });

        it('should render 6 PIN input fields', () => {
            const { UNSAFE_getAllByType } = render(<CreatePinScreen />);
            const { TextInput } = require('react-native');
            const inputs = UNSAFE_getAllByType(TextInput);
            expect(inputs.length).toBe(6);
        });

        it('should render Set PIN button', () => {
            const { getByText } = render(<CreatePinScreen />);
            expect(getByText('Set PIN')).toBeTruthy();
        });
    });

    describe('User Interaction', () => {
        it('should update PIN inputs', () => {
            const { UNSAFE_getAllByType } = render(<CreatePinScreen />);
            const { TextInput } = require('react-native');
            const inputs = UNSAFE_getAllByType(TextInput);

            // Enter first digit
            fireEvent.changeText(inputs[0], '1');
            expect(inputs[0].props.value).toBe('1');
        });

        it('should navigate when PIN is complete and Set PIN pressed', () => {
            const navigation = { navigate: jest.fn() };
            const { UNSAFE_getAllByType, getByText } = render(<CreatePinScreen navigation={navigation} />);
            const { TextInput } = require('react-native');
            const inputs = UNSAFE_getAllByType(TextInput);

            // Fill all 6 digits
            inputs.forEach((input, index) => {
                fireEvent.changeText(input, (index + 1).toString().slice(-1));
            });

            const setPinButton = getByText('Set PIN');
            fireEvent.press(setPinButton);

            expect(navigation.navigate).toHaveBeenCalledWith('Passphrase');
        });

        it('should NOT navigate if PIN is incomplete', () => {
            const navigation = { navigate: jest.fn() };
            const { UNSAFE_getAllByType, getByText } = render(<CreatePinScreen navigation={navigation} />);
            const { TextInput } = require('react-native');
            const inputs = UNSAFE_getAllByType(TextInput);

            // Fill only 5 digits
            for (let i = 0; i < 5; i++) {
                fireEvent.changeText(inputs[i], '1');
            }

            const setPinButton = getByText('Set PIN');
            fireEvent.press(setPinButton);

            expect(navigation.navigate).not.toHaveBeenCalled();
        });
    });
});
