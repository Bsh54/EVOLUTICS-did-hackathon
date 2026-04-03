import { useState, useEffect } from 'react';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import Verification from '../../../db/models/Verification';
import { Q } from '@nozbe/watermelondb';

export const useVerificationHistory = () => {
    const database = useDatabase();
    const [verifications, setVerifications] = useState<Verification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Create a query that observes changes to the verifications table
        const query = database.get<Verification>('verifications').query(
            Q.sortBy('created_at', Q.desc)
        );

        const subscription = query.observe().subscribe((docs) => {
            setVerifications(docs);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [database]);

    return {
        verifications,
        loading,
        count: verifications.length,
        grantedCount: verifications.filter(v => v.state === 'granted').length,
        deniedCount: verifications.filter(v => v.state === 'denied').length,
    };
};

