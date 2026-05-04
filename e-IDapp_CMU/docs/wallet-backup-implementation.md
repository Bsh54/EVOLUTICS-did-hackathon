# Wallet Backup & Restore Implementation

## Overview

This document describes the implementation of the wallet backup and restore feature, which allows users to create encrypted backups of their wallet and restore them when needed. The feature follows the established feature-based architecture pattern.

## Architecture

### Feature Structure

The wallet backup feature is organized in `src/features/wallet-backup/` following the established pattern:

```
src/features/wallet-backup/
├── components/
│   ├── BackupWalletScreen.tsx
│   ├── RestoreWalletScreen.tsx
│   └── BackupManagementScreen.tsx
├── hooks/
│   ├── useBackup.ts
│   ├── useRestore.ts
│   ├── useBackupManagement.ts
│   └── index.ts
├── services/
│   ├── WalletBackupService.ts
│   ├── WalletRestoreService.ts
│   └── __tests__/
│       ├── WalletBackupService.test.ts
│       └── WalletRestoreService.test.ts
├── utils/
│   ├── fileSystem.ts
│   ├── backupEncryption.ts
│   └── __tests__/
│       ├── fileSystem.test.ts
│       └── backupEncryption.test.ts
└── index.ts
```

### Redux State Tests

The Redux state management is also covered by unit tests:

- `src/store/slices/__tests__/backupSlice.test.ts`

### Component Hierarchy

- **BackupWalletScreen**: UI for creating wallet backups
- **RestoreWalletScreen**: UI for restoring wallet from backup
- **BackupManagementScreen**: UI for managing available backups

### Service Layer

- **WalletBackupService**: Handles wallet export, encryption, and file storage
- **WalletRestoreService**: Handles backup loading, decryption, and wallet import

### Utility Layer

- **fileSystem.ts**: File system operations using `react-native-fs`
- **backupEncryption.ts**: AES encryption/decryption using user PIN

## Implementation Details

### Backup Process

1. **User Input**: User provides PIN and export key
2. **PIN Verification**: PIN is verified against stored PIN
3. **Wallet Export**: Credo's `agent.wallet.export()` exports the wallet with export key encryption
4. **Additional Encryption**: Exported data is encrypted again with user PIN using AES-256-CBC
5. **File Storage**: Encrypted backup and metadata are saved to device storage
6. **Metadata Creation**: Backup metadata (wallet ID, timestamp, size, etc.) is saved

### Restore Process

1. **Backup Selection**: User selects a backup file from available backups
2. **User Input**: User provides PIN and export key
3. **PIN Decryption**: Backup file is decrypted using user PIN
4. **Credo Decryption**: Decrypted data is passed to Credo's `agent.wallet.import()` with export key
5. **Wallet Import**: Credo imports the wallet and reinitializes the agent
6. **State Reset**: App state is reset and user is navigated to login

### Encryption Details

The backup uses **double encryption**:

1. **Credo-Level Encryption**: Wallet export uses Credo's built-in encryption (ChaCha20Poly1305IETF with Argon2 key derivation)
2. **PIN-Level Encryption**: Additional AES-256-CBC encryption with key derived from user PIN using PBKDF2

**Encryption Parameters**:
- Algorithm: AES-256-CBC
- Key Derivation: PBKDF2 with SHA-256
- Iterations: 10,000
- Salt: 32 bytes (random)
- IV: 16 bytes (random)

### File System

Backups are stored in the app's document directory:

- **Backup Directory**: `{DocumentDirectory}/wallet-backups/`
- **Backup Files**: `{timestamp}-{walletId}.backup`
- **Metadata Files**: `{timestamp}-{walletId}.meta.json`

### Redux State Management

The backup state is managed in `src/store/slices/backupSlice.ts`:

```typescript
interface BackupState {
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
```

**Redux Actions**:
- `createBackup`: Create a new wallet backup
- `restoreWallet`: Restore wallet from backup
- `loadBackups`: Load list of available backups
- `deleteBackup`: Delete a backup file
- `validateBackup`: Validate backup file and PIN
- `loadBackupMetadata`: Load metadata for a backup

### Custom Hooks

The feature provides three custom hooks:

1. **useBackup**: Hook for backup operations
   - `isBackingUp`: Loading state
   - `backupError`: Error message
   - `lastBackup`: Last backup result
   - `createBackup(pin, exportKey)`: Create backup
   - `clearError()`: Clear error state

