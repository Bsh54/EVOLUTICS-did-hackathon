import { Model } from '@nozbe/watermelondb'
import { field, json, text, date } from '@nozbe/watermelondb/decorators'

const sanitize = (raw: any) => raw

export default class Connection extends Model {
    static table = 'connections'

    @text('connection_id') connectionId: any
    @text('state') state: any
    @text('their_label') theirLabel: any
    @text('their_did') theirDid: any
    @date('created_at') createdAt: any
    @text('out_of_band_id') outOfBandId: any
    @text('out_of_band_label') outOfBandLabel: any
    @json('out_of_band_invitation', sanitize) outOfBandInvitation: any
    @json('handshake_protocols', sanitize) handshakeProtocols: any
    @json('out_of_band_metadata', sanitize) outOfBandMetadata: any
    @json('credential_attributes_from_oob', sanitize) credentialAttributesFromOOB: any
}
