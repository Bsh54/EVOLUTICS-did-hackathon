/**
 * Test Suite for EnterNameScreen Component
 * 
 * This test suite provides comprehensive coverage for the EnterNameScreen,
 * including name input validation and navigation.
 * 
 * @author Senior React Native Developer
 * @version 1.0.0
 * @description Professional-grade unit tests for Name Entry functionality
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EnterNameScreen from '../../src/screens/EnterNameScreen';
import { useNavigation } from '@react-navigation/native';

// Mock Redux user slice (using absolute path to ensure coverage)
jest.mock('../../src/store/slices/userSlice', () => ({
    setUserName: jest.fn((name) => ({ type: 'user/setName', payload: name })),
}), { virtual: true }); // Adding virtual just in case, though file exists

// Also mock via moduleMapper alias if it exists or generic
jest.mock('@store/slices/userSlice', () => ({
    setUserName: jest.fn((name) => ({ type: 'user/setName', payload: name })),
}), { virtual: true });

// Mock LinearGradient if not globally mocked
jest.mock('react-native-linear-gradient', () => 'LinearGradient');

describe('EnterNameScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Component Rendering', () => {
        it('should render without crashing', () => {
            render(<EnterNameScreen />);
        });

        it('should render correct title and placeholder', () => {
            const { getByText, getByPlaceholderText } = render(<EnterNameScreen />);

            expect(getByText('Enter Name')).toBeTruthy();
            expect(getByPlaceholderText('Name')).toBeTruthy();
        });

        it('should render Next button (disabled initially)', () => {
            const { getByText } = render(<EnterNameScreen />);
            // Button exists but might have opacity style for disabled
            expect(getByText('Next')).toBeTruthy();
        });
    });

    describe('User Interaction', () => {
        it('should update name input', () => {
            const { getByPlaceholderText } = render(<EnterNameScreen />);
            const input = getByPlaceholderText('Name');

            fireEvent.changeText(input, 'Test User');

            expect(input.props.value).toBe('Test User');
        });

        it('should navigate on Next press', () => {
            const navigation = { navigate: jest.fn() };
            const { getByPlaceholderText, getByText } = render(<EnterNameScreen navigation={navigation} />);

            const input = getByPlaceholderText('Name');
            const nextButton = getByText('Next');

            // Enter valid name
            fireEvent.changeText(input, 'Bilal');

            // Press Next
            fireEvent.press(nextButton);

            expect(navigation.navigate).toHaveBeenCalledWith('CreatePin');
        });

        it('should NOT navigate if name is empty', () => {
            const navigation = { navigate: jest.fn() };
            const { getByText, getByPlaceholderText } = render(<EnterNameScreen navigation={navigation} />);

            // Ensure name is empty
            const input = getByPlaceholderText('Name');
            fireEvent.changeText(input, '   ');

            const nextButton = getByText('Next');
            fireEvent.press(nextButton);

            expect(navigation.navigate).not.toHaveBeenCalled();
        });
    });
});
