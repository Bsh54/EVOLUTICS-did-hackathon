import { Agent, ConnectionRecord, DidExchangeState, ConnectionStateChangedEvent, ConnectionEventTypes } from '@credo-ts/core';
import { isMediatorConnection } from '../utils/connectionUtils';

/**
 * Retry helper with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param initialDelay - Initial delay in milliseconds (default: 100)
 * @returns Promise with result of fn
 */
const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 100
): Promise<T> => {
    let lastError: any;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            const errorMessage = error?.message || String(error);
            
            // Check if error is about wallet not being initialized
            if (errorMessage.includes('not been initialized') || errorMessage.includes('Wallet has not been initialized')) {
                // If this is not the last attempt, wait and retry
                if (attempt < maxRetries) {
                    const delay = initialDelay * Math.pow(2, attempt);
                    console.log(`Wallet not ready, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
            }
            // For other errors or last attempt, throw immediately
            throw error;
        }
    }
    throw lastError;
};

export interface Connection {
    id: string;
    state: string;
    theirLabel?: string;
    createdAt: string;
    theirDid?: string;
    outOfBandId?: string;
    outOfBandLabel?: string;
    outOfBandInvitation?: any;
    handshakeProtocols?: string[];
    outOfBandMetadata?: any;
    credentialAttributesFromOOB?: Array<{ name: string; value: string }>;
    urlLabel?: string; // Label from URL parameter (&label=...)
    urlType?: string; // Type from URL parameter (&type=...)
}

// Helper to extract metadata from Map to plain object
export const extractMetadata = (metadata: any): any => {
    const result: any = {};
    try {
        if (metadata && typeof metadata.get === 'function') {
            // Try to iterate over metadata entries
            if (metadata.forEach) {
                metadata.forEach((value: any, key: string) => {
                    result[key] = typeof value === 'object' && value !== null ? value : { value };
                });
            }
        } else if (typeof metadata === 'object' && metadata !== null) {
            // If it's already a plain object
            return metadata;
        }
    } catch (error) {
        console.warn('Error extracting metadata:', error);
    }
    return result;
};

// Maps a ConnectionRecord to a Connection object
export const mapConnectionRecord = (record: ConnectionRecord | null | undefined, outOfBandRecord?: any, urlLabel?: any, urlType?: any): Connection => {
    if (!record) throw new Error('Connection record is null or undefined');

    const connection: Connection = {
        id: record.id,
        state: record.state,
        theirLabel: record.theirLabel || 'Unknown',
        createdAt: record.createdAt?.toISOString() || new Date().toISOString(),
        theirDid: record.theirDid,
    };

    // Add out-of-band record data if available
    if (outOfBandRecord) {
        const oobRecord = outOfBandRecord as any;
        connection.outOfBandId = outOfBandRecord.id;
        connection.outOfBandLabel = outOfBandRecord.outOfBandInvitation?.label;

        // Extract invitation details
        if (outOfBandRecord.outOfBandInvitation) {
            connection.outOfBandInvitation = {
                label: outOfBandRecord.outOfBandInvitation.label,
                goal: outOfBandRecord.outOfBandInvitation.goal,
                goalCode: outOfBandRecord.outOfBandInvitation.goalCode,
                accept: outOfBandRecord.outOfBandInvitation.accept,
                // Include any other relevant invitation fields
            };
        }

        connection.handshakeProtocols = oobRecord?.handshakeProtocols;

        // Extract metadata
        if (oobRecord?.metadata) {
            connection.outOfBandMetadata = extractMetadata(oobRecord.metadata);
        }

        // Extract credential attributes if available
        if (oobRecord?.requests) {
            try {
                for (const request of oobRecord.requests) {
                    if (request && typeof request === 'object') {
                        if ('credential_preview' in request || 'credentialPreview' in request) {
                            const preview = (request as any).credential_preview || (request as any).credentialPreview;
                            if (preview?.attributes) {
                                connection.credentialAttributesFromOOB = preview.attributes.map((attr: any) => ({
                                    name: attr.name || attr['mime-type'] || 'unknown',
                                    value: attr.value || '',
                                }));
                                break; // Found credential attributes, no need to continue
                            }
                        }
                    }
                }
            } catch (error) {
                console.warn('Error extracting credential attributes from out-of-band record:', error);
            }
        }
    }

    // Also check if connection record has outOfBandId
    if (record.outOfBandId) {
        connection.outOfBandId = record.outOfBandId;
    }

    // Store URL parameters if provided
    if (urlLabel) {
        connection.urlLabel = urlLabel;
    }
    if (urlType) {
        connection.urlType = urlType;
    }

    return connection;
};

export const getConnections = async (agent: Agent): Promise<Connection[]> => {
    if (!agent) throw new Error('Agent not initialized');
    try {
        // Fetch all connections to include those in progress
        // Use retry logic to handle wallet initialization race conditions
        const allConnections = await retryWithBackoff(async () => {
            return await agent.connections.getAll();
        });

        // Filter out connections that are just invitations or invitation-sent
        // We cast to any to avoid enum issues if we don't have all states imported
        const completedConnections = allConnections.filter(conn => {
            const state = conn.state as any;
            return state !== 'invitation' && state !== 'invitation-sent';
        });

        // Try to fetch out-of-band records for connections that have outOfBandId
        const connectionsWithOOB = await Promise.all(
            completedConnections.map(async (record) => {
                let outOfBandRecord = null;

                // If connection has outOfBandId, try to fetch the out-of-band record directly
                if (record.outOfBandId) {
                    try {
                        // Optimize: Fetch specific OOB record by ID instead of getting all
                        outOfBandRecord = await agent.oob.findById(record.outOfBandId);
                    } catch (error) {
                        // Silently fail or warn if OOB record not found, it's optional
                        // console.warn(`Could not fetch out-of-band record ${record.outOfBandId}:`, error);
                    }
                }

                return mapConnectionRecord(record, outOfBandRecord);
            })
        );

        // Filter out mediator connections using centralized utility
        const filteredConnections = connectionsWithOOB.filter(conn => !isMediatorConnection(conn));

        // Sort by createdAt descending (newest first)
        filteredConnections.sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        console.log('Filtered connections:', JSON.stringify(filteredConnections, null, 2));

        return filteredConnections;
    } catch (error) {
        console.log('Error getting connections:', error);
        return [];
    }
};

/**
 * Declines a connection by deleting the connection record and associated out-of-band record
 * @param agent - The Credo agent instance
 * @param invitationUrl - The invitation URL to decline
 * @returns Promise<void>
 */
export const declineConnection = async (agent: Agent, invitationUrl: string): Promise<void> => {
    if (!agent) throw new Error('Agent not initialized');

    try {
        console.log('Declining connection for invitation URL:', invitationUrl);

        // First, receive the invitation to get the out-of-band record
        const { outOfBandRecord, connectionRecord } = await agent.oob.receiveInvitationFromUrl(
            invitationUrl,
            { autoAcceptConnection: false }
        );

        console.log('Received invitation - OOB ID:', outOfBandRecord.id, 'Connection ID:', connectionRecord?.id);

        // Delete the connection record if it exists
        if (connectionRecord) {
            try {
                await agent.connections.deleteById(connectionRecord.id);
                console.log('Deleted connection record:', connectionRecord.id);
            } catch (error) {
                console.warn('Error deleting connection record:', error);
            }
        }

        // Delete the out-of-band record
        if (outOfBandRecord) {
            try {
                await agent.oob.deleteById(outOfBandRecord.id);
                console.log('Deleted out-of-band record:', outOfBandRecord.id);
            } catch (error) {
                console.warn('Error deleting out-of-band record:', error);
            }
        }

        console.log('Successfully declined connection');
    } catch (error) {
        console.error('Error declining connection:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to decline connection');
    }
};