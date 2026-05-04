import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { credoAgentService } from '../../services/agent';
import { WalletBackupService, BackupResult, BackupMetadata } from '../../features/wallet-backup';
import { WalletRestoreService, RestoreResult } from '../../features/wallet-backup';
import { listBackups, deleteBackup as deleteBackupFile } from '../../features/wallet-backup/utils/fileSystem';

export interface BackupState {
	// Backup operations
	isBackingUp: boolean;
	backupError: string | null;
	lastBackup: BackupResult | null;

	// Restore operations
	isRestoring: boolean;
	restoreError: string | null;
	lastRestore: RestoreResult | null;

	// Backup list
	backups: string[];
	backupsLoading: boolean;
	backupsError: string | null;

	// Selected backup for restore
	selectedBackup: string | null;
	selectedBackupMetadata: BackupMetadata | null;
}

const initialState: BackupState = {
	isBackingUp: false,
	backupError: null,
	lastBackup: null,

	isRestoring: false,
	restoreError: null,
	lastRestore: null,

	backups: [],
	backupsLoading: false,
	backupsError: null,

	selectedBackup: null,
	selectedBackupMetadata: null,
};

/**
 * Create a wallet backup
 */
export const createBackup = createAsyncThunk(
	'backup/createBackup',
	async (
		{ pin, exportKey }: { pin: string; exportKey: string },
		{ rejectWithValue }
	) => {
		try {
			const agent = credoAgentService.getAgent();
			if (!agent) {
				throw new Error('Agent not initialized');
			}

			const result = await WalletBackupService.createBackup(agent, pin, exportKey);

			if (!result.success) {
				throw new Error(result.error || 'Failed to create backup');
			}

			return result;
		} catch (error: any) {
			return rejectWithValue(error.message || 'Failed to create backup');
		}
	}
);

/**
 * Restore wallet from backup
 */
export const restoreWallet = createAsyncThunk(
	'backup/restoreWallet',
	async (
		{
			backupFilename,
			pin,
			exportKey,
			newWalletKey,
		}: {
			backupFilename: string;
			pin: string;
			exportKey: string;
			newWalletKey?: string;
		},
		{ rejectWithValue, dispatch }
	) => {
		try {
			const result = await credoAgentService.restoreWalletFromBackup(
				backupFilename,
				pin,
				exportKey,
				newWalletKey
			);

			if (!result.success) {
				throw new Error(result.error || 'Failed to restore wallet');
			}

			// Refresh user data in Redux from storage (restored profile)
			try {
				await dispatch((await import('./userSlice')).loadUserDataFromStorage());
			} catch (e) {
				console.warn('Failed to refresh user data after restore:', e);
			}

			return {
				success: true,
			} as RestoreResult;
		} catch (error: any) {
			return rejectWithValue(error.message || 'Failed to restore wallet');
		}
	}
);

/**
 * Load list of available backups
 */
export const loadBackups = createAsyncThunk(
	'backup/loadBackups',
	async (_, { rejectWithValue }) => {
		try {
			const backups = await listBackups();
			return backups;
		} catch (error: any) {
			return rejectWithValue(error.message || 'Failed to load backups');
		}
	}
);

/**
 * Delete a backup
 */
export const deleteBackup = createAsyncThunk(
	'backup/deleteBackup',
	async (backupFilename: string, { rejectWithValue }) => {
		try {
			await deleteBackupFile(backupFilename);
			return backupFilename;
		} catch (error: any) {
			return rejectWithValue(error.message || 'Failed to delete backup');
		}
	}
);

/**
 * Validate backup file
 */
export const validateBackup = createAsyncThunk(
	'backup/validateBackup',
	async (
		{ backupFilename, pin }: { backupFilename: string; pin: string },
		{ rejectWithValue }
	) => {
		try {
			const result = await WalletRestoreService.validateBackup(backupFilename, pin);

			if (!result.valid) {
				throw new Error(result.error || 'Backup validation failed');
			}

			return result;
		} catch (error: any) {
			return rejectWithValue(error.message || 'Backup validation failed');
		}
	}
);

/**
 * Load backup metadata
 */
export const loadBackupMetadata = createAsyncThunk(
	'backup/loadBackupMetadata',
	async (backupFilename: string, { rejectWithValue }) => {
		try {
			const metadata = await WalletRestoreService.loadMetadata(backupFilename);

			if (!metadata) {
				throw new Error('Backup metadata not found');
			}

			return metadata;
		} catch (error: any) {
			return rejectWithValue(error.message || 'Failed to load backup metadata');
		}
	}
);

const backupSlice = createSlice({
	name: 'backup',
	initialState,
	reducers: {
		clearBackupError: (state) => {
			state.backupError = null;
		},
		clearRestoreError: (state) => {
			state.restoreError = null;
		},
		setSelectedBackup: (state, action: PayloadAction<string | null>) => {
			state.selectedBackup = action.payload;
			if (!action.payload) {
				state.selectedBackupMetadata = null;
			}
		},
		resetBackupState: () => {
			return initialState;
		},
	},
	extraReducers: (builder) => {
		// Create backup
		builder
			.addCase(createBackup.pending, (state) => {
				state.isBackingUp = true;
				state.backupError = null;
			})
			.addCase(createBackup.fulfilled, (state, action) => {
				state.isBackingUp = false;
				state.lastBackup = action.payload;
				state.backupError = null;

				// Add the new backup to the list if it's not already there
				if (action.payload.backupPath) {
					// Extract filename from path (handles both / and \ just in case)
					const filename = action.payload.backupPath.split(/[/\\]/).pop();
					if (filename && !state.backups.includes(filename)) {
						state.backups.push(filename);
						// Sort backups to show newest first (optional, but good for UX)
						state.backups.sort().reverse();
					}
				}
			})
			.addCase(createBackup.rejected, (state, action) => {
				state.isBackingUp = false;
				state.backupError = action.payload as string;
			});

		// Restore wallet
		builder
			.addCase(restoreWallet.pending, (state) => {
				state.isRestoring = true;
				state.restoreError = null;
			})
			.addCase(restoreWallet.fulfilled, (state, action) => {
				state.isRestoring = false;
				state.lastRestore = action.payload;
				state.restoreError = null;
			})
			.addCase(restoreWallet.rejected, (state, action) => {
				state.isRestoring = false;
				state.restoreError = action.payload as string;
			});

		// Load backups
		builder
			.addCase(loadBackups.pending, (state) => {
				state.backupsLoading = true;
				state.backupsError = null;
			})
			.addCase(loadBackups.fulfilled, (state, action) => {
				state.backupsLoading = false;
				state.backups = action.payload;
				state.backupsError = null;
			})
			.addCase(loadBackups.rejected, (state, action) => {
				state.backupsLoading = false;
				state.backupsError = action.payload as string;
			});

		// Delete backup
		builder
			.addCase(deleteBackup.fulfilled, (state, action) => {
				state.backups = state.backups.filter((b) => b !== action.payload);
			});

		// Load backup metadata
		builder
			.addCase(loadBackupMetadata.fulfilled, (state, action) => {
				state.selectedBackupMetadata = action.payload;
			});
	},
});

export const {
	clearBackupError,
	clearRestoreError,
	setSelectedBackup,
	resetBackupState,
} = backupSlice.actions;

export default backupSlice.reducer;

