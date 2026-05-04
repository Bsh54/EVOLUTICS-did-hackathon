import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

import { schema } from './schema'
import { migrations } from './migrations'
import User from './models/User'
import Connection from './models/Connection'
import Credential from './models/Credential'
import Verification from './models/Verification'

// First, create the adapter to the underlying database:
const adapter = new SQLiteAdapter({
    schema,
    migrations,
    // dbName: 'myapp', // optional, defaults to 'watermelon'
    jsi: true, // set to true if you are using react-native-quick-sqlite for better performance

    onSetUpError: error => {
        // Database failed to load -- offer the user to reload the app or log out
        console.error('Database failed to load:', error)
    }
})

import { clearSecureStorage } from '../utils/secureStorage';

// ... (existing imports)

// Then, make a Watermelon database from it!
export const database = new Database({
    adapter,
    modelClasses: [
        User,
        Connection,
        Credential,
        Verification,
    ],
})

export const clearDatabase = async () => {
    try {
        console.log('⚠️ Starting full database and storage wipe...');

        // 1. Clear WatermelonDB (All tables including Users, Connections, Credentials)
        await database.write(async () => {
            await database.unsafeResetDatabase();
        });

        // 2. Clear Secure Storage (Wallet Keys, PIN, etc.) to force new wallet creation
        await clearSecureStorage();

        console.log('✅ Database and Secure Storage cleared successfully.');
    } catch (error) {
        console.error('❌ Error clearing database:', error);
        throw error;
    }
}
