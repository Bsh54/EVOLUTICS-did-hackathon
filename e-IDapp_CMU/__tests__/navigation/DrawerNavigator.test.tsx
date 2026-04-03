import React from 'react';
import { render } from '@testing-library/react-native';
import DrawerNavigator from '../../src/navigation/DrawerNavigator';

// Mock navigation
jest.mock('@react-navigation/drawer', () => ({
    createDrawerNavigator: jest.fn(() => ({
        Navigator: ({ children }: any) => <>{children}</>,
        Screen: ({ name }: any) => <>{name}</>,
    })),
}));

jest.mock('@react-navigation/stack', () => ({
    createStackNavigator: jest.fn(() => ({
        Navigator: ({ children }: any) => <>{children}</>,
        Screen: ({ name }: any) => <>{name}</>,
    })),
}));

// Mock components and screens
jest.mock('../../src/components/CustomDrawerContent', () => () => null);
jest.mock('../../src/screens/DashboardScreen', () => () => null);
jest.mock('../../src/screens/CredentialsScreen', () => () => null);
jest.mock('../../src/screens/ScanQRScreen', () => () => null);
jest.mock('../../src/screens/AllCredentialsListScreen', () => () => null);
jest.mock('../../src/screens/ProofRequestListScreen', () => () => null);
jest.mock('../../src/features/wallet-backup', () => ({
    BackupManagementScreen: () => null,
}));
jest.mock('../../src/screens/QRCodeScreen', () => () => null);

describe('DrawerNavigator', () => {
    it('should render successfully', () => {
        const { toJSON } = render(<DrawerNavigator />);
        expect(toJSON()).toBeTruthy();
    });
});
