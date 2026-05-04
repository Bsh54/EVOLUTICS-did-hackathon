import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import {
  restoreWallet,
  validateBackup,
  loadBackupMetadata,
  setSelectedBackup,
  clearRestoreError,
} from '../../../store/slices/backupSlice';

/**
 * Hook for wallet restore operations
 * Provides restore functionality, validation, and state
 */
export const useRestore = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    isRestoring,
    restoreError,
    lastRestore,
    selectedBackup,
    selectedBackupMetadata,
  } = useSelector((state: RootState) => state.backup);

  const handleRestore = async (
    backupFilename: string,
    pin: string,
    exportKey: string,
    newWalletKey?: string
  ) => {
    return dispatch(
      restoreWallet({
        backupFilename,
        pin,
        exportKey,
        newWalletKey,
      })
    );
  };

  const handleValidate = async (backupFilename: string, pin: string) => {
    return dispatch(validateBackup({ backupFilename, pin }));
  };

  const handleLoadMetadata = async (backupFilename: string) => {
    return dispatch(loadBackupMetadata(backupFilename));
  };

  const handleSelectBackup = (backupFilename: string | null) => {
    dispatch(setSelectedBackup(backupFilename));
    if (backupFilename) {
      dispatch(loadBackupMetadata(backupFilename));
    }
  };

  const clearError = () => {
    dispatch(clearRestoreError());
  };

  return {
    isRestoring,
    restoreError,
    lastRestore,
    selectedBackup,
    selectedBackupMetadata,
    restore: handleRestore,
    validate: handleValidate,
    loadMetadata: handleLoadMetadata,
    selectBackup: handleSelectBackup,
    clearError,
  };
};

