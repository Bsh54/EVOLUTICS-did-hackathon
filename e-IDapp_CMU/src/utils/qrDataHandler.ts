/**
 * QR Code Data Handler
 * Manages QR code data encoding and decoding
 */

import { store } from '../store';
import { UserState } from '../store/slices/userSlice';

/**
 * Get complete QR data for a scanned lightweight QR code
 * When someone scans the QR code, they get only {name, id}
 * This function retrieves the complete data including faceImage
 */
export const getCompleteQRData = (scannedData: string): any => {
    try {
        // Parse the scanned lightweight data
        const lightweightData = JSON.parse(scannedData);

        // Get the complete data from Redux store
        const state = store.getState();
        const storedQRData = state.user.qrCodeData;

        if (storedQRData) {
            const completeData = JSON.parse(storedQRData);

            // Verify that the scanned ID matches the stored ID
            if (completeData.id === lightweightData.id) {
                console.log('✅ QR Code verified! Returning complete data with faceImage');
                return completeData; // Returns {name, id, faceImage}
            } else {
                console.warn('⚠️ Scanned ID does not match stored ID');
                return lightweightData; // Return only scanned data
            }
        }

        // If no stored data, return scanned data
        return lightweightData;
    } catch (error) {
        console.error('Error processing QR data:', error);
        return null;
    }
};

/**
 * Create lightweight QR data for display (without faceImage)
 */
export const createLightweightQRData = (completeData: any): string => {
    try {
        const parsed = typeof completeData === 'string'
            ? JSON.parse(completeData)
            : completeData;

        // Create lightweight version without faceImage
        const lightweight = {
            name: parsed.name,
            id: parsed.id,
        };

        return JSON.stringify(lightweight);
    } catch (error) {
        console.error('Error creating lightweight QR data:', error);
        return completeData;
    }
};

/**
 * Generate QR data from user state if Redux is empty
 * This provides fallback for edge cases where QR data might be missing
 */
export const generateQRDataFromUserState = (userState: UserState): string | null => {
  try {
    // Only generate if we have the minimum required data
    if (!userState.id || !userState.name) {
      console.warn('Cannot generate QR data: missing id or name');
      return null;
    }

    const qrContent = {
      name: userState.name,
      id: userState.id,
      faceImage: userState.profileImage || undefined, // Use profileImage if available
    };

    return JSON.stringify(qrContent);
  } catch (error) {
    console.error('Error generating QR data from user state:', error);
    return null;
  }
};

/**
 * Get QR data from Redux, or generate it from user state if missing
 */
export const getQRDataOrGenerate = (): string | null => {
  const state = store.getState();
  const storedQRData = state.user.qrCodeData;

  if (storedQRData) {
    return storedQRData;
  }

  // Fallback: generate from user state
  console.log('QR data not found in Redux, generating from user state...');
  return generateQRDataFromUserState(state.user);
};

/**
 * Example usage in ScanQRScreen:
 * 
 * const onCodeScanned = (codes) => {
 *     const scannedValue = codes[0].value;
 *     
 *     // Get complete data including faceImage
 *     const completeData = getCompleteQRData(scannedValue);
 *     
 *     console.log('Scanned QR Code:', completeData);
 *     // completeData will have: {name, id, faceImage}
 * };
 */