2. **useRestore**: Hook for restore operations
   - `isRestoring`: Loading state
   - `restoreError`: Error message
   - `selectedBackup`: Currently selected backup
   - `selectedBackupMetadata`: Metadata for selected backup
   - `restore(backupFilename, pin, exportKey, newWalletKey?)`: Restore wallet
   - `validate(backupFilename, pin)`: Validate backup
   - `selectBackup(backupFilename)`: Select backup

3. **useBackupManagement**: Hook for backup management
   - `backups`: List of backup filenames
   - `backupsLoading`: Loading state
   - `backupsError`: Error message
   - `backupMetadata`: Dictionary of metadata keyed by filename
   - `loadBackups()`: Load backup list
   - `deleteBackup(backupFilename)`: Delete backup
   - `loadMetadata(backupFilename)`: Load backup metadata
   - *Note: This hook handles automatic refreshing of the list and metadata when the screen comes into focus.*

## Integration Points

### Navigation

The backup screens are integrated into the app navigation:

- **AppNavigator.tsx**: Stack screens for backup/restore
- **CustomDrawerContent.tsx**: Menu item for "Backup & Restore"

### CredoAgentService

The `CredoAgentService` provides wrapper methods:

- `createWalletBackup(pin, exportKey)`: Create backup
- `restoreWalletFromBackup(backupFilename, pin, exportKey, newWalletKey?)`: Restore wallet

These methods use dynamic imports to load the backup services from the feature directory.

## Security Considerations

1. **Double Encryption**: Backup files are encrypted twice for additional security
2. **PIN Protection**: User PIN is required for both backup creation and restoration
3. **Export Key**: Separate export key provides additional layer of protection
4. **Secure Storage**: Backups are stored in app's document directory (not accessible by other apps on iOS)
5. **No Plaintext Storage**: All sensitive data is encrypted before storage

## Error Handling

- **Backup Creation Errors**: Displayed to user with clear error messages
- **Restore Errors**: Validated before restore attempt, errors shown to user
- **File System Errors**: Handled gracefully with user-friendly messages
- **Decryption Errors**: Invalid PIN or corrupted file errors are caught and displayed

## Future Enhancements

Potential improvements:

1. **Cloud Backup**: Option to backup to cloud storage (iCloud, Google Drive)
2. **Backup Scheduling**: Automatic periodic backups
3. **Backup Verification**: Automatic verification of backup integrity
4. **Multiple Backup Locations**: Support for user-selected backup locations
5. **Backup Encryption Options**: Allow users to choose encryption strength
6. **Backup Compression**: Compress backups to reduce storage size

## Unit Testing

The feature is covered by comprehensive unit tests using Jest. The tests cover utilities, services, and Redux state management.

### Test Structure

1. **Utility Tests**:
   - `backupEncryption.test.ts`: Tests encryption/decryption, key derivation, and file packaging logic.
   - `fileSystem.test.ts`: Tests path generation, directory management, and file filtering.

2. **Service Tests**:
   - `WalletBackupService.test.ts`: Tests end-to-end backup creation, agent interaction, and file storage.
   - `WalletRestoreService.test.ts`: Tests metadata loading, backup validation, and preparation for restore.

3. **Redux State Tests**:
   - `backupSlice.test.ts`: Tests all async thunks (`createBackup`, `loadBackups`, etc.) and state transitions.

### Running Tests

To run all tests related to the wallet backup feature:

```bash
yarn test src/features/wallet-backup src/store/slices/__tests__/backupSlice.test.ts
```

### Mocking Strategy

Native modules and external dependencies are mocked in `src/__tests__/setup.js`:
- `react-native-fs`: Mocked for file system operations.
- `react-native-aes-crypto`: Mocked for PBKDF2 and AES operations.
- `Credo Agent`: Mocked for wallet configuration and interaction.

## Related Files

- `src/features/wallet-backup/`: Feature implementation
- `src/store/slices/backupSlice.ts`: Redux state management
- `src/__tests__/setup.js`: Global test configuration and mocks
- `src/features/wallet-backup/**/__tests__/*.test.ts`: Unit tests
- `src/services/CredoAgentService.ts`: Agent service integration
- `src/navigation/AppNavigator.tsx`: Navigation integration
- `src/components/CustomDrawerContent.tsx`: Drawer menu integration
