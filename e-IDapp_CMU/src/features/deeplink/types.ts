import { DecodedInvitation } from '../../utils/coreInvitationDecoder';

export type DeepLinkType = 'connection' | 'offer' | 'proof' | 'zkp-proof' | 'unknown';

export interface DeepLinkPayload {
  url: string;
  type: DeepLinkType;
  label: string | null;
  decodedInvitation: DecodedInvitation | null;
  zkpProofRecordId?: string;
}
