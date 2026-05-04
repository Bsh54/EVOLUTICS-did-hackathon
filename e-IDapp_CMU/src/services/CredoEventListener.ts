import {
    Agent,
    CredentialStateChangedEvent,
    CredentialEventTypes,
    CredentialState,
    ProofStateChangedEvent,
    ProofEventTypes,
    ProofState,
    ConnectionEventTypes,
    ConnectionStateChangedEvent,
    DidExchangeState,
} from '@credo-ts/core';
import { store } from '../store';
import { fetchCredentials, fetchConnections, removePendingCredential, cleanupOldPendingCredentials, updatePendingCredential } from '../store/slices/credoSlice'; // Ensure addPendingCredential is imported if needed for context
import { credoAgentService } from './agent';

/**
 * Helper to safely dispatch fetch operations after ensuring wallet is ready
 * @param fetchFn - Function to dispatch (e.g., fetchConnections or fetchCredentials)
 * @param maxRetries - Maximum number of retries to wait for wallet readiness (default: 5)
 * @param retryDelay - Delay between retries in milliseconds (default: 200)
 */
const safeDispatchFetch = async (
    fetchFn: () => any,
    maxRetries: number = 5,
    retryDelay: number = 200
): Promise<void> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const isReady = await credoAgentService.isWalletReady();
        if (isReady) {
            store.dispatch(fetchFn());
            return;
        }
        
        if (attempt < maxRetries) {
            console.log(`Wallet not ready for fetch, retrying in ${retryDelay}ms (attempt ${attempt + 1}/${maxRetries + 1})...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
            console.warn('Wallet not ready after max retries, skipping fetch. Will retry on next event.');
        }
    }
};

// Helper function to handle CredentialState.OfferReceived
const handleOfferReceived = async (agent: Agent, recordId: string) => {
    console.log('📩 [OfferReceived] Sending credential request...');
    const requestRecord = await agent.credentials.acceptOffer({
        credentialRecordId: recordId
    });
    console.log('✅ [OfferReceived] Request sent successfully');
    console.log('📄 Request Record:', JSON.stringify(requestRecord, null, 2));
};

// Helper function to handle CredentialState.CredentialReceived
const handleCredentialReceived = async (agent: Agent, recordId: string) => {
    console.log('📥 [CredentialReceived] Storing credential...');
    const storedRecord = await agent.credentials.acceptCredential({
        credentialRecordId: recordId
    });
    console.log('✅ [CredentialReceived] Credential stored successfully');
    console.log('📄 Stored Record:', JSON.stringify(storedRecord, null, 2));
};

// Helper function to remove pending credentials that match a completed credential
const removeMatchingPendingCredentials = (credentialRecord: any) => {
    const state = store.getState();
    const pendingCreds = state.credo.pendingCredentials;

    console.log('🔍 Checking pending credentials for removal. Pending count:', pendingCreds.length);
    console.log('📋 Credential connectionId:', credentialRecord.connectionId);
    console.log('📋 Credential outOfBandId:', credentialRecord.metadata?.get('outOfBandId'));

    if (pendingCreds.length > 0) {
        const credentialTime = new Date(credentialRecord.createdAt?.toISOString() || new Date().toISOString()).getTime();
        const outOfBandId = credentialRecord.metadata?.get('outOfBandId');
        let removedCount = 0;

        pendingCreds.forEach((pending: any) => {
            let shouldRemove = false;
            let matchReason = '';

            // Match by connectionId (most reliable)
            if (credentialRecord.connectionId && pending.connectionId === credentialRecord.connectionId) {
                shouldRemove = true;
                matchReason = `connectionId: ${credentialRecord.connectionId}`;
            }
            // Match by outOfBandId if available (now matching pending.id directly as per previous suggestion)
            else if (outOfBandId && pending.id === outOfBandId) {
                shouldRemove = true;
                matchReason = `outOfBandId (direct match): ${outOfBandId}`;
            }
            // Match by timestamp (if credential was created recently and pending is recent)
            else {
                const pendingTime = new Date(pending.timestamp).getTime();
                const timeDiff = Math.abs(credentialTime - pendingTime);

                // If credential was created within 30 seconds of pending, likely a match
                if (timeDiff < 30000) {
                    // Also check if connectionId matches via connection lookup
                    if (credentialRecord.connectionId) {
                        const connection = state.credo.connections.find(
                            (conn: any) => conn.id === credentialRecord.connectionId
                        );

                        if (connection) {
                            const connectionTime = new Date(connection.createdAt).getTime();
                            const connectionTimeDiff = Math.abs(connectionTime - pendingTime);

                            if (connectionTimeDiff < 30000) {
                                shouldRemove = true;
                                matchReason = `timestamp match (${Math.round(timeDiff / 1000)}s)`;
                            }
                        } else {
                            // If no connectionId, be more aggressive - remove if within 30 seconds
                            shouldRemove = true;
                            matchReason = `timestamp match (${Math.round(timeDiff / 1000)}s, no connectionId)`;
                        }
                    } else {
                        // If no connectionId, be more aggressive - remove if within 30 seconds
                        shouldRemove = true;
                        matchReason = `timestamp match (${Math.round(timeDiff / 1000)}s, no connectionId)`;
                    }
                }
            }

            if (shouldRemove) {
                console.log('✅ Removing pending credential:', pending.id, 'matched by', matchReason);
                store.dispatch(removePendingCredential(pending.id));
                removedCount++;
            }
        });

        // Fallback: If no pending was removed but we have pending credentials and a credential just completed,
        // remove the oldest pending credential (likely the one that just completed)
        if (removedCount === 0 && pendingCreds.length > 0) {
            const oldestPending = pendingCreds.reduce((oldest: any, current: any) => {
                return new Date(current.timestamp) < new Date(oldest.timestamp) ? current : oldest;
            });
            console.log('⚠️ No match found, removing oldest pending credential as fallback:', oldestPending.id);
            store.dispatch(removePendingCredential(oldestPending.id));
        }
    }
};

// Helper function to handle CredentialState.Done and perform cleanup/refresh
const handleCredentialDone = async (agent: Agent, recordId: string, credentialRecord: any) => {
    console.log('🎉 [Done] Credential exchange completed successfully!');
    console.log('📄 Final Record:', JSON.stringify(credentialRecord, null, 2));

    // Additional verification
    try {
        const finalRecord = await agent.credentials.getById(recordId);
        console.log('✅ Verified final state:', finalRecord.state);
    } catch (err) {
        console.error('⚠️ Could not verify final state:', err);
    }

    removeMatchingPendingCredentials(credentialRecord);

    // Also cleanup old pending credentials (older than 5 minutes)
    store.dispatch(cleanupOldPendingCredentials());

    // Auto-refresh credentials list (with wallet readiness check)
    console.log('🔄 Refreshing credentials list...');
    await safeDispatchFetch(fetchCredentials);
};

export const setupCredentialEventListener = (agent: Agent) => {
    if (!agent) {
        console.error('❌ Cannot setup event listener: agent is null');
        return;
    }

    console.log('🎧 Setting up credential event listener...');

    agent.events.on<CredentialStateChangedEvent>(
        CredentialEventTypes.CredentialStateChanged,
        async (event) => {
            const { credentialRecord } = event.payload;
            const recordId = credentialRecord.id;

            console.log(`📢 [Holder] Credential state changed to: ${credentialRecord.state}`);
            console.log(`📋 Record ID: ${recordId}`);
            console.log(`📋 State: ${credentialRecord.state}`);

            // Refresh credentials in Redux store and local storage
            // store.dispatch(fetchCredentials());

            try {
                switch (credentialRecord.state) {
                    case CredentialState.OfferReceived:
                        await handleOfferReceived(agent, recordId);
                        break;

                    case CredentialState.CredentialReceived:
                        await handleCredentialReceived(agent, recordId);
                        break;

                    case CredentialState.Done:
                        await handleCredentialDone(agent, recordId, credentialRecord);
                        break;

                    default:
                        console.log(`ℹ️ [${credentialRecord.state}] Unhandled state`);
                }
            } catch (error: any) {
                console.error(`❌ Error handling credential state ${credentialRecord.state}:`, error);
                console.error('Error details:', error.message);
                console.error('Stack trace:', error.stack);
            }
        }
    );

    console.log('✅ Credential event listener registered successfully');
};

export const setupProofEventListener = (agent: Agent) => {
    if (!agent) {
        console.error('❌ Cannot setup proof event listener: agent is null');
        return;
    }

    console.log('🎧 Setting up proof event listener...');

    agent.events.on<ProofStateChangedEvent>(
        ProofEventTypes.ProofStateChanged,
        async (event) => {
            const { proofRecord } = event.payload;
            const recordId = proofRecord.id;

            console.log(`📢 [Holder] Proof state changed to: ${proofRecord.state}`);
            console.log(`📋 Record ID: ${recordId}`);

            try {
                switch (proofRecord.state) {
                    case ProofState.RequestReceived:
                        console.log('📩 [RequestReceived] Proof request received - waiting for user action');
                        // Auto-accept disabled - UI will handle user's decision
                        // The ZkpRequestModal or ProofRequestDetailsScreen will handle acceptance/decline
                        const formatData = await agent.proofs.getFormatData(proofRecord.id);
                        console.log('📊 [RequestReceived] Format Data:', JSON.stringify(formatData, null, 2));
                        const requestedAttributes = (formatData.request as any).anoncreds?.requested_attributes;
                        const requestedPredicates = (formatData.request as any).anoncreds?.requested_predicates;
                        console.log('📊 [RequestReceived] Anoncreds:', JSON.stringify({ requestedAttributes, requestedPredicates }, null, 2));
                        break;

                    case ProofState.PresentationSent:
                        console.log("📤 PresentationSent - waiting for verifier response...");
                        break;

                    case ProofState.Done:
                        console.log('🎉 [Done] Proof exchange completed successfully!');
                        break;

                    default:
                        console.log(`ℹ️ [${proofRecord.state}] Unhandled proof state`);
                }
            } catch (error: any) {
                console.error(`❌ Error handling proof state ${proofRecord.state}:`, error);
            }
        }
    );

    console.log('✅ Proof event listener registered successfully');
};

export const setupConnectionEventListener = (agent: Agent) => {
    if (!agent) {
        console.error('❌ Cannot setup connection event listener: agent is null');
        return;
    }

    console.log('🎧 Setting up connection event listener...');

    agent.events.on<ConnectionStateChangedEvent>(
        ConnectionEventTypes.ConnectionStateChanged,
        async (event) => {
            const { connectionRecord } = event.payload;
            const recordId = connectionRecord.id;

            console.log(`📢 [Holder] Connection state changed to: ${connectionRecord.state}`);
            console.log(`📋 Record ID: ${recordId}`);

            if (connectionRecord.state === DidExchangeState.Completed) {
                console.log('🔗 Connection completed, refreshing connections...');
                await safeDispatchFetch(fetchConnections);

                // Update pending credentials with connectionId if they don't have one
                const state = store.getState();
                const pendingCreds = state.credo.pendingCredentials;
                const connectionTime = new Date(connectionRecord.createdAt?.toISOString() || new Date().toISOString()).getTime();

                pendingCreds.forEach((pending: any) => {
                    if (!pending.connectionId) {
                        const pendingTime = new Date(pending.timestamp).getTime();
                        const timeDiff = Math.abs(connectionTime - pendingTime);
                        // If connection was created within 10 seconds of pending, likely a match
                        if (timeDiff < 10000) {
                            store.dispatch(updatePendingCredential({
                                id: pending.id,
                                connectionId: connectionRecord.id,
                            }));
                        }
                    }
                });
            }
        }
    );

    console.log('✅ Connection event listener registered successfully');
};
