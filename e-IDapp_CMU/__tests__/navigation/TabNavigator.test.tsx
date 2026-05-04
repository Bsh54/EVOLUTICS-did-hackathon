import React from 'react';
import { render } from '@testing-library/react-native';
import TabNavigator from '../../src/navigation/TabNavigator';
import { useAgentInitialization } from '../../src/hooks/useAgentInitialization';

// Mock navigation
jest.mock('@react-navigation/bottom-tabs', () => ({
    createBottomTabNavigator: jest.fn(() => ({
        Navigator: ({ children }: any) => <>{children}</>,
        Screen: ({ name }: any) => <>{name}</>,
    })),
}));

// Mock hooks
jest.mock('../../src/hooks/useAgentInitialization', () => ({
    useAgentInitialization: jest.fn(),
}));

// Mock screens
jest.mock('../../src/screens/DashboardScreen', () => () => null);
jest.mock('../../src/screens/CredentialsScreen', () => () => null);
jest.mock('../../src/screens/AllCredentialsListScreen', () => () => null);
jest.mock('../../src/screens/ScanQRScreen', () => () => null);
jest.mock('../../src/screens/ProofRequestListScreen', () => () => null);

// Mock vector icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');

describe('TabNavigator', () => {
    it('should render successfully and call agent initialization', () => {
        const { toJSON } = render(<TabNavigator />);

        expect(toJSON()).toBeTruthy();
        expect(useAgentInitialization).toHaveBeenCalled();
    });
});
