import { Agent, CredentialExchangeRecord } from '@credo-ts/core';
import { CredentialOfferPreview } from './CredoAgentService';

/**
 * Retry helper with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param initialDelay - Initial delay in milliseconds (default: 100)
 * @returns Promise with result of fn
 */
const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 100
): Promise<T> => {
    let lastError: any;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            const errorMessage = error?.message || String(error);

            // Check if error is about wallet not being initialized
            if (errorMessage.includes('not been initialized') || errorMessage.includes('Wallet has not been initialized')) {
                // If this is not the last attempt, wait and retry
                if (attempt < maxRetries) {
                    const delay = initialDelay * Math.pow(2, attempt);
                    console.log(`Wallet not ready, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
            }
            // For other errors or last attempt, throw immediately
            throw error;
        }
    }
    throw lastError;
};

/**
 * Professional list of attribute names that may contain issuer information.
 * Ordered by priority: most specific/accurate first, then more generic fallbacks.
 * Used to identify issuer name from credential attributes when connection info is unavailable.
 * 
 * NOTE: This list is specifically for issuer identification, not for general title extraction.
 * For title extraction when issuer name is not present, use findMostImportantAttribute().
 * 
 * Exported for use across the application in credential listings and detail views.
 */
export const ISSUER_ATTRIBUTE_NAMES: readonly string[] = [
    // Primary issuer identifiers
    'issuer',
    'issuer_name',
    'issuerName',
    'issuing_authority',
    'licensing_authority',

    // Organizational identifiers
    'organization',
    'organization_name',
    'org_name',

    // Authority identifiers
    'authority',
    'authority_name',
    'certifying_authority',

    // Government/Institutional identifiers
    'government_authority',
    'institution',
    'institution_name',

    // Alternative naming conventions
    'issuer_organization',
    'certificate_issuer',
    'credential_issuer',

    // Student
    'course_name',
    'course_code',
    'course_description',
    'course_instructor',
    'course_instructor_name',
    'course_instructor_email',
    'course_instructor_phone',
    'course_instructor_address',
    'course_instructor_city',

    // User profile attributes
    'username',
    'profile_bio',
    'profile_image_hash',
    'age',
    'account_created_ymd',

] as const;

/**
 * Helper function to extract issuer from out-of-band record.
 * Searches OOB credential attributes for issuer-related information.
 */
const extractIssuerFromOOBRecord = (oobRecord: any): string | null => {
    if (!oobRecord?.requests) {
        return null;
    }

    try {
        for (const request of oobRecord.requests) {
            if (request && typeof request === 'object') {
                // Check for credential preview in the request
                if ('credential_preview' in request || 'credentialPreview' in request) {
                    const preview = (request as any).credential_preview || (request as any).credentialPreview;
                    if (preview?.attributes) {
                        // Look for issuer-related attributes using professional attribute list
                        const issuerAttr = preview.attributes.find((attr: any) =>
                            ISSUER_ATTRIBUTE_NAMES.includes(attr.name)
                        );
                        if (issuerAttr?.value) {
                            return issuerAttr.value;
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.warn('Error extracting issuer from OOB record:', error);
    }

    return null;
};

/**
 * Finds the most important attribute value from a list of attributes
 * for use in credential titles/preview cards.
 * Excludes numerical attributes and issuer-related attributes.
 * 
 * IMPORTANT: This function is only used when issuer name is NOT present.
 * It does NOT modify any values - only selects the best attribute for display.
 * 
 * @param attributes - Array of attribute objects with name and value
 * @returns The most important attribute value, or null if none found
 */
export const findMostImportantAttribute = (attributes: Array<{name: string, value: any}>): string | null => {
    if (!attributes || attributes.length === 0) {
        return null;
    }

    // Priority list of attribute names that are good for titles (in order of preference)
    const priorityAttributeNames = [
        'name',
        'title',
        'label',
        'description',
        'display_name',
        'full_name',
        'credential_name',
        'certificate_name',
        'credential_title',
        'certificate_title',
    ];

    // Attributes to exclude (numerical, dates, IDs, issuer-related)
    const excludedAttributeNames = [
        'age',
        'account_created_ymd',
        'id',
        'credential_id',
        'schema_id',
        'created_at',
        'updated_at',
        'date',
        'timestamp',
        'count',
        'number',
        'serial_number',
    ];

    // Helper to check if a value is purely numerical or looks like a number
    const isNumerical = (value: any): boolean => {
        // If it's already a number type, it's numerical
        if (typeof value === 'number') return true;
        
        // Convert to string for checking
        const valueStr = String(value).trim();
        
        // Empty strings are not numerical
        if (valueStr === '') return false;
        
        // Check if it's a pure number (digits only)
        if (/^\d+$/.test(valueStr)) return true;
        
        // Check if it's a decimal number
        if (/^\d+\.\d+$/.test(valueStr)) return true;
        
        // Check if it's a date format (YYYY-MM-DD, YYYY/MM/DD, etc.)
        if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(valueStr)) return true;
        
        // Check if it's a timestamp (10-13 digits)
        if (/^\d{10,13}$/.test(valueStr)) return true;
        
        // Check if it's a short number that looks like age, count, etc. (1-3 digits)
        // This catches values like "20" which are likely age or similar
        if (/^\d{1,3}$/.test(valueStr)) return true;
        
        return false;
    };

    // Helper to check if attribute name suggests numerical data
    const isNumericalAttribute = (name: string): boolean => {
        const lowerName = name.toLowerCase();
        return excludedAttributeNames.some(excluded => lowerName.includes(excluded)) ||
               lowerName.includes('_id') ||
               lowerName.includes('_count') ||
               lowerName.includes('_number') ||
               lowerName.includes('_date') ||
               lowerName.includes('_time') ||
               lowerName.includes('_age');
    };

    // Filter out invalid attributes
    const validAttributes = attributes.filter(attr => {
        // Must have a value
        if (attr.value === null || attr.value === undefined) return false;
        
        // Convert to string for checking
        const valueStr = String(attr.value).trim();
        if (valueStr === '' || valueStr === 'null' || valueStr === 'undefined') return false;
        
        // Exclude issuer-related attributes (already checked separately)
        if (ISSUER_ATTRIBUTE_NAMES.includes(attr.name)) return false;
        
        // Exclude numerical attributes - check this FIRST before other checks
        if (isNumerical(attr.value)) {
            return false;
        }
        if (isNumericalAttribute(attr.name)) {
            return false;
        }
        
        // Additional check: if the value looks like a number when converted, exclude it
        // This catches edge cases where the value might be stored differently
        const numValue = Number(valueStr);
        if (!isNaN(numValue) && valueStr.length <= 4 && /^\d+$/.test(valueStr)) {
            return false;
        }
        
        return true;
    });

    if (validAttributes.length === 0) {
        return null;
    }

    // First, try to find attributes from priority list
    for (const priorityName of priorityAttributeNames) {
        const attr = validAttributes.find(a => 
            a.name.toLowerCase() === priorityName.toLowerCase() ||
            a.name.toLowerCase().includes(priorityName.toLowerCase())
        );
        if (attr) {
            const value = String(attr.value).trim();
            // Double-check it's not numerical before returning
            if (!isNumerical(value)) {
                return value;
            }
        }
    }

    // If no priority attribute found, check remaining valid attributes
    // Only return if we have a non-numerical value
    for (const attr of validAttributes) {
        const value = String(attr.value).trim();
        // Double-check it's not numerical before returning
        if (!isNumerical(value) && value.length > 0) {
            return value;
        }
    }

    // If all attributes are numerical or invalid, return null
    return null;
};

export const getCredentials = async (
    agent: Agent
): Promise<{ record: CredentialExchangeRecord; connectionLabel?: string }[]> => {
    if (!agent) throw new Error('Agent not initialized');

    try {
        // Use retry logic to handle wallet initialization race conditions
        const [ credentialRecords, allConnections ] = await retryWithBackoff(async () => {
            return await Promise.all([
                agent.credentials.getAll(),
                agent.connections.getAll()
            ]);
        });

        // Filter out mediator connections and create thread ID map
        const validConnections = allConnections.filter(conn =>
            conn.theirLabel !== 'Mediator' &&
            !conn.theirLabel?.toLowerCase().includes('mediator')
        );

        const threadIdMap = new Map();
        validConnections.forEach(conn => {
            if (conn.threadId) {
                threadIdMap.set(conn.threadId, conn);
            }
        });

        // Process credentials with async OOB record fetching
        const enrichedCredentials = await Promise.all(
            credentialRecords.map(async (record) => {
                let connectionLabel: string = 'Unknown Issuer';

                // Try threadId first
                let connection = threadIdMap.get(record.threadId);

                // Try parentThreadId if threadId didn't work
                if (!connection && record.parentThreadId) {
                    connection = threadIdMap.get(record.parentThreadId);
                }

                // Method 3: Timestamp proximity matching (only with valid connections)
                if (!connection) {
                    const credentialTime = new Date(record.createdAt).getTime();

                    connection = validConnections
                        .filter(conn => conn.state === 'completed')
                        .sort((a, b) => {
                            const timeA = Math.abs(new Date(a.createdAt).getTime() - credentialTime);
                            const timeB = Math.abs(new Date(b.createdAt).getTime() - credentialTime);
                            return timeA - timeB;
                        })
                        .find(conn => {
                            const connTime = new Date(conn.createdAt).getTime();
                            // Check if connection was created within 60 minutes BEFORE OR AFTER credential
                            return Math.abs(credentialTime - connTime) < 60 * 60 * 1000;
                        });
                }

                // Method 4: Single connection fallback
                // If we still didn't find a connection, and there is exactly one valid connection, assume it's the one.
                if (!connection && validConnections.length === 1) {
                    connection = validConnections[ 0 ];
                    console.log(`Matched connection via single-connection fallback: ${connection.id} (${connection.theirLabel})`);
                }

                if (connection && connection.theirLabel) {
                    connectionLabel = connection.theirLabel;
                }

                // If still "Unknown Issuer" and credential has outOfBandId, fetch OOB record
                if (connectionLabel === 'Unknown Issuer') {
                    const outOfBandId = record.metadata?.get('outOfBandId');
                    if (outOfBandId && typeof outOfBandId === 'string') {
                        try {
                            const outOfBandRecord = await agent.oob.findById(outOfBandId);
                            if (outOfBandRecord) {
                                // First try: Extract from OOB invitation label
                                const oobLabel = outOfBandRecord.outOfBandInvitation?.label;
                                if (oobLabel) {
                                    connectionLabel = oobLabel;
                                } else {
                                    // Second try: Extract from OOB credential attributes
                                    const oobIssuer = extractIssuerFromOOBRecord(outOfBandRecord);
                                    if (oobIssuer) {
                                        connectionLabel = oobIssuer;
                                    }
                                }
                            }
                        } catch (error) {
                            // Silently fail - OOB record might not exist or be accessible
                            console.warn(`Could not fetch out-of-band record ${outOfBandId} for credential ${record.id}:`, error);
                        }
                    }
                }

                return { record, connectionLabel };
            })
        );

        return enrichedCredentials;
    } catch (error) {
        console.log('Error getting credentials:', error);
        return [];
    }
};

export const acceptCredentialOffer = async (
    agent: Agent,
    credentialRecordId: string,
    buildPreviewFn: (record: CredentialExchangeRecord) => Promise<CredentialOfferPreview>
): Promise<CredentialOfferPreview> => {
    if (!agent) throw new Error('Agent not initialized');
    try {
        console.log('Accepting credential offer:', credentialRecordId);
        const record = await agent.credentials.acceptOffer({
            credentialRecordId,
        });
        console.log('Credential offer accepted successfully');
        return await buildPreviewFn(record);
    } catch (error) {
        console.error('Error accepting credential offer:', error);
        throw error;
    }
};

