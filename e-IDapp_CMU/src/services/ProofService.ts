import { Agent, ProofState } from '@credo-ts/core';

export const getProofRequests = async (agent: Agent) => {
    const records = await agent.proofs.getAll();
    return records.filter(r => r.state === ProofState.RequestReceived);
};

export const getProofRecord = async (agent: Agent, proofRecordId: string) => {
    return await agent.proofs.getById(proofRecordId);
};

/**
 * Get all matching credentials for a proof request
 * Returns credentials that match by credential definition ID or schema ID
 * This allows users to select which credential to share when multiple match
 */
export const getMatchingCredentialsForProofRequest = async (
    agent: Agent,
    proofRecordId: string
) => {
    try {
        // Get all credentials that could potentially match this proof request
        const retrievedCredentials = await agent.proofs.getCredentialsForRequest({
            proofRecordId,
        });

        console.log('Retrieved credentials:', retrievedCredentials);

        // Parse and deduplicate credentials
        const matchingCredentials: any[] = [];
        const seenCredentialIds = new Set<string>();

        if (retrievedCredentials && (retrievedCredentials.proofFormats as any)?.anoncreds) {
            const anonCreds = (retrievedCredentials.proofFormats as any).anoncreds;

            // Process requested attributes
            if (anonCreds.attributes) {
                Object.entries(anonCreds.attributes).forEach(([attrName, credentials]: [string, any]) => {
                    if (Array.isArray(credentials) && credentials.length > 0) {
                        credentials.forEach((cred: any) => {
                            if (!seenCredentialIds.has(cred.credentialId)) {
                                matchingCredentials.push({
                                    credentialId: cred.credentialId,
                                    credentialDefinitionId: cred.credentialInfo?.credentialDefinitionId,
                                    schemaId: cred.credentialInfo?.schemaId,
                                    attributes: cred.credentialInfo?.attributes || {},
                                    credentialInfo: cred.credentialInfo,
                                });
                                seenCredentialIds.add(cred.credentialId);
                            }
                        });
                    }
                });
            }

            // Process requested predicates (if any)
            if (anonCreds.predicates) {
                Object.entries(anonCreds.predicates).forEach(([predName, credentials]: [string, any]) => {
                    if (Array.isArray(credentials) && credentials.length > 0) {
                        credentials.forEach((cred: any) => {
                            if (!seenCredentialIds.has(cred.credentialId)) {
                                matchingCredentials.push({
                                    credentialId: cred.credentialId,
                                    credentialDefinitionId: cred.credentialInfo?.credentialDefinitionId,
                                    schemaId: cred.credentialInfo?.schemaId,
                                    attributes: cred.credentialInfo?.attributes || {},
                                    credentialInfo: cred.credentialInfo,
                                });
                                seenCredentialIds.add(cred.credentialId);
                            }
                        });
                    }
                });
            }
        }

        console.log(`✅ Found ${matchingCredentials.length} matching credentials`);
        return matchingCredentials;
    } catch (error: any) {
        console.error('❌ Error getting matching credentials:', error);
        throw error;
    }
};

export const acceptProofRequest = async (agent: Agent, proofRecordId: string) => {
    try {
        console.log(`📝 Attempting to accept proof request: ${proofRecordId}`);

        // Get the proof record first to see what's being requested
        const proofRecord = await agent.proofs.getById(proofRecordId);
        console.log(`📋 Proof record state: ${proofRecord.state}`);
        console.log(`📋 Proof record details:`, JSON.stringify(proofRecord, null, 2));

        // Try to auto-select credentials
        console.log('🔍 Attempting to auto-select credentials...');
        const requestedCredentials = await agent.proofs.selectCredentialsForRequest({
            proofRecordId,
        });

        if (!requestedCredentials) {
            console.error('❌ Could not automatically select credentials');
            throw new Error('Could not automatically select credentials for proof request. You may not have the required credentials.');
        }

        console.log('✅ Credentials selected successfully');
        console.log('📋 Selected credentials:', JSON.stringify(requestedCredentials, null, 2));

        // Accept the proof request with selected credentials
        console.log('📤 Sending proof...');
        const result = await agent.proofs.acceptRequest({
            proofRecordId,
            proofFormats: requestedCredentials.proofFormats,
        });

        console.log('✅ Proof sent successfully');
        console.log('📋 Result:', JSON.stringify(result, null, 2));

        return result;
    } catch (error: any) {
        console.error('❌ Error in acceptProofRequest:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        // Provide more specific error messages
        if (error.message?.includes('No credentials found')) {
            throw new Error('You do not have the required credentials to fulfill this proof request.');
        } else if (error.message?.includes('select credentials')) {
            throw new Error('Unable to select credentials. Please ensure you have the required credentials.');
        } else {
            throw new Error(error.message || 'Failed to accept proof request');
        }
    }
};

export const declineProofRequest = async (agent: Agent, proofRecordId: string) => {
    await agent.proofs.declineRequest({ proofRecordId });
};
