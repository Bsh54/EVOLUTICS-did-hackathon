import { Model } from '@nozbe/watermelondb'
import { field, text, date, json, readonly } from '@nozbe/watermelondb/decorators'

const sanitize = (raw: any) => raw

export default class Verification extends Model {
    static table = 'verifications'

    @text('verification_id') verificationId!: string
    @text('verifier_name') verifierName!: string
    @text('credential_name') credentialName!: string
    @text('holder_name') holderName!: string
    @text('state') state!: string // 'granted' | 'denied'
    @json('shared_attributes', sanitize) sharedAttributes!: any
    @text('reference_id') referenceId?: string
    @text('location') location?: string
    @readonly @date('created_at') createdAt!: Date
}

