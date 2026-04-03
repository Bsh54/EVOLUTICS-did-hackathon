import backupReducer, {
	createBackup,
	loadBackups,
	deleteBackup,
	validateBackup,
	loadBackupMetadata,
	clearBackupError,
	setSelectedBackup,
} from '../backupSlice';
import { WalletBackupService } from '../../../features/wallet-backup';
import { WalletRestoreService } from '../../../features/wallet-backup';
import { listBackups, deleteBackup as deleteBackupFile } from '../../../features/wallet-backup/utils/fileSystem';
import { credoAgentService } from '../../../services/agent';

// Mock the services and utilities
jest.mock('../../../features/wallet-backup', () => ({
	WalletBackupService: {
		createBackup: jest.fn(),
	},
	WalletRestoreService: {
		validateBackup: jest.fn(),
		loadMetadata: jest.fn(),
	},
}));

jest.mock('../../../features/wallet-backup/utils/fileSystem', () => ({
	listBackups: jest.fn(),
	deleteBackup: jest.fn(),
}));

jest.mock('../../../services/agent', () => ({
	credoAgentService: {
		getAgent: jest.fn(),
		restoreWalletFromBackup: jest.fn(),
	},
}));

describe('backupSlice', () => {
	const initialState = {
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

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('reducers', () => {
		it('should return the initial state', () => {
			expect(backupReducer(undefined, { type: undefined })).toEqual(initialState);
		});

		it('should clear backup error', () => {
			const state = { ...initialState, backupError: 'error' };
			const action = clearBackupError();
			expect(backupReducer(state, action).backupError).toBeNull();
		});

		it('should set selected backup', () => {
			const action = setSelectedBackup('test.backup');
			const newState = backupReducer(initialState, action);
			expect(newState.selectedBackup).toBe('test.backup');
		});

		it('should clear selected backup metadata when clearing selected backup', () => {
			const state = { ...initialState, selectedBackupMetadata: {} as any };
			const action = setSelectedBackup(null);
			const newState = backupReducer(state, action);
			expect(newState.selectedBackupMetadata).toBeNull();
		});
	});

	describe('async thunks', () => {
		describe('createBackup', () => {
			it('should handle successful backup creation', async () => {
				const mockResult = { success: true, backupPath: '/path/test.backup' };
				(credoAgentService.getAgent as jest.Mock).mockReturnValue({});
				(WalletBackupService.createBackup as jest.Mock).mockResolvedValue(mockResult);

				const dispatch = jest.fn();
				const thunk = createBackup({ pin: '1234', exportKey: 'key' });
				await thunk(dispatch, () => ({}), undefined);

				const [pending, fulfilled] = dispatch.mock.calls;
				expect(pending[ 0 ].type).toBe(createBackup.pending.type);
				expect(fulfilled[ 0 ].type).toBe(createBackup.fulfilled.type);
				expect(fulfilled[ 0 ].payload).toEqual(mockResult);
			});

			it('should handle failed backup creation', async () => {
				(credoAgentService.getAgent as jest.Mock).mockReturnValue({});
				(WalletBackupService.createBackup as jest.Mock).mockResolvedValue({
					success: false,
					error: 'Backup failed',
				});

				const dispatch = jest.fn();
				const thunk = createBackup({ pin: '1234', exportKey: 'key' });
				await thunk(dispatch, () => ({}), undefined);

				const [pending, rejected] = dispatch.mock.calls;
				expect(pending[ 0 ].type).toBe(createBackup.pending.type);
				expect(rejected[ 0 ].type).toBe(createBackup.rejected.type);
				expect(rejected[ 0 ].payload).toBe('Backup failed');
			});
		});

		describe('loadBackups', () => {
			it('should handle loading backups', async () => {
				const mockBackups = ['b1.backup', 'b2.backup'];
				(listBackups as jest.Mock).mockResolvedValue(mockBackups);

				const dispatch = jest.fn();
				const thunk = loadBackups();
				await thunk(dispatch, () => ({}), undefined);

				const [pending, fulfilled] = dispatch.mock.calls;
				expect(fulfilled[ 0 ].payload).toEqual(mockBackups);
			});
		});

		describe('deleteBackup', () => {
			it('should handle backup deletion', async () => {
				const filename = 'test.backup';
				(deleteBackupFile as jest.Mock).mockResolvedValue(undefined);

				const dispatch = jest.fn();
				const thunk = deleteBackup(filename);
				await thunk(dispatch, () => ({}), undefined);

				const [pending, fulfilled] = dispatch.mock.calls;
				expect(fulfilled[ 0 ].payload).toBe(filename);
			});
		});

		describe('validateBackup', () => {
			it('should handle successful validation', async () => {
				const mockResult = { valid: true, metadata: {} };
				(WalletRestoreService.validateBackup as jest.Mock).mockResolvedValue(mockResult);

				const dispatch = jest.fn();
				const thunk = validateBackup({ backupFilename: 'test.backup', pin: '1234' });
				await thunk(dispatch, () => ({}), undefined);

				const [pending, fulfilled] = dispatch.mock.calls;
				expect(fulfilled[ 0 ].payload).toEqual(mockResult);
			});
		});
	});
});

