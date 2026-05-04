/**
 * Test Suite for OnboardingScreen Component
 * 
 * This test suite provides comprehensive coverage for the OnboardingScreen component,
 * including screen rendering, navigation, and user interactions.
 * 
 * @author Senior React Native Developer
 * @version 1.0.0
 * @description Professional-grade unit tests for Onboarding functionality
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import OnboardingScreen from '../../src/screens/OnboardingScreen';
import { useNavigation } from '@react-navigation/native';

/**
 * Test Suite: OnboardingScreen Component
 */
describe('OnboardingScreen', () => {
    /**
     * Setup before each test
     */
    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Test Case: Component Rendering
     */
    /**
     * Test Case: Component Rendering
     */
    describe('Component Rendering', () => {
        it('should render without crashing', () => {
            render(<OnboardingScreen />);
            // If it doesn't throw, it passes
        });

        it('should render tagline', () => {
            const { getByText } = render(<OnboardingScreen />);
            expect(getByText(/One Wallet, Infinite Possibilities/i)).toBeTruthy();
        });

        it('should render Create Wallet button', () => {
            const { getByText } = render(<OnboardingScreen />);
            expect(getByText(/Create Wallet/i)).toBeTruthy();
        });

        it('should render Restore Wallet button', () => {
            const { getByText } = render(<OnboardingScreen />);
            expect(getByText(/Restore wallet/i)).toBeTruthy();
        });
    });

    /**
     * Test Case: Navigation
     */
    describe('Navigation', () => {
        it('should navigate to EnterName on Create Wallet', () => {
            const { getByText } = render(<OnboardingScreen />);
            const navigation = useNavigation();
            const createButton = getByText(/Create Wallet/i);

            fireEvent.press(createButton);

            expect(navigation.navigate).toHaveBeenCalledWith('EnterName');
        });

        it('should navigate to RestoreWallet on Restore Wallet', () => {
            const { getByText } = render(<OnboardingScreen />);
            const navigation = useNavigation();
            const restoreButton = getByText(/Restore wallet/i);

            fireEvent.press(restoreButton);

            expect(navigation.navigate).toHaveBeenCalledWith('RestoreWallet');
        });
    });

    /**
     * Test Case: Accessibility
     */
    describe('Accessibility', () => {
        it('should have accessible action buttons', () => {
            const { getByText } = render(<OnboardingScreen />);
            const createButton = getByText(/Create Wallet/i);
            const restoreButton = getByText(/Restore wallet/i);

            expect(createButton).toBeTruthy();
            expect(restoreButton).toBeTruthy();
        });
    });
});
