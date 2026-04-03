import { Model } from '@nozbe/watermelondb'
import { field, json, text, date } from '@nozbe/watermelondb/decorators'

const sanitize = (raw: any) => raw

export default class Credential extends Model {
    static table = 'credentials'

    @text('credential_id') credentialId: any
    @text('state') state: any
    @text('role') role: any
    @text('connection_id') connectionId: any
    @text('thread_id') threadId: any
    @text('parent_thread_id') parentThreadId: any
    @json('credential_attributes', sanitize) credentialAttributes: any
    @text('schema_id') schemaId: any
    @text('cred_def_id') credDefId: any
    @text('comment') comment: any
    @date('created_at') createdAt: any
    @date('updated_at') updatedAt: any
    @text('connection_label') connectionLabel: any
}
