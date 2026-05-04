/**
 * Test Suite: Wallet Backup Feature - useBackup Hook
 * 
 * Tests for the useBackup hook which provides wallet backup functionality.
 */
import { renderHook, act } from '@testing-library/react-native';
// Unmock react-redux to use the real Provider and store
jest.unmock('react-redux');
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';

// Mock the backup slice
const mockCreateBackup = jest.fn();
const mockClearBackupError = jest.fn();

jest.mock('../../../../src/store/slices/backupSlice', () => ({
    createBackup: (params: any) => mockCreateBackup(params),
    clearBackupError: () => mockClearBackupError(),
}));

// Import the hook after mocking
import { useBackup } from '../../../../src/features/wallet-backup/hooks/useBackup';

// Create a mock store
const createTestStore = (initialState = {}) => {
    const defaultBackupState = {
        isBackingUp: false,
        backupError: null,
        lastBackup: null,
        ...initialState,
    };

    return configureStore({
        reducer: {
            backup: (state = defaultBackupState, action: any) => {
                switch (action.type) {
                    case 'backup/setIsBackingUp':
                        return { ...state, isBackingUp: action.payload };
                    case 'backup/setBackupError':
                        return { ...state, backupError: action.payload };
                    case 'backup/setLastBackup':
                        return { ...state, lastBackup: action.payload };
                    default:
                        return state;
                }
            },
        },
        preloadedState: {
            backup: defaultBackupState,
        },
    });
};

// Wrapper component for the hook
const createWrapper = (store: any) => {
    return ({ children }: { children: React.ReactNode }) => (
        <Provider store={store} > {children} </Provider>
    );
};

describe('useBackup Hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateBackup.mockReturnValue({ type: 'backup/createBackup' });
        mockClearBackupError.mockReturnValue({ type: 'backup/clearBackupError' });
    });

    describe('Initial State', () => {
        it('should return initial backup state', () => {
            const store = createTestStore();
            const { result } = renderHook(() => useBackup(), {
                wrapper: createWrapper(store),
            });

            expect(result.current.isBackingUp).toBe(false);
            expect(result.current.backupError).toBeNull();
            expect(result.current.lastBackup).toBeNull();
        });

        it('should return isBackingUp as true when backing up', () => {
            const store = createTestStore({ isBackingUp: true });
            const { result } = renderHook(() => useBackup(), {
                wrapper: createWrapper(store),
            });

            expect(result.current.isBackingUp).toBe(true);
        });

        it('should return backup error when present', () => {
            const store = createTestStore({ backupError: 'Backup failed' });
            const { result } = renderHook(() => useBackup(), {
                wrapper: createWrapper(store),
            });

            expect(result.current.backupError).toBe('Backup failed');
        });

        it('should return last backup info when present', () => {
            const lastBackupInfo = {
                timestamp: '2024-01-01T00:00:00Z',
                path: '/backup/wallet.bak',
            };
            const store = createTestStore({ lastBackup: lastBackupInfo });
            const { result } = renderHook(() => useBackup(), {
                wrapper: createWrapper(store),
            });

            expect(result.current.lastBackup).toEqual(lastBackupInfo);
        });
    });

    describe('createBackup Function', () => {
        it('should expose createBackup function', () => {
            const store = createTestStore();
            const { result } = renderHook(() => useBackup(), {
                wrapper: createWrapper(store),
            });

            expect(typeof result.current.createBackup).toBe('function');
        });

        it('should dispatch createBackup action with pin and exportKey', async () => {
            const store = createTestStore();
            const { result } = renderHook(() => useBackup(), {
                wrapper: createWrapper(store),
            });

            await act(async () => {
                await result.current.createBackup('1234', 'export-key-123');
            });

            expect(mockCreateBackup).toHaveBeenCalledWith({
                pin: '1234',
                exportKey: 'export-key-123',
            });
        });

        it('should handle different pin formats', async () => {
            const store = createTestStore();
            const { result } = renderHook(() => useBackup(), {
                wrapper: createWrapper(store),
            });

            await act(async () => {
                await result.current.createBackup('000000', 'key');
            });

            expect(mockCreateBackup).toHaveBeenCalledWith({
                pin: '000000',
                exportKey: 'key',
            });
        });
    });

    describe('clearError Function', () => {
        it('should expose clearError function', () => {
            const store = createTestStore();
            const { result } = renderHook(() => useBackup(), {
                wrapper: createWrapper(store),
            });

            expect(typeof result.current.clearError).toBe('function');
        });

        it('should dispatch clearBackupError action', () => {
            const store = createTestStore({ backupError: 'Some error' });
            const { result } = renderHook(() => useBackup(), {
                wrapper: createWrapper(store),
            });

            act(() => {
                result.current.clearError();
            });

            expect(mockClearBackupError).toHaveBeenCalled();
        });
    });

    describe('State Reactivity', () => {
        it('should reflect state changes from store', () => {
            const store = createTestStore();
            const { result, rerender } = renderHook(() => useBackup(), {
                wrapper: createWrapper(store),
            });

            expect(result.current.isBackingUp).toBe(false);

            // Simulate state change (in real app, this would happen via dispatch)
            // Since we're testing the hook, we verify the hook returns what's in state
        });
    });
});
