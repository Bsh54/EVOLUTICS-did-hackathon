import { setupCredentialEventListener, setupProofEventListener, setupConnectionEventListener } from '../../src/services/CredoEventListener';
import { store } from '../../src/store';

// Mock Credo core enums and types
const CredentialEventTypes = { CredentialStateChanged: 'CredentialStateChanged' };
const CredentialState = { OfferReceived: 'OfferReceived', CredentialReceived: 'CredentialReceived', Done: 'Done' };
const ProofEventTypes = { ProofStateChanged: 'ProofStateChanged' };
const ProofState = { RequestReceived: 'RequestReceived', Done: 'Done' };
const ConnectionEventTypes = { ConnectionStateChanged: 'ConnectionStateChanged' };
const DidExchangeState = { Completed: 'Completed' };

jest.mock('@credo-ts/core', () => ({
    CredentialEventTypes,
    CredentialState,
    ProofEventTypes,
    ProofState,
    ConnectionEventTypes,
    DidExchangeState,
}));

// Mock store
jest.mock('../../src/store', () => ({
    store: {
        dispatch: jest.fn(),
        getState: jest.fn().mockReturnValue({
            credo: {
                pendingCredentials: [],
                connections: []
            }
        })
    }
}));

// Mock credoSlice
jest.mock('../../src/store/slices/credoSlice', () => ({
    fetchCredentials: jest.fn(() => ({ type: 'fetchCredentials' })),
    fetchConnections: jest.fn(() => ({ type: 'fetchConnections' })),
    removePendingCredential: jest.fn((id) => ({ type: 'removePendingCredential', payload: id })),
    cleanupOldPendingCredentials: jest.fn(() => ({ type: 'cleanup' })),
    updatePendingCredential: jest.fn((data) => ({ type: 'update', payload: data })),
}));

// Mock credoAgentService
jest.mock('../../src/services/agent', () => ({
    credoAgentService: {
        isWalletReady: jest.fn().mockResolvedValue(true)
    }
}));

describe('CredoEventListener', () => {
    let mockAgent: any;
    let handlers: Record<string, Function> = {};

    beforeEach(() => {
        jest.clearAllMocks();
        handlers = {};
        mockAgent = {
            events: {
                on: jest.fn((type, handler) => {
                    handlers[type] = handler;
                })
            },
            credentials: {
                acceptOffer: jest.fn().mockResolvedValue({}),
                acceptCredential: jest.fn().mockResolvedValue({}),
                getById: jest.fn().mockResolvedValue({ state: CredentialState.Done }),
            },
            proofs: {
                getFormatData: jest.fn().mockResolvedValue({ request: { anoncreds: {} } }),
            }
        };
    });

    describe('setupCredentialEventListener', () => {
        it('should handle OfferReceived state', async () => {
            setupCredentialEventListener(mockAgent);
            const handler = handlers[CredentialEventTypes.CredentialStateChanged];

            await handler({
                payload: {
                    credentialRecord: { id: 'cred-1', state: CredentialState.OfferReceived }
                }
            });

            expect(mockAgent.credentials.acceptOffer).toHaveBeenCalledWith({ credentialRecordId: 'cred-1' });
        });

        it('should handle CredentialReceived state', async () => {
            setupCredentialEventListener(mockAgent);
            const handler = handlers[CredentialEventTypes.CredentialStateChanged];

            await handler({
                payload: {
                    credentialRecord: { id: 'cred-1', state: CredentialState.CredentialReceived }
                }
            });

            expect(mockAgent.credentials.acceptCredential).toHaveBeenCalledWith({ credentialRecordId: 'cred-1' });
        });

        it('should handle Done state and refresh credentials', async () => {
            setupCredentialEventListener(mockAgent);
            const handler = handlers[CredentialEventTypes.CredentialStateChanged];

            await handler({
                payload: {
                    credentialRecord: { id: 'cred-1', state: CredentialState.Done, connectionId: 'conn-1' }
                }
            });

            expect(store.dispatch).toHaveBeenCalledWith({ type: 'fetchCredentials' });
        });
    });

    describe('setupProofEventListener', () => {
        it('should handle RequestReceived state', async () => {
            setupProofEventListener(mockAgent);
            const handler = handlers[ProofEventTypes.ProofStateChanged];

            await handler({
                payload: {
                    proofRecord: { id: 'proof-1', state: ProofState.RequestReceived }
                }
            });

            expect(mockAgent.proofs.getFormatData).toHaveBeenCalledWith('proof-1');
        });
    });

    describe('setupConnectionEventListener', () => {
        it('should refresh connections when DidExchangeState is Completed', async () => {
            setupConnectionEventListener(mockAgent);
            const handler = handlers[ConnectionEventTypes.ConnectionStateChanged];

            await handler({
                payload: {
                    connectionRecord: { id: 'conn-1', state: DidExchangeState.Completed }
                }
            });

            expect(store.dispatch).toHaveBeenCalledWith({ type: 'fetchConnections' });
        });
    });
});
