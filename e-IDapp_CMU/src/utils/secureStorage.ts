import EncryptedStorage from 'react-native-encrypted-storage';

export const SECURE_KEYS = {
    PIN: 'polyid_pin',
    WALLET_ID: 'polyid_wallet_id',
    WALLET_KEY: 'polyid_wallet_key',
    MEDIATOR_CONNECTION_ID: 'polyid_mediator_connection_id',
};

export const saveSecureItem = async (key: string, value: string): Promise<void> => {
    try {
        await EncryptedStorage.setItem(key, value);
    } catch (error) {
        console.error(`Error saving secure item ${key}:`, error);
        throw error;
    }
};

export const getSecureItem = async (key: string): Promise<string | null> => {
    try {
        return await EncryptedStorage.getItem(key);
    } catch (error) {
        console.error(`Error getting secure item ${key}:`, error);
        return null;
    }
};

export const removeSecureItem = async (key: string): Promise<void> => {
    try {
        await EncryptedStorage.removeItem(key);
    } catch (error) {
        console.error(`Error removing secure item ${key}:`, error);
        throw error;
    }
};

export const clearSecureStorage = async (): Promise<void> => {
    try {
        await EncryptedStorage.clear();
    } catch (error) {
        console.error('Error clearing secure storage:', error);
        throw error;
    }
};
