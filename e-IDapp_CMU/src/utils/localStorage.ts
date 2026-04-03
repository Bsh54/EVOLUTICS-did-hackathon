import { database } from '../db';
import { Q } from '@nozbe/watermelondb';
import UserModel from '../db/models/User';
import ConnectionModel from '../db/models/Connection';
import CredentialModel from '../db/models/Credential';
import {
  saveSecureItem,
  getSecureItem,
  clearSecureStorage,
  removeSecureItem,
  SECURE_KEYS as BASE_SECURE_KEYS
} from './secureStorage';

// Extended Storage keys including app flags
export const STORAGE_KEYS = {
  ...BASE_SECURE_KEYS,
  WALLET_INITIALIZED: 'polyid_wallet_initialized',
  FIRST_TIME_OPEN: 'polyid_first_time_open',
  // Legacy keys for reference
  USER_DATA: 'polyid_user_data',
  CONNECTIONS_DATA: 'polyid_connections_data',
  CREDENTIALS_DATA: 'polyid_credentials_data',
};

// User data interface
export interface StoredUserData {
  name: string;
  pin: string;
  id: string;
  email: string;
  polyIdUrl: string;
  isSetupComplete: boolean;
  profileImage?: string;
  qrCodeData?: string;
  passphrase?: string;
  language?: string;
}

// Save user data to storage (WatermelonDB + SecureStorage)
export const saveUserData = async (userData: StoredUserData): Promise<void> => {
  try {
    // Ensure required fields have at least default values (to satisfy DB constraints)
    const id = userData.id || `PID-${Date.now()}`;
    const name = userData.name || 'PolyID User';
    const email = userData.email || 'user@example.com';
    const polyIdUrl = userData.polyIdUrl || 'https://polyid.network/user';

    const safeUserData = {
      ...userData,
      id,
      name,
      email,
      polyIdUrl
    };

    // Save PIN to secure storage
    if (userData.pin) {
      await saveSecureItem(STORAGE_KEYS.PIN, userData.pin);
    }

    // Save user profile to WatermelonDB
    await database.write(async () => {
      const users = await database.get<UserModel>('users').query().fetch();
      const user = users.length > 0 ? users[0] : null;

      if (user) {
        await user.update(u => {
          u.userId = safeUserData.id;
          u.name = safeUserData.name;
          u.email = safeUserData.email;
          u.polyIdUrl = safeUserData.polyIdUrl;
          u.isSetupComplete = safeUserData.isSetupComplete;
          if (safeUserData.profileImage) u.profileImage = safeUserData.profileImage;
          if (safeUserData.qrCodeData) u.qrCodeData = safeUserData.qrCodeData;
          if (safeUserData.passphrase) u.passphrase = safeUserData.passphrase;
          if (safeUserData.language) u.language = safeUserData.language;
        });
      } else {
        await database.get<UserModel>('users').create(u => {
          u.userId = safeUserData.id;
          u.name = safeUserData.name;
          u.email = safeUserData.email;
          u.polyIdUrl = safeUserData.polyIdUrl;
          u.isSetupComplete = safeUserData.isSetupComplete;
          if (safeUserData.profileImage) u.profileImage = safeUserData.profileImage;
          if (safeUserData.qrCodeData) u.qrCodeData = safeUserData.qrCodeData;
          if (safeUserData.passphrase) u.passphrase = safeUserData.passphrase;
          if (safeUserData.language) u.language = safeUserData.language;
        });
      }
    });

    await saveSecureItem(STORAGE_KEYS.WALLET_INITIALIZED, 'true');
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
};

// Load user data from storage
export const loadUserData = async (): Promise<StoredUserData | null> => {
  try {
    // Get PIN from secure storage
    const pin = await getSecureItem(STORAGE_KEYS.PIN);

    // Get user from WatermelonDB
    const users = await database.get<UserModel>('users').query().fetch();
    const user = users.length > 0 ? users[0] : null;

    if (user) {
      return {
        name: user.name,
        pin: pin || '',
        id: user.userId,
        email: user.email,
        polyIdUrl: user.polyIdUrl,
        isSetupComplete: user.isSetupComplete,
        profileImage: user.profileImage,
        qrCodeData: user.qrCodeData,
        passphrase: user.passphrase,
        language: user.language,
      };
    }

    return null;
  } catch (error) {
    console.error('Error loading user data:', error);
    return null;
  }
};

// Save PIN separately for verification
export const savePin = async (pin: string): Promise<void> => {
  try {
    await saveSecureItem(STORAGE_KEYS.PIN, pin);
  } catch (error) {
    console.error('Error saving PIN:', error);
    throw error;
  }
};

// Verify PIN
export const verifyPin = async (enteredPin: string): Promise<boolean> => {
  try {
    const storedPin = await getSecureItem(STORAGE_KEYS.PIN);
    return storedPin === enteredPin;
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return false;
  }
};

// Check if wallet is initialized
export const isWalletInitialized = async (): Promise<boolean> => {
  try {
    const initialized = await getSecureItem(STORAGE_KEYS.WALLET_INITIALIZED);
    return initialized === 'true';
  } catch (error) {
    console.error('Error checking wallet initialization:', error);
    return false;
  }
};

// Clear all stored data (for logout or reset)
export const clearStoredData = async (): Promise<void> => {
  try {
    // Clear WatermelonDB
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });

    // Clear Secure Storage (This clears everything including keys and flags)
    await clearSecureStorage();
  } catch (error) {
    console.error('Error clearing stored data:', error);
    throw error;
  }
};

