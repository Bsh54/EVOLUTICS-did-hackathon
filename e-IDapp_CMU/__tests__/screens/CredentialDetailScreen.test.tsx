/**
 * Test Suite: CredentialDetailScreen Component
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import CredentialDetailScreen from '../../src/screens/CredentialDetailScreen';

// Mock Redux
jest.mock('react-redux', () => ({
    useSelector: jest.fn().mockReturnValue([]), // connections
}));

// Mock Native UI
jest.mock('react-native-linear-gradient', () => require('react-native').View);
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock Navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
    useRoute: jest.fn(() => ({
        params: {
            credential: {
                id: '1',
                state: 'done',
                credentialAttributes: [{ name: 'Full Name', value: 'John Doe' }],
                createdAt: '2023-01-01T10:00:00.000Z',
                connectionLabel: 'Government',
            }
        }
    })),
}));

describe('CredentialDetailScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render credential details', () => {
        const navigation = { goBack: jest.fn() };
        const { getByText } = render(<CredentialDetailScreen navigation={navigation} />);

        // Check Text
        expect(getByText('Credential Details')).toBeTruthy();
        expect(getByText('Government')).toBeTruthy(); // Issuer
        expect(getByText('done')).toBeTruthy(); // State
        expect(getByText('FULL NAME')).toBeTruthy();
        expect(getByText('John Doe')).toBeTruthy();
    });

    it('should render different layout for pending state', () => {
        const { useRoute } = require('@react-navigation/native');
        useRoute.mockReturnValue({
            params: {
                credential: {
                    id: '2',
                    state: 'offer-received',
                    credentialAttributes: [],
                    createdAt: '2023-01-01',
                    connectionLabel: 'Bank',
                }
            }
        });

        const navigation = { goBack: jest.fn() };
        const { getByText } = render(<CredentialDetailScreen navigation={navigation} />);

        expect(getByText('Credential Request')).toBeTruthy();
        expect(getByText('Accept')).toBeTruthy();
        expect(getByText('Decline')).toBeTruthy();
    });
});
