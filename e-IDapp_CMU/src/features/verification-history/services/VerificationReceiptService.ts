import { database } from '../../../db';
import Verification from '../../../db/models/Verification';

export interface VerificationReceiptData {
    verificationId: string;
    verifierName: string;
    credentialName: string;
    holderName: string;
    state: 'granted' | 'denied';
    sharedAttributes: any;
    referenceId?: string;
    location?: string;
}

export class VerificationReceiptService {
    static async saveVerificationReceipt(data: VerificationReceiptData): Promise<void> {
        try {
            await database.write(async () => {
                await database.get<Verification>('verifications').create((v) => {
                    v.verificationId = data.verificationId;
                    v.verifierName = data.verifierName;
                    v.credentialName = data.credentialName;
                    v.holderName = data.holderName;
                    v.state = data.state;
                    v.sharedAttributes = data.sharedAttributes;
                    v.referenceId = data.referenceId;
                    v.location = data.location;
                    // createdAt is handled by the model or automatically
                });
            });
            console.log('✅ Verification receipt saved to WatermelonDB');
        } catch (error) {
            console.error('❌ Error saving verification receipt:', error);
            throw error;
        }
    }

    static async getVerificationHistory(): Promise<Verification[]> {
        try {
            return await database.get<Verification>('verifications').query().fetch();
        } catch (error) {
            console.error('❌ Error fetching verification history:', error);
            return [];
        }
    }

    static async clearHistory(): Promise<void> {
        try {
            await database.write(async () => {
                const history = await database.get<Verification>('verifications').query().fetch();
                const operations = history.map(v => v.prepareDestroyPermanently());
                await database.batch(...operations);
            });
        } catch (error) {
            console.error('❌ Error clearing verification history:', error);
        }
    }
}

