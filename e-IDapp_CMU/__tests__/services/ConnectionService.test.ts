import { getConnections, declineConnection, mapConnectionRecord, extractMetadata } from '../../src/services/ConnectionService';
import { isMediatorConnection } from '../../src/utils/connectionUtils';

// Mock connectionUtils
jest.mock('../../src/utils/connectionUtils', () => ({
    isMediatorConnection: jest.fn(),
}));

describe('ConnectionService', () => {
    let mockAgent: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockAgent = {
            connections: {
                getAll: jest.fn(),
                deleteById: jest.fn(),
            },
            oob: {
                findById: jest.fn(),
                receiveInvitationFromUrl: jest.fn(),
                deleteById: jest.fn(),
            },
        };
        (isMediatorConnection as jest.Mock).mockReturnValue(false);
    });

    describe('extractMetadata', () => {
        it('should extract metadata from a Map-like object', () => {
            const mockMetadata = new Map([
                ['key1', 'value1'],
                ['key2', { nested: 'value' }]
            ]);
            const result = extractMetadata(mockMetadata);
            expect(result).toEqual({
                key1: { value: 'value1' },
                key2: { nested: 'value' }
            });
        });

        it('should return plain object as is', () => {
            const plain = { a: 1 };
            expect(extractMetadata(plain)).toEqual(plain);
        });
    });

    describe('mapConnectionRecord', () => {
        it('should map a ConnectionRecord correctly', () => {
            const record = {
                id: 'conn-1',
                state: 'completed',
                theirLabel: 'Test Issuer',
                createdAt: new Date('2023-01-01'),
                theirDid: 'did:sov:123',
            };
            const result = mapConnectionRecord(record as any);
            expect(result.id).toBe('conn-1');
            expect(result.theirLabel).toBe('Test Issuer');
            expect(result.state).toBe('completed');
        });

        it('should throw error if record is missing', () => {
            expect(() => mapConnectionRecord(null as any)).toThrow();
        });
    });

    describe('getConnections', () => {
        it('should return filtered and mapped connections', async () => {
            const mockRecords = [
                { id: '1', state: 'completed', theirLabel: 'Issuer A', createdAt: new Date('2023-01-01') },
                { id: '2', state: 'invitation', theirLabel: 'Pending', createdAt: new Date('2023-01-02') },
            ];
            mockAgent.connections.getAll.mockResolvedValue(mockRecords);

            const connections = await getConnections(mockAgent);

            expect(connections).toHaveLength(1);
            expect(connections[0].id).toBe('1');
            expect(mockAgent.connections.getAll).toHaveBeenCalled();
        });

        it('should filter out mediator connections', async () => {
            const mockRecords = [
                { id: '1', state: 'completed', theirLabel: 'Mediator', createdAt: new Date() },
            ];
            mockAgent.connections.getAll.mockResolvedValue(mockRecords);
            (isMediatorConnection as jest.Mock).mockReturnValue(true);

            const connections = await getConnections(mockAgent);
            expect(connections).toHaveLength(0);
        });

        it('should retry if wallet is not initialized', async () => {
            mockAgent.connections.getAll
                .mockRejectedValueOnce(new Error('Wallet has not been initialized'))
                .mockResolvedValueOnce([{ id: '1', state: 'completed', createdAt: new Date() }]);

            // Speed up test by using fake timers or just letting it run if delay is small
            const connections = await getConnections(mockAgent);
            expect(connections).toHaveLength(1);
            expect(mockAgent.connections.getAll).toHaveBeenCalledTimes(2);
        });
    });

    describe('declineConnection', () => {
        it('should decline connection and delete records', async () => {
            const invitationUrl = 'https://example.com/invite';
            const mockOobRecord = { id: 'oob-1' };
            const mockConnRecord = { id: 'conn-1' };

            mockAgent.oob.receiveInvitationFromUrl.mockResolvedValue({
                outOfBandRecord: mockOobRecord,
                connectionRecord: mockConnRecord
            });

            await declineConnection(mockAgent, invitationUrl);

            expect(mockAgent.oob.receiveInvitationFromUrl).toHaveBeenCalledWith(invitationUrl, { autoAcceptConnection: false });
            expect(mockAgent.connections.deleteById).toHaveBeenCalledWith('conn-1');
            expect(mockAgent.oob.deleteById).toHaveBeenCalledWith('oob-1');
        });

        it('should handle missing connection record during decline', async () => {
            mockAgent.oob.receiveInvitationFromUrl.mockResolvedValue({
                outOfBandRecord: { id: 'oob-1' },
                connectionRecord: null
            });

            await declineConnection(mockAgent, 'url');
            expect(mockAgent.connections.deleteById).not.toHaveBeenCalled();
            expect(mockAgent.oob.deleteById).toHaveBeenCalledWith('oob-1');
        });
    });
});
