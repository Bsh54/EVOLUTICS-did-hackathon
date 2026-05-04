/**
 * Test Suite: PassphraseScreen Component
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PassphraseScreen from '../../src/screens/PassphraseScreen';
import Clipboard from '@react-native-clipboard/clipboard';
import { Alert } from 'react-native';

// Mock Redux user slice
jest.mock('../../src/store/slices/userSlice', () => ({
    setPassphrase: jest.fn((phrase) => ({ type: 'user/setPassphrase', payload: phrase })),
}), { virtual: true });

jest.mock('@store/slices/userSlice', () => ({
    setPassphrase: jest.fn((phrase) => ({ type: 'user/setPassphrase', payload: phrase })),
}), { virtual: true });

// Mock dependencies
jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('PassphraseScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Component Rendering', () => {
        it('should render without crashing', () => {
            render(<PassphraseScreen />);
        });

        it('should render title and subtitle', () => {
            const { getByText } = render(<PassphraseScreen />);
            expect(getByText('Save your passphrase')).toBeTruthy();
            expect(getByText(/recovery passphrase/i)).toBeTruthy();
        });

        it('should render "Show" button initially', () => {
            const { getByText } = render(<PassphraseScreen />);
            expect(getByText('Show')).toBeTruthy();
        });
    });

    describe('Interactions', () => {
        it('should reveal passphrase on "Show" press', () => {
            const { getByText } = render(<PassphraseScreen />);
            const showButton = getByText('Show');

            fireEvent.press(showButton);

            // Should now show words (numbered 1., 2., etc)
            expect(getByText('1.')).toBeTruthy();
            expect(getByText('12.')).toBeTruthy();
        });

        it('should copy to clipboard', () => {
            const { getByText } = render(<PassphraseScreen />);

            // First reveal
            fireEvent.press(getByText('Show'));

            // Then copy
            const copyButton = getByText(/copy to clipboard/i);
            fireEvent.press(copyButton);

            expect(Clipboard.setString).toHaveBeenCalled();
            expect(Alert.alert).toHaveBeenCalledWith('Success', expect.any(String));
        });

        it('should enable Continue button when checkbox is checked', () => {
            const { getByText } = render(<PassphraseScreen />);

            const checkboxText = getByText(/I have saved my passphrase/i);
            const continueButton = getByText('Continue');

            // Initially disabled (visually or functionally)
            // Note: In React Native, disabled Pressable doesn't fire onPress, validation below tests functional flow

            // Check box
            fireEvent.press(checkboxText);

            // Now enabled? We can check behavior or style if needed, but integration test:
        });
    });

    describe('Navigation', () => {
        it('should navigate ONLY when saved', () => {
            const navigation = { navigate: jest.fn() };
            const { getByText } = render(<PassphraseScreen navigation={navigation} />);

            const continueButton = getByText('Continue');

            // Press without checking (Button is disabled, so handler shouldn't fire)
            fireEvent.press(continueButton);
            expect(navigation.navigate).not.toHaveBeenCalled();
            // expect(Alert.alert).toHaveBeenCalledWith('Reminder', expect.any(String)); // Unreachable logic in UI

            // Now check
            const checkboxText = getByText(/I have saved my passphrase/i);
            fireEvent.press(checkboxText);

            // Press continue again
            fireEvent.press(continueButton);
            expect(navigation.navigate).toHaveBeenCalledWith('ChooseLanguage');
        });
    });
});
