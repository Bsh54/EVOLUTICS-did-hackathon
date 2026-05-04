import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const schema = appSchema({
    version: 1,
    tables: [
        tableSchema({
            name: 'users',
            columns: [
                { name: 'user_id', type: 'string' },
                { name: 'name', type: 'string' },
                { name: 'email', type: 'string' },
                { name: 'poly_id_url', type: 'string' },
                { name: 'is_setup_complete', type: 'boolean' },
                { name: 'profile_image', type: 'string', isOptional: true },
                { name: 'qr_code_data', type: 'string', isOptional: true },
                { name: 'passphrase', type: 'string', isOptional: true },
                { name: 'language', type: 'string', isOptional: true },
                { name: 'first_name', type: 'string', isOptional: true },
                { name: 'last_name', type: 'string', isOptional: true },
                { name: 'photo', type: 'string', isOptional: true },
                { name: 'unique_identifier', type: 'string', isOptional: true },
            ]
        }),
        tableSchema({
            name: 'connections',
            columns: [
                { name: 'connection_id', type: 'string', isIndexed: true },
                { name: 'state', type: 'string' },
                { name: 'their_label', type: 'string', isOptional: true },
                { name: 'their_did', type: 'string', isOptional: true },
                { name: 'created_at', type: 'number' },
                { name: 'out_of_band_id', type: 'string', isOptional: true },
                { name: 'out_of_band_label', type: 'string', isOptional: true },
                { name: 'out_of_band_invitation', type: 'string', isOptional: true },
                { name: 'handshake_protocols', type: 'string', isOptional: true },
                { name: 'out_of_band_metadata', type: 'string', isOptional: true },
                { name: 'credential_attributes_from_oob', type: 'string', isOptional: true },
            ]
        }),
        tableSchema({
            name: 'credentials',
            columns: [
                { name: 'credential_id', type: 'string', isIndexed: true },
                { name: 'state', type: 'string' },
                { name: 'role', type: 'string' },
                { name: 'connection_id', type: 'string', isIndexed: true },
                { name: 'thread_id', type: 'string' },
                { name: 'parent_thread_id', type: 'string', isOptional: true },
                { name: 'credential_attributes', type: 'string', isOptional: true },
                { name: 'schema_id', type: 'string', isOptional: true },
                { name: 'cred_def_id', type: 'string', isOptional: true },
                { name: 'comment', type: 'string', isOptional: true },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
                { name: 'connection_label', type: 'string', isOptional: true },
            ]
        }),
        tableSchema({
            name: 'verifications',
            columns: [
                { name: 'verification_id', type: 'string', isIndexed: true },
                { name: 'verifier_name', type: 'string' },
                { name: 'credential_name', type: 'string' },
                { name: 'holder_name', type: 'string' },
                { name: 'state', type: 'string' },
                { name: 'shared_attributes', type: 'string' },
                { name: 'reference_id', type: 'string', isOptional: true },
                { name: 'location', type: 'string', isOptional: true },
                { name: 'created_at', type: 'number' },
            ]
        }),
    ]
})
