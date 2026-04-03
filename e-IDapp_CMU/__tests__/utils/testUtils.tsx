/**
 * Test Utilities and Helpers
 * 
 * This module provides reusable testing utilities, mock generators, and helper functions
 * to simplify and standardize testing across the application.
 * 
 * @author Senior React Native Developer
 * @version 1.0.0
 * @description Professional-grade testing utilities for React Native components
 */

import React from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { render as rtlRender, RenderOptions } from '@testing-library/react-native';
import { configureStore } from '@reduxjs/toolkit';

/**
 * Mock Redux Store Configuration
 * Creates a mock Redux store with customizable initial state
 */
export const createMockStore = (initialState: any = {}) => {
    const defaultState = {
        user: {
            name: 'Test User',
            email: 'test@example.com',
            profileImage: null,
        },
        credo: {
            credentials: [],
            connections: [],
            proofs: [],
            credentialsLoading: false,
            connectionsLoading: false,
            proofsLoading: false,
        },
        ...initialState,
    };

    return configureStore({
        reducer: {
            user: (state = defaultState.user) => state,
            credo: (state = defaultState.credo) => state,
        },
        preloadedState: defaultState,
    });
};

/**
 * Custom Render Function with Providers
 * Wraps component with necessary providers (Redux, Navigation, etc.)
 * 
 * @param ui - Component to render
 * @param options - Render options including custom store and navigation
 * @returns Rendered component with utilities
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    initialState?: any;
    store?: any;
    navigationOptions?: any;
}

export const renderWithProviders = (
    ui: React.ReactElement,
    {
        initialState = {},
        store = createMockStore(initialState),
        navigationOptions = {},
        ...renderOptions
    }: CustomRenderOptions = {}
) => {
    /**
     * Wrapper component with all necessary providers
     */
    const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        return (
            <Provider store={store}>
                <NavigationContainer {...navigationOptions}>
                    {children}
                </NavigationContainer>
            </Provider>
        );
    };

    return {
        ...rtlRender(ui, { wrapper: Wrapper, ...renderOptions }),
        store,
    };
};

/**
 * Mock Data Generators
 * Generate realistic test data for various entities
 */

/**
 * Generate mock credential data
 */
export const generateMockCredential = (overrides: any = {}) => ({
    id: `credential-${Math.random().toString(36).substring(7)}`,
    type: 'EducationCredential',
    issuer: 'Test University',
    issuedAt: new Date('2024-01-01'),
    attributes: [
        { name: 'Name', value: 'John Doe' },
        { name: 'Degree', value: 'Bachelor of Science' },
    ],
    state: 'done',
    ...overrides,
});

/**
 * Generate mock connection data
 */
export const generateMockConnection = (overrides: any = {}) => ({
    id: `connection-${Math.random().toString(36).substring(7)}`,
    theirLabel: 'Test Organization',
    state: 'complete',
    createdAt: new Date('2024-01-01'),
    theirDid: `did:peer:${Math.random().toString(36).substring(7)}`,
    ...overrides,
});

/**
 * Generate mock proof request data
 */
export const generateMockProofRequest = (overrides: any = {}) => ({
    id: `proof-${Math.random().toString(36).substring(7)}`,
    state: 'request-received',
    verifierName: 'Test Verifier',
    requestedAttributes: [
        { name: 'Name', restrictions: [] },
        { name: 'Age', restrictions: [] },
    ],
    createdAt: new Date('2024-01-01'),
    ...overrides,
});

/**
 * Generate mock user data
 */
export const generateMockUser = (overrides: any = {}) => ({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+1234567890',
    profileImage: null,
    ...overrides,
});

/**
 * Wait for Async Operations
 * Custom wait utilities for async operations
 */

/**
 * Wait for a specific condition to be true
 * @param condition - Function that returns a boolean
 * @param timeout - Maximum wait time in milliseconds
 */
export const waitForCondition = async (
    condition: () => boolean,
    timeout: number = 5000
): Promise<void> => {
    const startTime = Date.now();

    while (!condition()) {
        if (Date.now() - startTime > timeout) {
            throw new Error('Timeout waiting for condition');
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
};

/**
 * Mock Navigation Utilities
 */

/**
 * Create a mock navigation object with all common navigation methods
 */
export const createMockNavigation = () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    setParams: jest.fn(),
    dispatch: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
    removeListener: jest.fn(),
    canGoBack: jest.fn(() => true),
    isFocused: jest.fn(() => true),
    push: jest.fn(),
    pop: jest.fn(),
    popToTop: jest.fn(),
    replace: jest.fn(),
    openDrawer: jest.fn(),
    closeDrawer: jest.fn(),
    toggleDrawer: jest.fn(),
});

/**
 * Create a mock route object
 */
export const createMockRoute = (params: any = {}) => ({
    key: 'test-route-key',
    name: 'TestScreen',
    params,
    path: undefined,
});

/**
 * Snapshot Testing Utilities
 */

/**
 * Clean snapshot by removing non-deterministic values
 */
