import { Model } from '@nozbe/watermelondb'
import { field } from '@nozbe/watermelondb/decorators'

export default class User extends Model {
    static table = 'users'

    @field('user_id') userId: any
    @field('name') name: any
    @field('email') email: any
    @field('poly_id_url') polyIdUrl: any
    @field('is_setup_complete') isSetupComplete: any
    @field('profile_image') profileImage: any
    @field('qr_code_data') qrCodeData: any
    @field('passphrase') passphrase: any
    @field('language') language: any
    @field('first_name') firstName: any
    @field('last_name') lastName: any
    @field('photo') photo: any
    @field('unique_identifier') uniqueIdentifier: any
}