// Save wallet config (walletId and walletKey) to storage
export const saveWalletConfig = async (walletId: string, walletKey: string): Promise<void> => {
  try {
    await saveSecureItem(STORAGE_KEYS.WALLET_ID, walletId);
    await saveSecureItem(STORAGE_KEYS.WALLET_KEY, walletKey);
    // Mark wallet initialized as well
    await saveSecureItem(STORAGE_KEYS.WALLET_INITIALIZED, 'true');
  } catch (error) {
    console.error('Error saving wallet config:', error);
    throw error;
  }
};

// Load wallet config from storage
export const loadWalletConfig = async (): Promise<{ walletId: string; walletKey: string } | null> => {
  try {
    const id = await getSecureItem(STORAGE_KEYS.WALLET_ID);
    const key = await getSecureItem(STORAGE_KEYS.WALLET_KEY);
    if (id && key) {
      return { walletId: id, walletKey: key };
    }
    return null;
  } catch (error) {
    console.error('Error loading wallet config:', error);
    return null;
  }
};

// Check if it's the first time the app is opened
export const isFirstTimeOpen = async (): Promise<boolean> => {
  try {
    const firstTime = await getSecureItem(STORAGE_KEYS.FIRST_TIME_OPEN);
    // If key doesn't exist, it is first time
    return firstTime !== 'false';
  } catch (error) {
    console.error('Error checking first time open:', error);
    return true; // Default to true if error
  }
};

// Mark that the app has been opened (not first time anymore)
export const markAppOpened = async (): Promise<void> => {
  try {
    await saveSecureItem(STORAGE_KEYS.FIRST_TIME_OPEN, 'false');
  } catch (error) {
    console.error('Error marking app as opened:', error);
    throw error;
  }
};

// Save mediator connection ID to storage
export const saveMediatorConnectionId = async (connectionId: string): Promise<void> => {
  try {
    await saveSecureItem(STORAGE_KEYS.MEDIATOR_CONNECTION_ID, connectionId);
    console.log('Mediator connection ID saved:', connectionId);
  } catch (error) {
    console.error('Error saving mediator connection ID:', error);
    throw error;
  }
};

// Load mediator connection ID from storage
export const loadMediatorConnectionId = async (): Promise<string | null> => {
  try {
    const connectionId = await getSecureItem(STORAGE_KEYS.MEDIATOR_CONNECTION_ID);
    return connectionId;
  } catch (error) {
    console.error('Error loading mediator connection ID:', error);
    return null;
  }
};

// Save connections data to storage
export const saveConnectionsData = async (connections: any[]): Promise<void> => {
  try {
    await database.write(async () => {
      const connectionsCollection = database.get<ConnectionModel>('connections');
      const allExisting = await connectionsCollection.query().fetch();
      const existingMap = new Map(allExisting.map(c => [c.connectionId, c]));

      const operations = [];

      // Create or Update
      for (const conn of connections) {
        const existing = existingMap.get(conn.id);
        if (existing) {
          operations.push(
            existing.prepareUpdate(c => {
              c.state = conn.state;
              c.theirLabel = conn.theirLabel;
              c.theirDid = conn.theirDid;
              c.createdAt = conn.createdAt ? new Date(conn.createdAt).getTime() : Date.now();
              c.outOfBandId = conn.outOfBandId;
              c.outOfBandLabel = conn.outOfBandLabel;
              c.outOfBandInvitation = conn.outOfBandInvitation;
              c.handshakeProtocols = conn.handshakeProtocols;
              c.outOfBandMetadata = conn.outOfBandMetadata;
              c.credentialAttributesFromOOB = conn.credentialAttributesFromOOB;
            })
          );
          existingMap.delete(conn.id);
        } else {
          operations.push(
            connectionsCollection.prepareCreate(c => {
              c.connectionId = conn.id;
              c.state = conn.state;
              c.theirLabel = conn.theirLabel;
              c.theirDid = conn.theirDid;
              c.createdAt = conn.createdAt ? new Date(conn.createdAt).getTime() : Date.now();
              c.outOfBandId = conn.outOfBandId;
              c.outOfBandLabel = conn.outOfBandLabel;
              c.outOfBandInvitation = conn.outOfBandInvitation;
              c.handshakeProtocols = conn.handshakeProtocols;
              c.outOfBandMetadata = conn.outOfBandMetadata;
              c.credentialAttributesFromOOB = conn.credentialAttributesFromOOB;
            })
          );
        }
      }

      // Delete missing
      for (const remaining of existingMap.values()) {
        operations.push(remaining.prepareDestroyPermanently());
      }

      // Only batch if there are operations to perform
      if (operations.length > 0) {
        await database.batch(...operations);
      }
    });
  } catch (error) {
    console.error('Error saving connections data:', error);
    throw error;
  }
};

