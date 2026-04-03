/**
 * Test Suite: AgentProvider Feature
 * 
 * Tests for the AgentProvider component which handles Credo agent initialization
 * and provides agent context throughout the application.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// Mock credo-ts/react-hooks
jest.mock('@credo-ts/react-hooks', () => {
    const RN = require('react-native');
    return ({ agent, children }: any) => (
        <RN.View testID="credo-provider">{children}</RN.View>
    );
});

// Mock the AgentService
jest.mock('../../../src/features/agent/AgentService', () => ({
    agentService: {
        isAgentInitialized: jest.fn(() => false),
        getAgent: jest.fn(() => null),
    },
}));

// Now import the component (after mocks are set up)
import { AgentProvider, useAgent } from '../../../src/features/agent';

describe('AgentProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset mocks
        const { agentService } = require('../../../src/features/agent/AgentService');
        agentService.isAgentInitialized.mockReturnValue(false);
        agentService.getAgent.mockReturnValue(null);
    });

    describe('Rendering', () => {
        it('should render without crashing', () => {
            const { UNSAFE_root } = render(
                <AgentProvider>
                    <Text>Child Content</Text>
                </AgentProvider>
            );
            expect(UNSAFE_root).toBeTruthy();
        });

        it('should render children when agent is not yet initialized', async () => {
            const { findByText } = render(
                <AgentProvider>
                    <Text>Child Content</Text>
                </AgentProvider>
            );
            // Initialization happens quickly, so it renders content eventually
            const childContent = await findByText('Child Content');
            expect(childContent).toBeTruthy();
        });

        it('should render children wrapped in CredoAgentProvider when agent is initialized', async () => {
            const { agentService } = require('../../../src/features/agent/AgentService');
            const mockAgent = { id: 'test-agent', wallet: {}, config: {} };
            agentService.isAgentInitialized.mockReturnValue(true);
            agentService.getAgent.mockReturnValue(mockAgent);

            const { getByTestId, getByText } = render(
                <AgentProvider>
                    <Text>Child Content</Text>
                </AgentProvider>
            );

            await waitFor(() => {
                expect(getByTestId('credo-provider')).toBeTruthy();
            });
            expect(getByText('Child Content')).toBeTruthy();
        });
    });

    describe('Error Handling', () => {
        it('should display error message when initialization throws', async () => {
            const { agentService } = require('../../../src/features/agent/AgentService');
            agentService.isAgentInitialized.mockImplementation(() => {
                throw new Error('Initialization failed');
            });

            // Mock console.error to silence the expected error message
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            const { getByText } = render(
                <AgentProvider>
                    <Text>Content</Text>
                </AgentProvider>
            );

            await waitFor(() => {
                expect(getByText(/Error:/)).toBeTruthy();
            });

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error in AgentProvider initialization:'),
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });
    });
});

describe('useAgent Hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        const { agentService } = require('../../../src/features/agent/AgentService');
        agentService.isAgentInitialized.mockReturnValue(false);
        agentService.getAgent.mockReturnValue(null);
    });

    it('should return agent and loading state', async () => {
        const { agentService } = require('../../../src/features/agent/AgentService');
        const mockAgent = { id: 'test-agent', wallet: {}, config: {} };
        agentService.isAgentInitialized.mockReturnValue(true);
        agentService.getAgent.mockReturnValue(mockAgent);

        const TestComponent = () => {
            const { agent, loading } = useAgent();
            return (
                <View>
                    <Text testID="agent-status">{agent ? 'has-agent' : 'no-agent'}</Text>
                    <Text testID="loading-status">{loading ? 'loading' : 'not-loading'}</Text>
                </View>
            );
        };

        const { getByTestId } = render(
            <AgentProvider>
                <TestComponent />
            </AgentProvider>
        );

        await waitFor(() => {
            expect(getByTestId('agent-status').props.children).toBe('has-agent');
        });
    });
});
