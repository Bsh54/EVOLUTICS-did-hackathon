/**
 * Shell module for invitation decoder
 * Re-exports all functions from coreInvitationDecoder to maintain backward compatibility
 */

// Re-export types and functions from core decoder
export type { DecodedInvitation } from './coreInvitationDecoder';
export {
    decodeBase64Invitation,
    extractOobParam,
    extractTypeParam,
    extractLabelParam,
    resolveShortUrl,
    parseInvitationUrl,
    extractLabelFromInvitation,
    isCredentialOffer,
    isProofRequest,
    getInvitationDetails,
} from './coreInvitationDecoder';
