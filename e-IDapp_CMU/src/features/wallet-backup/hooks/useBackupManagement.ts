import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { AppDispatch, RootState } from '../../../store';
import {
  loadBackups,
  deleteBackup,
  loadBackupMetadata,
} from '../../../store/slices/backupSlice';
import { BackupMetadata } from '../services/WalletBackupService';

/**
 * Hook for backup management operations
 * Handles automatic loading of backups and their metadata
 */
export const useBackupManagement = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { backups, backupsLoading, backupsError } = useSelector(
    (state: RootState) => state.backup
  );

  const [backupMetadata, setBackupMetadata] = useState<Record<string, BackupMetadata>>({});

  // Automatically reload backups when screen gains focus
  useFocusEffect(
    useCallback(() => {
      dispatch(loadBackups());
    }, [dispatch])
  );

  // Load metadata whenever the backups list changes
  useFocusEffect(
    useCallback(() => {
      const loadAllMetadata = async () => {
        if (backups.length === 0) return;

        const metadata: Record<string, BackupMetadata> = {};

        await Promise.all(
          backups.map(async (backup) => {
            try {
              const result = await dispatch(loadBackupMetadata(backup));
              if (loadBackupMetadata.fulfilled.match(result)) {
                metadata[backup] = result.payload;
              }
            } catch (error) {
              console.error(`Error loading metadata for ${backup}:`, error);
            }
          })
        );

        setBackupMetadata(metadata);
      };

      loadAllMetadata();
    }, [backups, dispatch])
  );

  const handleDeleteBackup = async (backupFilename: string) => {
    const result = await dispatch(deleteBackup(backupFilename));
    if (deleteBackup.fulfilled.match(result)) {
      setBackupMetadata((prev) => {
        const newMetadata = { ...prev };
        delete newMetadata[backupFilename];
        return newMetadata;
      });
      return true;
    }
    return false;
  };

  const handleLoadBackups = async () => {
    return dispatch(loadBackups());
  };

  return {
    backups,
    backupsLoading,
    backupsError,
    backupMetadata,
    loadBackups: handleLoadBackups,
    deleteBackup: handleDeleteBackup,
  };
};

