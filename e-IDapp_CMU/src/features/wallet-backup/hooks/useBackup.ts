import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import {
  createBackup,
  clearBackupError,
} from '../../../store/slices/backupSlice';

/**
 * Hook for wallet backup operations
 * Provides backup creation functionality and state
 */
export const useBackup = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isBackingUp, backupError, lastBackup } = useSelector(
    (state: RootState) => state.backup
  );

  const handleCreateBackup = async (pin: string, exportKey: string) => {
    return dispatch(createBackup({ pin, exportKey }));
  };

  const clearError = () => {
    dispatch(clearBackupError());
  };

  return {
    isBackingUp,
    backupError,
    lastBackup,
    createBackup: handleCreateBackup,
    clearError,
  };
};

