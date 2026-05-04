/**
 * Test Suite: CredentialsScreen Component
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import CredentialsScreen from '../../src/screens/CredentialsScreen';

jest.mock('../../src/features/credential-connection', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return {
        CredentialsFullList: () => <Text>CredentialsFullList</Text>,
    };
});

// Mock Navigation
jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ goBack: jest.fn() }),
}));

// Mock Native UI
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

describe('CredentialsScreen', () => {
    it('should render CredentialsFullList correctly', () => {
        const { getByText } = render(<CredentialsScreen />);
        expect(getByText('CredentialsFullList')).toBeTruthy();
    });
});
