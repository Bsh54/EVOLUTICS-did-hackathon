import { renderHook, act } from '@testing-library/react-native';
import { useMediatorConnection } from '../../src/hooks/useMediatorConnection';
import { isMediatorConnected, connectToMediator } from '../../src/services/mediator';
import { credoAgentService } from '../../src/services/agent';

// Mock the services
jest.mock('../../src/services/mediator', () => ({
    isMediatorConnected: jest.fn(),
    connectToMediator: jest.fn(),
}));

jest.mock('../../src/services/agent', () => ({
    credoAgentService: {
        isAgentInitialized: jest.fn(),
    },
}));

describe('useMediatorConnection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize with default values and check connection', async () => {
        (isMediatorConnected as jest.Mock).mockResolvedValue(true);

        const { result } = renderHook(() => useMediatorConnection());

        expect(result.current.isConnected).toBe(false);
        expect(result.current.isConnecting).toBe(false);
        expect(result.current.error).toBe(null);

        await act(async () => {
            await result.current.checkConnection();
        });

        expect(isMediatorConnected).toHaveBeenCalled();
        expect(result.current.isConnected).toBe(true);
    });

    it('should handle error during connection check', async () => {
        (isMediatorConnected as jest.Mock).mockRejectedValue(new Error('Check failed'));

        // Silence console.error for this test
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        const { result } = renderHook(() => useMediatorConnection());

        await act(async () => {
            const connected = await result.current.checkConnection();
            expect(connected).toBe(false);
        });

        expect(result.current.isConnected).toBe(false);
        consoleSpy.mockRestore();
    });

    it('should connect to mediator successfully', async () => {
        (credoAgentService.isAgentInitialized as jest.Mock).mockReturnValue(true);
        (connectToMediator as jest.Mock).mockResolvedValue('connection-id');

        const { result } = renderHook(() => useMediatorConnection());

        await act(async () => {
            await result.current.connect();
        });

        expect(credoAgentService.isAgentInitialized).toHaveBeenCalled();
        expect(connectToMediator).toHaveBeenCalled();
        expect(result.current.isConnected).toBe(true);
        expect(result.current.isConnecting).toBe(false);
        expect(result.current.error).toBe(null);
    });

    it('should fail to connect if agent is not initialized', async () => {
        (credoAgentService.isAgentInitialized as jest.Mock).mockReturnValue(false);

        const { result } = renderHook(() => useMediatorConnection());

        await act(async () => {
            await result.current.connect();
        });

        expect(result.current.error).toBe('Agent must be initialized first');
        expect(result.current.isConnected).toBe(false);
        expect(connectToMediator).not.toHaveBeenCalled();
    });

    it('should handle error during connection', async () => {
        (credoAgentService.isAgentInitialized as jest.Mock).mockReturnValue(true);
        (connectToMediator as jest.Mock).mockRejectedValue(new Error('Connection failed'));

        // Silence console.error
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        const { result } = renderHook(() => useMediatorConnection());

        await act(async () => {
            await result.current.connect();
        });

        expect(result.current.error).toBe('Connection failed');
        expect(result.current.isConnected).toBe(false);
        consoleSpy.mockRestore();
    });

    it('should not connect if already connecting', async () => {
        (credoAgentService.isAgentInitialized as jest.Mock).mockReturnValue(true);
        (connectToMediator as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('id'), 100)));

        const { result } = renderHook(() => useMediatorConnection());

        let promise: Promise<void>;
        await act(async () => {
            promise = result.current.connect();
        });

        // Try connecting again while first one is in progress
        await act(async () => {
            await result.current.connect();
        });

        expect(connectToMediator).toHaveBeenCalledTimes(1);

        await act(async () => {
            await promise;
        });
    });
});