export const cleanSnapshot = (tree: any): any => {
    if (!tree) return tree;

    if (typeof tree === 'object') {
        const cleaned: any = {};
        for (const key in tree) {
            // Skip these keys as they can change between test runs
            if (['key', 'testID', 'nativeID'].includes(key)) {
                continue;
            }
            cleaned[key] = cleanSnapshot(tree[key]);
        }
        return cleaned;
    }

    return tree;
};

/**
 * Event Simulation Helpers
 */

/**
 * Simulate text input
 */
export const simulateTextInput = (element: any, text: string) => {
    element.props.onChangeText(text);
};

/**
 * Simulate button press with delay
 */
export const simulateButtonPress = async (element: any, delay: number = 100) => {
    if (element.props.onPress) {
        element.props.onPress();
        await new Promise((resolve) => setTimeout(resolve, delay));
    }
};

/**
 * Assertion Helpers
 */

/**
 * Assert that an element exists with specific text
 */
export const assertTextExists = (getByText: any, text: string | RegExp) => {
    expect(getByText(text)).toBeTruthy();
};

/**
 * Assert that an element does not exist
 */
export const assertElementNotExists = (queryByText: any, text: string | RegExp) => {
    expect(queryByText(text)).toBeNull();
};

/**
 * Assert that navigation was called with specific params
 */
export const assertNavigationCalled = (
    mockNavigate: jest.Mock,
    screen: string,
    params?: any
) => {
    if (params) {
        expect(mockNavigate).toHaveBeenCalledWith(screen, params);
    } else {
        expect(mockNavigate).toHaveBeenCalledWith(screen);
    }
};

/**
 * Mock Service Generators
 */

/**
 * Create mock Credo agent
 */
export const createMockCredoAgent = () => ({
    isInitialized: true,
    initialize: jest.fn(() => Promise.resolve()),
    shutdown: jest.fn(() => Promise.resolve()),
    credentials: {
        getAll: jest.fn(() => Promise.resolve([])),
        getById: jest.fn((id) => Promise.resolve(generateMockCredential({ id }))),
        acceptOffer: jest.fn(() => Promise.resolve()),
        declineOffer: jest.fn(() => Promise.resolve()),
    },
    connections: {
        getAll: jest.fn(() => Promise.resolve([])),
        getById: jest.fn((id) => Promise.resolve(generateMockConnection({ id }))),
        acceptInvitation: jest.fn(() => Promise.resolve()),
    },
    proofs: {
        getAll: jest.fn(() => Promise.resolve([])),
        getById: jest.fn((id) => Promise.resolve(generateMockProofRequest({ id }))),
        acceptRequest: jest.fn(() => Promise.resolve()),
        declineRequest: jest.fn(() => Promise.resolve()),
    },
    oob: {
        receiveInvitationFromUrl: jest.fn(() => Promise.resolve({
            connectionRecord: generateMockConnection(),
        })),
    },
});

/**
 * Performance Testing Utilities
 */

/**
 * Measure component render time
 */
export const measureRenderTime = (component: React.ReactElement): number => {
    const startTime = performance.now();
    rtlRender(component);
    const endTime = performance.now();
    return endTime - startTime;
};

/**
 * Test data validation
 */

/**
 * Validate credential structure
 */
export const isValidCredential = (credential: any): boolean => {
    return !!(
        credential &&
        credential.id &&
        credential.type &&
        credential.issuer
    );
};

/**
 * Validate connection structure
 */
export const isValidConnection = (connection: any): boolean => {
    return !!(
        connection &&
        connection.id &&
        connection.theirLabel &&
        connection.state
    );
};

/**
 * Error Testing Utilities
 */

/**
 * Suppress console errors during test
 */
export const suppressConsoleError = () => {
    const originalError = console.error;
    const spy = jest.spyOn(console, 'error').mockImplementation((...args) => {
        // Filter out expected errors if needed
    });

    return {
        restore: () => {
            spy.mockRestore();
        },
    };
};

/**
 * Suppress console warnings during test
 */
export const suppressConsoleWarn = () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation((...args) => {
        // Filter out expected warnings if needed
    });

    return {
        restore: () => {
            spy.mockRestore();
        },
    };
};

/**
 * Async Testing Helpers
 */

/**
 * Wait for next tick (useful for state updates)
 */
export const waitForNextTick = () => new Promise((resolve) => setImmediate(resolve));

/**
 * Flush all pending promises
 */
export const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

/**
 * Export all utilities
 */
export default {
    createMockStore,
    renderWithProviders,
    generateMockCredential,
    generateMockConnection,
    generateMockProofRequest,
    generateMockUser,
    waitForCondition,
    createMockNavigation,
    createMockRoute,
    cleanSnapshot,
    simulateTextInput,
    simulateButtonPress,
    assertTextExists,
    assertElementNotExists,
    assertNavigationCalled,
    createMockCredoAgent,
    measureRenderTime,
    isValidCredential,
    isValidConnection,
    suppressConsoleError,
    suppressConsoleWarn,
    waitForNextTick,
    flushPromises,
};
