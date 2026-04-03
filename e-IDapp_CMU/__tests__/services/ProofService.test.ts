import { getProofRequests, acceptProofRequest, declineProofRequest, getMatchingCredentialsForProofRequest } from '../../src/services/ProofService';
import { ProofState } from '@credo-ts/core';

describe('ProofService', () => {
    let mockAgent: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockAgent = {
            proofs: {
                getAll: jest.fn(),
                getById: jest.fn(),
                getCredentialsForRequest: jest.fn(),
                selectCredentialsForRequest: jest.fn(),
                acceptRequest: jest.fn(),
                declineRequest: jest.fn(),
            }
        };
    });

    describe('getProofRequests', () => {
        it('should return only RequestReceived records', async () => {
            const records = [
                { id: '1', state: ProofState.RequestReceived },
                { id: '2', state: ProofState.Done },
            ];
            mockAgent.proofs.getAll.mockResolvedValue(records);

            const result = await getProofRequests(mockAgent);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('1');
        });
    });

    describe('getMatchingCredentialsForProofRequest', () => {
        it('should extract and deduplicate matching credentials', async () => {
            mockAgent.proofs.getCredentialsForRequest.mockResolvedValue({
                proofFormats: {
                    anoncreds: {
                        attributes: {
                            attr1: [
                                { credentialId: 'cred-1', credentialInfo: { attributes: { a: 1 } } },
                                { credentialId: 'cred-1', credentialInfo: { attributes: { a: 1 } } } // Duplicate
                            ],
                            attr2: [
                                { credentialId: 'cred-2', credentialInfo: { attributes: { b: 2 } } }
                            ]
                        }
                    }
                }
            });

            const result = await getMatchingCredentialsForProofRequest(mockAgent, 'proof-1');
            expect(result).toHaveLength(2);
            expect(result[0].credentialId).toBe('cred-1');
            expect(result[1].credentialId).toBe('cred-2');
        });
    });

    describe('acceptProofRequest', () => {
        it('should select credentials and accept request', async () => {
            mockAgent.proofs.getById.mockResolvedValue({ state: ProofState.RequestReceived });
            mockAgent.proofs.selectCredentialsForRequest.mockResolvedValue({
                proofFormats: { anoncreds: {} }
            });
            mockAgent.proofs.acceptRequest.mockResolvedValue({ success: true });

            const result = await acceptProofRequest(mockAgent, 'proof-1');

            expect(mockAgent.proofs.selectCredentialsForRequest).toHaveBeenCalled();
            expect(mockAgent.proofs.acceptRequest).toHaveBeenCalledWith({
                proofRecordId: 'proof-1',
                proofFormats: { anoncreds: {} }
            });
            expect(result).toBeDefined();
        });

        it('should throw error if selection fails', async () => {
            mockAgent.proofs.getById.mockResolvedValue({ state: ProofState.RequestReceived });
            mockAgent.proofs.selectCredentialsForRequest.mockResolvedValue(null);

            await expect(acceptProofRequest(mockAgent, '1')).rejects.toThrow('Unable to select credentials');
        });
    });

    describe('declineProofRequest', () => {
        it('should call declineRequest', async () => {
            await declineProofRequest(mockAgent, 'proof-1');
            expect(mockAgent.proofs.declineRequest).toHaveBeenCalledWith({ proofRecordId: 'proof-1' });
        });
    });
});