// Load connections data from storage
export const loadConnectionsData = async (): Promise<any[] | null> => {
  try {
    const connections = await database.get<ConnectionModel>('connections').query().fetch();
    return connections.map(c => ({
      id: c.connectionId,
      state: c.state,
      theirLabel: c.theirLabel,
      theirDid: c.theirDid,
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
      outOfBandId: c.outOfBandId,
      outOfBandLabel: c.outOfBandLabel,
      outOfBandInvitation: c.outOfBandInvitation,
      handshakeProtocols: c.handshakeProtocols,
      outOfBandMetadata: c.outOfBandMetadata,
      credentialAttributesFromOOB: c.credentialAttributesFromOOB,
    }));
  } catch (error) {
    console.error('Error loading connections data:', error);
    return null;
  }
};

// Save credentials data to storage (excluding response_attached field)
export const saveCredentialsData = async (credentials: any[]): Promise<void> => {
  try {
    await database.write(async () => {
      const credentialsCollection = database.get<CredentialModel>('credentials');
      const allExisting = await credentialsCollection.query().fetch();
      const existingMap = new Map(allExisting.map(c => [c.credentialId, c]));

      const operations = [];

      for (const cred of credentials) {
        // Remove response_attached field from each credential before saving
        const { response_attached, ...rest } = cred;

        const existing = existingMap.get(cred.id);
        if (existing) {
          operations.push(
            existing.prepareUpdate(c => {
              c.state = rest.state;
              c.role = rest.role;
              c.connectionId = rest.connectionId;
              c.threadId = rest.threadId;
              c.parentThreadId = rest.parentThreadId;
              c.credentialAttributes = rest.credentialAttributes;
              c.schemaId = rest.schemaId;
              c.credDefId = rest.credDefId;
              c.comment = rest.comment;
              c.createdAt = rest.createdAt ? new Date(rest.createdAt).getTime() : Date.now();
              c.updatedAt = rest.updatedAt ? new Date(rest.updatedAt).getTime() : 0;
              c.connectionLabel = rest.connectionLabel;
            })
          );
          existingMap.delete(cred.id);
        } else {
          operations.push(
            credentialsCollection.prepareCreate(c => {
              c.credentialId = rest.id;
              c.state = rest.state;
              c.role = rest.role;
              c.connectionId = rest.connectionId;
              c.threadId = rest.threadId;
              c.parentThreadId = rest.parentThreadId;
              c.credentialAttributes = rest.credentialAttributes;
              c.schemaId = rest.schemaId;
              c.credDefId = rest.credDefId;
              c.comment = rest.comment;
              c.createdAt = rest.createdAt ? new Date(rest.createdAt).getTime() : Date.now();
              c.updatedAt = rest.updatedAt ? new Date(rest.updatedAt).getTime() : 0;
              c.connectionLabel = rest.connectionLabel;
            })
          );
        }
      }

      for (const remaining of existingMap.values()) {
        operations.push(remaining.prepareDestroyPermanently());
      }

      // Only batch if there are operations to perform
      if (operations.length > 0) {
        await database.batch(...operations);
      }
    });
  } catch (error) {
    console.error('Error saving credentials data:', error);
    throw error;
  }
};

// Load credentials data from storage
export const loadCredentialsData = async (): Promise<any[] | null> => {
  try {
    const credentials = await database.get<CredentialModel>('credentials').query().fetch();
    return credentials.map(c => ({
      id: c.credentialId,
      state: c.state,
      role: c.role,
      connectionId: c.connectionId,
      threadId: c.threadId,
      parentThreadId: c.parentThreadId,
      credentialAttributes: c.credentialAttributes,
      schemaId: c.schemaId,
      credDefId: c.credDefId,
      comment: c.comment,
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: c.updatedAt && c.updatedAt > 0 ? new Date(c.updatedAt).toISOString() : undefined,
      connectionLabel: c.connectionLabel,
    }));
  } catch (error) {
    console.error('Error loading credentials data:', error);
    return null;
  }
};

/**
 * Clear connections data from local storage
 */
export const clearConnectionsData = async (): Promise<void> => {
  try {
    await database.write(async () => {
      const connections = await database.get<ConnectionModel>('connections').query().fetch();
      const operations = connections.map(c => c.prepareDestroyPermanently());
      if (operations.length > 0) {
        await database.batch(...operations);
      }
    });
    console.log('✅ Connections data cleared from storage');
  } catch (error) {
    console.error('❌ Error clearing connections data:', error);
    throw error;
  }
};

/**
 * Clear credentials data from local storage
 */
export const clearCredentialsData = async (): Promise<void> => {
  try {
    await database.write(async () => {
      const credentials = await database.get<CredentialModel>('credentials').query().fetch();
      const operations = credentials.map(c => c.prepareDestroyPermanently());
      if (operations.length > 0) {
        await database.batch(...operations);
      }
    });
    console.log('✅ Credentials data cleared from storage');
  } catch (error) {
    console.error('❌ Error clearing credentials data:', error);
    throw error;
  }
};