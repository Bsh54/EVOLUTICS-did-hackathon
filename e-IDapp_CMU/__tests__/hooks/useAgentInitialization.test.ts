import { renderHook, act } from '@testing-library/react-native';
import { useAgentInitialization } from '../../src/hooks/useAgentInitialization';
import { useDispatch, useSelector } from 'react-redux';
import { initializeAgent, loadStoredData } from '../../src/store/slices/credoSlice';
import { credoAgentService } from '../../src/services/agent';
import { loadUserData } from '../../src/utils/localStorage';

// Mock redux
jest.mock('react-redux', () => ({
    useDispatch: jest.fn(),
    useSelector: jest.fn(),
}));

// Mock credoSlice actions
jest.mock('../../src/store/slices/credoSlice', () => ({
    initializeAgent: jest.fn(() => () => { }),
    loadStoredData: jest.fn(() => () => { }),
}));

// Mock credoAgentService
jest.mock('../../src/services/agent', () => ({
    credoAgentService: {
        isAgentInitialized: jest.fn(),
    },
}));

// Mock localStorage
jest.mock('../../src/utils/localStorage', () => ({
    loadUserData: jest.fn(),
}));

describe('useAgentInitialization', () => {
    const mockDispatch = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useDispatch as unknown as jest.Mock).mockReturnValue(mockDispatch);
        mockDispatch.mockReturnValue({
            unwrap: jest.fn().mockResolvedValue({}),
        });
    });

    it('should not initialize if already initializing', () => {
        (useSelector as unknown as jest.Mock).mockImplementation((selector) => selector({
            credo: { isInitialized: false, isInitializing: true },
            user: { name: 'Test User' }
        }));

        renderHook(() => useAgentInitialization());

        expect(loadUserData).not.toHaveBeenCalled();
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should not initialize if already initialized and service confirms', () => {
        (useSelector as unknown as jest.Mock).mockImplementation((selector) => selector({
            credo: { isInitialized: true, isInitializing: false },
            user: { name: 'Test User' }
        }));
        (credoAgentService.isAgentInitialized as jest.Mock).mockReturnValue(true);

        renderHook(() => useAgentInitialization());

        expect(loadUserData).not.toHaveBeenCalled();
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should initialize if not initialized and PIN is available', async () => {
        (useSelector as unknown as jest.Mock).mockImplementation((selector) => selector({
            credo: { isInitialized: false, isInitializing: false },
            user: { name: 'Test User' }
        }));
        (credoAgentService.isAgentInitialized as jest.Mock).mockReturnValue(false);
        (loadUserData as jest.Mock).mockResolvedValue({ name: 'Stored User', pin: '123456' });

        renderHook(() => useAgentInitialization());

        await act(async () => {
            // Wait for mount effects
        });

        expect(loadUserData).toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalledWith(expect.any(Function)); // initializeAgent thunk
        expect(initializeAgent).toHaveBeenCalledWith({
            label: 'Stored User',
            pin: '123456',
            endpoints: []
        });
        expect(loadStoredData).toHaveBeenCalled();
    });

    it('should not initialize if user data or PIN is missing', async () => {
        (useSelector as unknown as jest.Mock).mockImplementation((selector) => selector({
            credo: { isInitialized: false, isInitializing: false },
            user: { name: 'Test User' }
        }));
        (credoAgentService.isAgentInitialized as jest.Mock).mockReturnValue(false);
        (loadUserData as jest.Mock).mockResolvedValue(null);

        renderHook(() => useAgentInitialization());

        await act(async () => {
            // Wait for mount effects
        });

        expect(loadUserData).toHaveBeenCalled();
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should handle initialization error gracefully', async () => {
        (useSelector as unknown as jest.Mock).mockImplementation((selector) => selector({
            credo: { isInitialized: false, isInitializing: false },
            user: { name: 'Test User' }
        }));
        (credoAgentService.isAgentInitialized as jest.Mock).mockReturnValue(false);
        (loadUserData as jest.Mock).mockResolvedValue({ pin: '123456' });

        const unwrapMock = jest.fn().mockRejectedValue(new Error('Init Failed'));
        mockDispatch.mockReturnValue({ unwrap: unwrapMock });

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        renderHook(() => useAgentInitialization());

        await act(async () => {
            // Wait for mount effects
        });

        expect(initializeAgent).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});
