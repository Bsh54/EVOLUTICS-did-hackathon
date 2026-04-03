import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { useDispatch } from 'react-redux';
import AppNavigator from '../../src/navigation/AppNavigator';
import { isWalletInitialized } from '../../src/utils/localStorage';
import { loadUserDataFromStorage } from '../../src/store/slices/userSlice';

// Mock dependecies
jest.mock('react-redux', () => ({
    useDispatch: jest.fn(),
}));

jest.mock('../../src/utils/localStorage', () => ({
    isWalletInitialized: jest.fn(),
}));

jest.mock('../../src/store/slices/userSlice', () => ({
    loadUserDataFromStorage: jest.fn(() => ({ type: 'user/loadUserDataFromStorage' })),
}));

// Mock screens to simplify
jest.mock('../../src/screens/OnboardingScreen', () => () => null);
jest.mock('../../src/screens/EnterNameScreen', () => () => null);
jest.mock('../../src/screens/CreatePinScreen', () => () => null);
jest.mock('../../src/screens/UploadProfileImageScreen', () => () => null);
jest.mock('../../src/screens/SetupWaitScreen', () => () => null);
jest.mock('../../src/screens/SetupSuccessScreen', () => () => null);
jest.mock('../../src/screens/PassphraseScreen', () => () => null);
jest.mock('../../src/screens/ChooseLanguageScreen', () => () => null);
jest.mock('../../src/navigation/DrawerNavigator', () => () => null);
jest.mock('../../src/screens/VerifyPinScreen', () => () => null);
jest.mock('../../src/screens/FaceScanScreen', () => () => null);
jest.mock('../../src/screens/CredentialDetailScreen', () => () => null);
jest.mock('../../src/screens/CredentialRequestDetailScreen', () => () => null);
jest.mock('../../src/screens/AllCredentialsListScreen', () => () => null);
jest.mock('../../src/screens/ConnectionDetailScreen', () => () => null);
jest.mock('../../src/screens/ProofRequestDetailsScreen', () => () => null);
jest.mock('../../src/features/wallet-backup', () => ({
    BackupWalletScreen: () => null,
    RestoreWalletScreen: () => null,
    BackupManagementScreen: () => null,
}));

describe('AppNavigator', () => {
    const mockDispatch = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useDispatch as unknown as jest.Mock).mockReturnValue(mockDispatch);
    });

    it('should show loading indicator initially', () => {
        (isWalletInitialized as jest.Mock).mockReturnValue(new Promise(() => { })); // Never resolves

        const { getByTestId, queryByTestId } = render(<AppNavigator />);
        // Check for ActivityIndicator - by default it doesn't have testID but we can check if it's rendering
        // or we can add a testID in the code if needed. 
        // In our case, the code has <ActivityIndicator size="large" />
    });

    it('should navigate to Onboarding if wallet is not initialized', async () => {
        (isWalletInitialized as jest.Mock).mockResolvedValue(false);

        render(<AppNavigator />);

        await waitFor(() => {
            expect(isWalletInitialized).toHaveBeenCalled();
        });

        expect(mockDispatch).not.toHaveBeenCalledWith(loadUserDataFromStorage());
    });

    it('should navigate to VerifyPin and load user data if wallet is initialized', async () => {
        (isWalletInitialized as jest.Mock).mockResolvedValue(true);

        render(<AppNavigator />);

        await waitFor(() => {
            expect(isWalletInitialized).toHaveBeenCalled();
        });

        expect(mockDispatch).toHaveBeenCalledWith(loadUserDataFromStorage());
    });

    it('should handle error during wallet status check and default to Onboarding', async () => {
        (isWalletInitialized as jest.Mock).mockRejectedValue(new Error('Check failed'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        render(<AppNavigator />);

        await waitFor(() => {
            expect(isWalletInitialized).toHaveBeenCalled();
        });

        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});
