import { getMediatorUrl } from '../../config/env';

/**
 * Fetches the OOB (Out-of-Band) invitation URL from the mediator
 * URL comes from the .env file: MEDIATOR_URL (via config/env.ts)
 * 
 * @param allowFailure - If true, returns null on failure instead of throwing. Default: false
 * @returns The OOB invitation URL, or null if allowFailure is true and request fails
 */
export const fetchMediatorInvitation = async (allowFailure: boolean = false): Promise<string | null> => {
  const MEDIATOR_URL = getMediatorUrl();

  // Check if MEDIATOR_URL is defined
  if (!MEDIATOR_URL || typeof MEDIATOR_URL !== 'string' || MEDIATOR_URL.trim() === '') {
    const errorMsg = 'MEDIATOR_URL is not defined or empty. Cannot fetch mediator invitation.';
    console.error(errorMsg);
    if (allowFailure) {
      return null;
    }
    throw new Error(errorMsg);
  }

  try {
    console.log('Fetching mediator invitation from:', MEDIATOR_URL);
    const response = await fetch(MEDIATOR_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorMsg = `Failed to fetch invitation: ${response.status} ${response.statusText}`;
      console.error(errorMsg, { status: response.status, statusText: response.statusText });
      if (allowFailure) {
        return null;
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();

    if (!data.url) {
      const errorMsg = 'No invitation URL in response';
      console.error(errorMsg, { responseData: data });
      if (allowFailure) {
        return null;
      }
      throw new Error(errorMsg);
    }

    console.log('Successfully fetched mediator invitation URL');
    return data.url; // Returns the OOB invitation URL
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    const errorDetails = {
      error: errorMessage,
      url: MEDIATOR_URL,
      errorType: error?.name || 'Unknown',
      networkError: errorMessage.includes('network') || errorMessage.includes('Network') || errorMessage.includes('fetch'),
    };
    console.error('Error fetching mediator invitation:', errorDetails);

    if (allowFailure) {
      console.warn('Mediator invitation fetch failed but allowFailure is true, returning null');
      return null;
    }
    throw error;
  }
};
