import { getInvitationDetails } from '../../utils/invitationDecoder';
import { DeepLinkPayload, DeepLinkType } from './types';

/**
 * Parses a deep link URL and extracts invitation details
 */
export const parseDeepLink = async (url: string): Promise<DeepLinkPayload | null> => {
  if (!url || !url.startsWith('polyid://')) return null;

  try {
    const details = await getInvitationDetails(url);
    
    let type: DeepLinkType = 'unknown';
    if (details.type) {
      const typeParam = details.type.toLowerCase();
      if (typeParam === 'offer') type = 'offer';
      else if (typeParam === 'proof') type = 'proof';
      else if (typeParam === 'connection') type = 'connection';
      else if (typeParam === 'zkp-proof') type = 'zkp-proof';
    } else {
      // Fallback to structure-based detection
      if (details.isCredentialOffer) type = 'offer';
      else if (details.isProofRequest) type = 'proof';
      else if (details.isZkpRequest) type = 'zkp-proof';
      else type = 'connection';
    }

    return {
      url,
      type,
      label: details.label,
      decodedInvitation: details.decodedInvitation,
    };
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return null;
  }
};
