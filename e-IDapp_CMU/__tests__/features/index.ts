/**
 * Features Test Suite Index
 * 
 * Entry point for running all feature tests.
 * This file helps organize and document available feature tests.
 */

/**
 * Test Coverage Summary:
 * 
 * 1. Agent Feature (__tests__/features/agent/)
 *    - AgentProvider.test.tsx
 *      - Rendering and initialization
 *      - Agent state management
 *      - useAgent hook
 *      - useAgentInstance hook (deprecated)
 *      - Error handling
 * 
 * 2. Wallet Backup Feature (__tests__/features/wallet-backup/)
 *    - hooks/useBackup.test.ts
 *      - Initial state
 *      - createBackup function
 *      - clearError function
 *      - State reactivity
 *    
 *    - services/WalletBackupService.test.ts
 *      - createBackup method
 *      - verifyBackup method
 *      - Error handling
 *      - File system operations
 *      - Encryption integration
 *    
 *    - utils/backupEncryption.test.ts
 *      - generateSalt function
 *      - encryptWithPin function
 *      - decryptWithPin function
 *      - encryptBackupFile function
 *      - decryptBackupFile function
 *      - Error handling
 * 
 * Future Test Coverage:
 * 
 * 3. Credential Connection Feature (TODO)
 *    - hooks/useCredentials.test.ts
 *    - hooks/useConnections.test.ts
 *    - hooks/useDataRefresh.test.ts
 *    - components/CredentialCard.test.tsx
 *    - components/ConnectionPreview.test.tsx
 * 
 * 4. ZKP Feature (TODO)
 *    - components/ZkpRequestModal.test.tsx
 */
