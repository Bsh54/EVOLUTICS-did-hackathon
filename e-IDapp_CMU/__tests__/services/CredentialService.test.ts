import { getCredentials, acceptCredentialOffer, findMostImportantAttribute } from '../../src/services/CredentialService';

describe('CredentialService', () => {
    let mockAgent: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockAgent = {
            credentials: {
                getAll: jest.fn(),
                acceptOffer: jest.fn(),
            },
            connections: {
                getAll: jest.fn(),
            },
            oob: {
                findById: jest.fn(),
            }
        };
    });

    describe('findMostImportantAttribute', () => {
        it('should return name if present', () => {
            const attrs = [
                { name: 'age', value: '25' },
                { name: 'name', value: 'John Doe' },
                { name: 'id', value: '123' }
            ];
            expect(findMostImportantAttribute(attrs)).toBe('John Doe');
        });

        it('should return title if name is missing', () => {
            const attrs = [
                { name: 'title', value: 'Software Engineer' },
                { name: 'id', value: '123' }
            ];
            expect(findMostImportantAttribute(attrs)).toBe('Software Engineer');
        });

        it('should exclude numerical attributes', () => {
            const attrs = [
                { name: 'age', value: '25' },
                { name: 'serial', value: '999' }
            ];
            expect(findMostImportantAttribute(attrs)).toBeNull();
        });

        it('should return first non-priority non-numerical attribute if priority list is missing', () => {
            const attrs = [
                { name: 'something', value: 'Important Data' }
            ];
            expect(findMostImportantAttribute(attrs)).toBe('Important Data');
        });
    });

    describe('getCredentials', () => {
        it('should enrich credentials with connection labels', async () => {
            const mockCreds = [
                { id: 'cred-1', threadId: 'thread-1', createdAt: new Date().toISOString() }
            ];
            const mockConns = [
                { id: 'conn-1', threadId: 'thread-1', theirLabel: 'Issuer A' }
            ];

            mockAgent.credentials.getAll.mockResolvedValue(mockCreds);
            mockAgent.connections.getAll.mockResolvedValue(mockConns);

            const result = await getCredentials(mockAgent);

            expect(result).toHaveLength(1);
            expect(result[0].connectionLabel).toBe('Issuer A');
        });

        it('should handle missing connection with fallback to "Unknown Issuer"', async () => {
            mockAgent.credentials.getAll.mockResolvedValue([{ id: '1', threadId: 'none', createdAt: new Date().toISOString() }]);
            mockAgent.connections.getAll.mockResolvedValue([]);

            const result = await getCredentials(mockAgent);
            expect(result[0].connectionLabel).toBe('Unknown Issuer');
        });

        it('should use OOB record if connection is missing but outOfBandId is present', async () => {
            const record = {
                id: '1',
                threadId: 'none',
                createdAt: new Date().toISOString(),
                metadata: { get: jest.fn().mockReturnValue('oob-1') }
            };
            mockAgent.credentials.getAll.mockResolvedValue([record]);
            mockAgent.connections.getAll.mockResolvedValue([]);
            mockAgent.oob.findById.mockResolvedValue({
                outOfBandInvitation: { label: 'OOB Issuer' }
            });

            const result = await getCredentials(mockAgent);
            expect(result[0].connectionLabel).toBe('OOB Issuer');
        });
    });

    describe('acceptCredentialOffer', () => {
        it('should call acceptOffer and build preview', async () => {
            const mockRecord = { id: 'rec-1' };
            mockAgent.credentials.acceptOffer.mockResolvedValue(mockRecord);
            const buildPreviewFn = jest.fn().mockResolvedValue({ id: 'preview-1' });

            const result = await acceptCredentialOffer(mockAgent, 'rec-1', buildPreviewFn);

            expect(mockAgent.credentials.acceptOffer).toHaveBeenCalledWith({ credentialRecordId: 'rec-1' });
            expect(buildPreviewFn).toHaveBeenCalledWith(mockRecord);
            expect(result).toEqual({ id: 'preview-1' });
        });
    });
});
