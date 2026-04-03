/**
 * Test Suite for AllCredentialsListScreen Component
 * 
 * Simplified test suite to verify rendering and navigation setup.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import AllCredentialsListScreen from '../../src/screens/AllCredentialsListScreen';

// Mock dependencies
jest.mock('../../src/features/credential-connection', () => ({
    ConnectionsFullList: ({ headerComponent }: any) => {
        const { View, Text } = require('react-native');
        return (
            <View testID="ConnectionsFullList">
                {headerComponent}
                <View testID="CredentialCard" />
                <View testID="CredentialCard" />
                <View testID="CredentialCard" />
            </View>
        );
    },
    useCredentials: jest.fn(() => ({ credentials: [] })),
}));

describe('AllCredentialsListScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render without crashing', () => {
        const { toJSON } = render(<AllCredentialsListScreen />);
        expect(toJSON()).toBeTruthy();
    });

    it('should render screen title', () => {
        const { getByText } = render(<AllCredentialsListScreen />);
        expect(getByText(/All Connection list/i)).toBeTruthy();
    });

    it('should render credentials list component', () => {
        const { getByTestId } = render(<AllCredentialsListScreen />);
        expect(getByTestId('ConnectionsFullList')).toBeTruthy();
    });
});
