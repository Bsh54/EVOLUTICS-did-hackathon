import { saveSecureItem, getSecureItem, removeSecureItem } from './secureStorage';

const TEMPLATE_DATA_KEY = 'polyid_template_data';

/**
 * Template data structure stored per credential
 * Maps credentialId -> { documentKey, attributes }
 */
export interface TemplateDataEntry {
    documentKey: string;
    attributes: Array<{ name: string; value: string }>;
}

export interface TemplateDataStore {
    [credentialId: string]: TemplateDataEntry;
}

/**
 * Save template data (documentKey + attributes) for a credential
 * @param credentialId Unique identifier for the credential
 * @param documentKey The document key from the QR URL
 * @param attributes The credential attributes from the offer
 */
export const saveTemplateData = async (
    credentialId: string,
    documentKey: string,
    attributes: Array<{ name: string; value: string }>
): Promise<void> => {
    try {
        // Load existing store
        const store = await loadTemplateDataStore();
        console.log('📄 [TEMPLATE STORAGE] Existing store before save:', JSON.stringify(store));

        // Add/update entry
        store[credentialId] = { documentKey, attributes };

        const jsonData = JSON.stringify(store);
        console.log('📄 [TEMPLATE STORAGE] Saving data:', jsonData);

        // Save back
        await saveSecureItem(TEMPLATE_DATA_KEY, jsonData);
        console.log('📄 [TEMPLATE STORAGE] Saved template data for credential:', credentialId);

        // ✅ Verification: Read back immediately to confirm save
        const verification = await getSecureItem(TEMPLATE_DATA_KEY);
        console.log('📄 [TEMPLATE STORAGE] ✅ Verification read-back:', verification);
    } catch (error) {
        console.error('❌ [TEMPLATE STORAGE] Error saving template data:', error);
        throw error;
    }
};

/**
 * Load the full template data store
 */
export const loadTemplateDataStore = async (): Promise<TemplateDataStore> => {
    try {
        const raw = await getSecureItem(TEMPLATE_DATA_KEY);
        if (raw) {
            return JSON.parse(raw) as TemplateDataStore;
        }
        return {};
    } catch (error) {
        console.error('❌ [TEMPLATE STORAGE] Error loading template data store:', error);
        return {};
    }
};

/**
 * Get template data for a specific credential
 * @param credentialId The credential ID to look up
 */
export const getTemplateData = async (credentialId: string): Promise<TemplateDataEntry | null> => {
    try {
        const store = await loadTemplateDataStore();
        return store[credentialId] || null;
    } catch (error) {
        console.error('❌ [TEMPLATE STORAGE] Error getting template data:', error);
        return null;
    }
};

/**
 * Check if template data exists for a credential
 * @param credentialId The credential ID to check
 */
export const hasTemplateData = async (credentialId: string): Promise<boolean> => {
    const data = await getTemplateData(credentialId);
    return data !== null;
};

/**
 * Remove template data for a specific credential
 * @param credentialId The credential ID to remove
 */
export const removeTemplateData = async (credentialId: string): Promise<void> => {
    try {
        const store = await loadTemplateDataStore();
        delete store[credentialId];
        await saveSecureItem(TEMPLATE_DATA_KEY, JSON.stringify(store));
        console.log('📄 [TEMPLATE STORAGE] Removed template data for credential:', credentialId);
    } catch (error) {
        console.error('❌ [TEMPLATE STORAGE] Error removing template data:', error);
        throw error;
    }
};

/**
 * Clear all template data
 */
export const clearAllTemplateData = async (): Promise<void> => {
    try {
        await removeSecureItem(TEMPLATE_DATA_KEY);
        console.log('📄 [TEMPLATE STORAGE] Cleared all template data');
    } catch (error) {
        console.error('❌ [TEMPLATE STORAGE] Error clearing template data:', error);
        throw error;
    }
};
