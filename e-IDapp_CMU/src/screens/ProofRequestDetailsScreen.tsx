import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch } from 'react-redux';
import { acceptInvitation, declineProofRequest } from '../store/slices/credoSlice';
import { credoAgentService } from '../services/agent';
import { ProofExchangeRecord, ProofState } from '@credo-ts/core';
import SuccessProofModal from '../components/SuccessProofModal';
import { VerificationReceiptService } from '../features/verification-history';


type ProofRequestDetailsScreenRouteProp = RouteProp<RootStackParamList, 'ProofRequestDetails'>;

interface CredentialOption {
    credentialId: string;
    credentialDefinitionId?: string;
    schemaId?: string;
    attributes?: Record<string, any>;
    revocationRegistryId?: string | null;
}

// Helper function to extract readable credential name from attributes or schemaId
const getCredentialName = (credIndex: number, schemaId?: string, attributes?: Record<string, any>): string => {
    // Try to get a meaningful name from attributes first
    if (attributes) {
        // Priority list of attribute names that could be good credential names
        const nameAttributes = ['name', 'title', 'credential_name', 'certificate_name', 'credential_title', 'certificate_title', 'label', 'display_name'];
        
        for (const attrName of nameAttributes) {
            if (attributes[attrName]) {
                return String(attributes[attrName]);
            }
        }
    }

    // Fallback to generic name
    return `Credential ${credIndex + 1}`;
};

// Helper function to extract issuer name from credential attributes
const getIssuerFromAttributes = (attributes?: Record<string, any>): string | null => {
    if (!attributes) return null;

    // Import ISSUER_ATTRIBUTE_NAMES from CredentialService
    const ISSUER_ATTRIBUTE_NAMES = [
        'issuer', 'issuer_name', 'issuerName', 'issuing_authority', 'licensing_authority',
        'organization', 'organization_name', 'org_name',
        'authority', 'authority_name', 'certifying_authority',
        'government_authority', 'institution', 'institution_name',
        'issuer_organization', 'certificate_issuer', 'credential_issuer'
    ];

    for (const attrName of ISSUER_ATTRIBUTE_NAMES) {
        if (attributes[attrName] && typeof attributes[attrName] === 'string') {
            const value = attributes[attrName].trim();
            if (value && value !== 'Unknown Issuer' && value.toLowerCase() !== 'unknown') {
                return value;
            }
        }
    }

    return null;
};

// Helper function to recursively search for cred_def_id in any object
const findCredDefIdsInObject = (obj: any, found: Set<string>): void => {
    if (!obj || typeof obj !== 'object') {
        return;
    }

    // Check if this object has cred_def_id
    if (obj.cred_def_id && typeof obj.cred_def_id === 'string') {
        found.add(obj.cred_def_id);
    }
    if (obj.credentialDefinitionId && typeof obj.credentialDefinitionId === 'string') {
        found.add(obj.credentialDefinitionId);
    }
    if (obj.credDefId && typeof obj.credDefId === 'string') {
        found.add(obj.credDefId);
    }

    // Recursively search nested objects and arrays
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[ key ];
            if (Array.isArray(value)) {
                value.forEach(item => findCredDefIdsInObject(item, found));
            } else if (value && typeof value === 'object') {
                findCredDefIdsInObject(value, found);
            }
        }
    }
};

// Helper function to extract requested credential definition IDs from proof request
const extractRequestedCredDefIds = (
    requestedAttributes: Record<string, any>,
    requestedPredicates: Record<string, any>,
    formatData?: any
): Set<string> => {
    const credDefIds = new Set<string>();

    // Extract from attributes
    Object.values(requestedAttributes).forEach((attrDef: any) => {
        if (attrDef?.restrictions && Array.isArray(attrDef.restrictions)) {
            attrDef.restrictions.forEach((restriction: any) => {
                if (restriction.cred_def_id) {
                    credDefIds.add(restriction.cred_def_id);
                }
            });
        }
    });

    // Extract from predicates
    Object.values(requestedPredicates).forEach((predDef: any) => {
        if (predDef?.restrictions && Array.isArray(predDef.restrictions)) {
            predDef.restrictions.forEach((restriction: any) => {
                if (restriction.cred_def_id) {
                    credDefIds.add(restriction.cred_def_id);
                }
            });
        }
    });

    // If no restrictions found in attributes/predicates, search the entire formatData
    if (credDefIds.size === 0 && formatData) {
        console.log('🔍 No restrictions found in attributes/predicates, searching full formatData...');
        findCredDefIdsInObject(formatData, credDefIds);
    }

    return credDefIds;
};

// Helper function to extract schema name from credential definition ID or schema ID
const extractSchemaName = (credentialDefinitionId?: string, schemaId?: string): string | null => {
    // Try credential definition ID first (format: .../CLAIM_DEF/.../SchemaName)
    if (credentialDefinitionId) {
        const parts = credentialDefinitionId.split('/');
        if (parts.length > 0) {
            const lastPart = parts[ parts.length - 1 ];
            if (lastPart && lastPart !== 'anoncreds' && lastPart !== 'v0') {
                return lastPart;
            }
        }
    }

    // Try schema ID (format: .../SCHEMA/SchemaName/version)
    if (schemaId) {
        const parts = schemaId.split('/');
        const schemaIndex = parts.findIndex(part => part === 'SCHEMA');
        if (schemaIndex >= 0 && schemaIndex < parts.length - 1) {
            return parts[ schemaIndex + 1 ];
        }
    }

    return null;
};

// Helper function to filter credentials by restrictions or requested credential definition IDs
const filterCredentialsByRestrictions = (
    creds: any[],
    restrictions?: Array<{ cred_def_id?: string; schema_id?: string;[ key: string ]: any }>,
    requestedCredDefIds?: Set<string>
): any[] => {
    // First, filter by restrictions if they exist
    if (restrictions && restrictions.length > 0) {
        return creds.filter((cred: any) => {
            const credential = {
                credentialDefinitionId: cred.credentialInfo?.credentialDefinitionId,
                schemaId: cred.credentialInfo?.schemaId,
            };
            return matchesRestriction(credential, restrictions);
        });
    }

    // If no restrictions but we have requested cred_def_ids, filter by those
    if (requestedCredDefIds && requestedCredDefIds.size > 0) {
        console.log(`🔍 Filtering by requested cred_def_ids:`, Array.from(requestedCredDefIds));
        const filtered = creds.filter((cred: any) => {
            const credDefId = cred.credentialInfo?.credentialDefinitionId;
            const matches = credDefId && requestedCredDefIds.has(credDefId);
            console.log(`  ${matches ? '✅' : '❌'} Credential ${cred.credentialId?.substring(0, 20)}...: credDefId=${credDefId}, matches=${matches}`);
            return matches;
        });
        console.log(`✅ Filtered to ${filtered.length} credentials (from ${creds.length})`);
        return filtered;
    }

    // If no restrictions at all, group by schema and show only the most recent credential per schema
    // This prevents showing duplicate credentials from the same schema
    if (creds.length > 1) {
        console.log(`⚠️ No restrictions found - grouping by schema and showing most recent credential per schema`);
        const schemaGroups = new Map<string, any>();

        // Sort credentials by creation date (most recent first)
        const sortedCreds = [ ...creds ].sort((a, b) => {
            const dateA = new Date(a.credentialInfo?.createdAt || 0).getTime();
            const dateB = new Date(b.credentialInfo?.createdAt || 0).getTime();
            return dateB - dateA; // Most recent first
        });

        sortedCreds.forEach((cred: any) => {
            const schemaName = extractSchemaName(
                cred.credentialInfo?.credentialDefinitionId,
                cred.credentialInfo?.schemaId
            );
            if (schemaName) {
                // Keep only the first (most recent) credential for each schema
                if (!schemaGroups.has(schemaName)) {
                    schemaGroups.set(schemaName, cred);
                    console.log(`  ✅ Added most recent credential for schema: ${schemaName} (created: ${cred.credentialInfo?.createdAt})`);
                } else {
                    console.log(`  ⏭️ Skipped older credential for schema: ${schemaName} (created: ${cred.credentialInfo?.createdAt})`);
                }
            } else {
                // If we can't extract schema name, keep it (fallback)
                schemaGroups.set(`unknown_${cred.credentialId}`, cred);
            }
        });

        const filtered = Array.from(schemaGroups.values());
        console.log(`✅ Grouped to ${filtered.length} credentials (one per schema, most recent) from ${creds.length} total`);
        return filtered;
    }

    // If only one credential, return it as-is
    return creds;
};

// Helper function to check if a credential matches the restrictions
// Returns true if credential matches any restriction, or if no restrictions are specified
const matchesRestriction = (
    credential: { credentialDefinitionId?: string; schemaId?: string },
    restrictions?: Array<{ cred_def_id?: string; schema_id?: string;[ key: string ]: any }>
): boolean => {
    // If no restrictions specified, allow all credentials (backward compatibility)
    if (!restrictions || restrictions.length === 0) {
        console.log(`  ⚠️ No restrictions found - allowing all credentials`);
        return true;
    }

    console.log(`  🔍 Checking restrictions:`, JSON.stringify(restrictions, null, 2));
    console.log(`  🔍 Credential: credDefId=${credential.credentialDefinitionId}, schemaId=${credential.schemaId}`);

    // Check if credential matches any restriction
    const matches = restrictions.some((restriction) => {
        // Match by credential definition ID (check multiple possible field names)
        const credDefId = restriction.cred_def_id || restriction.credentialDefinitionId || restriction.credDefId;
        if (credDefId && credential.credentialDefinitionId) {
            const match = credDefId === credential.credentialDefinitionId;
            console.log(`    → Checking cred_def_id: "${credDefId}" === "${credential.credentialDefinitionId}" = ${match}`);
            if (match) {
                return true;
            }
        }

        // Match by schema ID (check multiple possible field names)
        const schemaId = restriction.schema_id || restriction.schemaId;
        if (schemaId && credential.schemaId) {
            const match = schemaId === credential.schemaId;
            console.log(`    → Checking schema_id: "${schemaId}" === "${credential.schemaId}" = ${match}`);
            if (match) {
                return true;
            }
        }

        console.log(`    → No match found for restriction:`, JSON.stringify(restriction, null, 2));
        return false;
    });

    console.log(`  ✅ Final match result: ${matches}`);
    return matches;
};

// Helper function to check if a credential's attribute value satisfies a predicate condition
// Only applies numeric comparison for comparison operators (>=, <=, >, <)
// Returns true for non-comparison predicates (e.g., ID matching) to skip numeric filtering
const matchesPredicateCondition = (
    cred: any,
    predDef?: { p_type?: string; p_value?: string | number; name?: string; [key: string]: any }
): boolean => {
    // If no predicate definition, skip filtering
    if (!predDef) {
        return true;
    }

    const pType = predDef.p_type;
    const pValue = predDef.p_value;
    const attrName = predDef.name;

    // Only apply numeric comparison for comparison operators
    const comparisonOperators = ['>=', '<=', '>', '<'];
    
    // If p_type is not a comparison operator or is missing, skip numeric filtering
    if (!pType || !comparisonOperators.includes(pType)) {
        console.log(`  ⏭️ Skipping numeric filtering for predicate (p_type: ${pType || 'missing'})`);
        return true;
    }

    // If p_value is missing, we can't perform comparison
    if (pValue === undefined || pValue === null || pValue === '') {
        console.warn(`  ⚠️ Predicate p_value is missing for comparison operator ${pType}`);
        return false;
    }

    // If attribute name is missing, we can't find the value
    if (!attrName) {
        console.warn(`  ⚠️ Predicate attribute name is missing`);
        return false;
    }

    // Extract attribute value from credential
    const credAttributes = cred.credentialInfo?.attributes || {};
    const attrValue = credAttributes[attrName];

    // If attribute value is missing, exclude credential
    if (attrValue === undefined || attrValue === null || attrValue === '') {
        console.warn(`  ⚠️ Attribute "${attrName}" not found in credential or has no value`);
        return false;
    }

    // Convert both values to numbers for comparison
    const numAttrValue = Number(attrValue);
    const numPValue = Number(pValue);

    // Check if conversion was successful
    if (isNaN(numAttrValue)) {
        console.warn(`  ⚠️ Attribute value "${attrValue}" for "${attrName}" is not numeric (required for ${pType} comparison)`);
        return false;
    }

    if (isNaN(numPValue)) {
        console.warn(`  ⚠️ Predicate value "${pValue}" is not numeric (required for ${pType} comparison)`);
        return false;
    }

    // Evaluate the condition based on p_type
    let matches = false;
    switch (pType) {
        case '>=':
            matches = numAttrValue >= numPValue;
            break;
        case '<=':
            matches = numAttrValue <= numPValue;
            break;
        case '>':
            matches = numAttrValue > numPValue;
            break;
        case '<':
            matches = numAttrValue < numPValue;
            break;
        default:
            console.warn(`  ⚠️ Unknown comparison operator: ${pType}`);
            return false;
    }

    console.log(`  🔍 Predicate condition check: ${attrName} ${pType} ${pValue} → ${attrValue} ${matches ? '✅' : '❌'}`);
    return matches;
};

// Helper function to get unique selected credentials across all attributes
const getUniqueSelectedCredentials = (
    selectedCredentials: Record<string, string>,
    credentials: Record<string, CredentialOption[]>
): CredentialOption[] => {
    const uniqueCredentialIds = new Set<string>();
    Object.values(selectedCredentials).forEach(credId => {
        if (credId) uniqueCredentialIds.add(credId);
    });

    const uniqueCreds: CredentialOption[] = [];
    uniqueCredentialIds.forEach(credId => {
        // Find the credential in any of the credential arrays
        for (const credArray of Object.values(credentials)) {
            const cred = credArray.find(c => c.credentialId === credId);
            if (cred && !uniqueCreds.find(c => c.credentialId === credId)) {
                uniqueCreds.push(cred);
                break;
            }
        }
    });

    return uniqueCreds;
};

// Helper function to check if all attributes use the same credential
const isSingleCredentialUsed = (selectedCredentials: Record<string, string>): boolean => {
    const credentialIds = Object.values(selectedCredentials).filter(id => id);
    if (credentialIds.length === 0) return false;
    
    const firstId = credentialIds[0];
    return credentialIds.every(id => id === firstId);
};

// Helper function to get attributes that use a specific credential
const getAttributesForCredential = (
    credentialId: string,
    selectedCredentials: Record<string, string>,
    attributes: any[]
): any[] => {
    return attributes.filter(attr => {
        const attrKey = attr.attrKey || attr.name.toLowerCase().replace(/\s+/g, '_');
        return selectedCredentials[attrKey] === credentialId;
    });
};

const ProofRequestDetailsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<ProofRequestDetailsScreenRouteProp>();
    const dispatch = useDispatch<any>();

    const { verifierName = 'Verifier', invitationUrl, proofRecordId: routeProofRecordId } = route.params || {};

    const [ isLoading, setIsLoading ] = useState(true);
    const [ proofRecord, setProofRecord ] = useState<ProofExchangeRecord | null>(null);
    const [ attributes, setAttributes ] = useState<any[]>([]);
    const [ showSuccessModal, setShowSuccessModal ] = useState(false);
    const [ credentials, setCredentials ] = useState<Record<string, CredentialOption[]>>({});
    const [ selectedCredentials, setSelectedCredentials ] = useState<Record<string, string>>({});
    const [ loadingCredentials, setLoadingCredentials ] = useState(false);
    const [ requestedAttributes, setRequestedAttributes ] = useState<Record<string, any>>({});
    const [ expandedCredentialId, setExpandedCredentialId ] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        let pollInterval: NodeJS.Timeout;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const loadMatchingCredentials = async (recordId: string) => {
            const agent = credoAgentService.getAgent();
            if (!agent) return;

            try {
                setLoadingCredentials(true);

                // Fetch format data to get predicate conditions
                const formatData = await agent.proofs.getFormatData(recordId);
                let fetchedRequestedAttributes = (formatData.request as any).anoncreds?.requested_attributes || {};
                let requestedPredicates = (formatData.request as any).anoncreds?.requested_predicates || {};

                // Try to get proof record to extract restrictions from attachments
                try {
                    const record = await agent.proofs.getById(recordId);
                    if (record && (record as any).requestAttachments) {
                        const attachments = (record as any).requestAttachments;
                        for (const attachment of attachments) {
                            if (attachment.data?.json) {
                                const proofRequest = attachment.data.json;
                                if (proofRequest.requested_attributes) {
                                    fetchedRequestedAttributes = proofRequest.requested_attributes;
                                }
                                if (proofRequest.requested_predicates) {
                                    requestedPredicates = proofRequest.requested_predicates;
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.warn('Could not fetch proof record for restrictions:', err);
                }

                console.log('📊 Format Data - Requested Attributes:', JSON.stringify(fetchedRequestedAttributes, null, 2));
                console.log('📊 Format Data - Requested Predicates:', JSON.stringify(requestedPredicates, null, 2));

                // Extract requested credential definition IDs from the proof request
                const formatDataForExtraction = await agent.proofs.getFormatData(recordId);
                const requestedCredDefIds = extractRequestedCredDefIds(fetchedRequestedAttributes, requestedPredicates, formatDataForExtraction);
                console.log('🎯 Requested Credential Definition IDs:', Array.from(requestedCredDefIds));

                const allCredentialsData = await agent.proofs.getCredentialsForRequest({
                    proofRecordId: recordId,
                });

                console.log('🔎 ALL matching credentials:', JSON.stringify(allCredentialsData, null, 2));

                // Parse credentials from the response
                const parsedCredentials: Record<string, CredentialOption[]> = {};
                const attrsList: any[] = [];
                const seenAttributes = new Set<string>();

                if (allCredentialsData && (allCredentialsData.proofFormats as any)?.anoncreds) {
                    const anonCreds = (allCredentialsData.proofFormats as any).anoncreds;

                    // Process attributes
                    if (anonCreds.attributes) {
                        Object.entries(anonCreds.attributes).forEach(([ attrName, creds ]: [ string, any ]) => {
                            if (Array.isArray(creds) && creds.length > 0) {
                                // Get restrictions for this attribute
                                const attrDef = fetchedRequestedAttributes[ attrName ];
                                const restrictions = attrDef?.restrictions;

                                console.log(`🔍 Attribute: ${attrName}`);
                                console.log(`📋 Attribute Definition:`, JSON.stringify(attrDef, null, 2));
                                console.log(`🔒 Restrictions:`, JSON.stringify(restrictions, null, 2));
                                console.log(`📦 Total credentials before filtering: ${creds.length}`);

                                // Extract requested credential definition IDs (if not already extracted)
                                const localRequestedCredDefIds = extractRequestedCredDefIds(fetchedRequestedAttributes, requestedPredicates);

                                // Filter credentials by restrictions or requested cred_def_ids
                                const filteredCreds = filterCredentialsByRestrictions(creds, restrictions, localRequestedCredDefIds);
                                console.log(`✅ Filtered credentials count: ${filteredCreds.length} (from ${creds.length})`);

                                if (filteredCreds.length === 0) {
                                    console.warn(`⚠️ No credentials match restrictions for attribute: ${attrName}`);
                                    return;
                                }

                                parsedCredentials[ attrName ] = filteredCreds.map((cred: any) => ({
                                    credentialId: cred.credentialId,
                                    credentialDefinitionId: cred.credentialInfo?.credentialDefinitionId,
                                    schemaId: cred.credentialInfo?.schemaId,
                                    attributes: cred.credentialInfo?.attributes || {},
                                    isPredicate: false,
                                    credentialInfo: cred.credentialInfo,
                                }));

                                // Extract attribute values for display (use first credential)
                                const firstCred = filteredCreds[ 0 ];
                                const attrDisplayName = attrDef?.name || attrName;

                                if (firstCred.credentialInfo?.attributes) {
                                    Object.entries(firstCred.credentialInfo.attributes).forEach(([ key, value ]) => {
                                        // Match the attribute name from the request
                                        if (key === attrDisplayName && !seenAttributes.has(attrName)) {
                                            const formattedName = key
                                                .split('_')
                                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                                .join(' ');

                                            attrsList.push({
                                                name: formattedName,
                                                value: String(value),
                                                attrKey: attrName,
                                                isPredicate: false,
                                            });
                                            seenAttributes.add(attrName);
                                        }
                                    });
                                }
                            }
                        });
                    }

                    // Process predicates
                    if (anonCreds.predicates) {
                        Object.entries(anonCreds.predicates).forEach(([ predName, creds ]: [ string, any ]) => {
                            if (Array.isArray(creds) && creds.length > 0) {
                                // Get restrictions for this predicate
                                const predDef = requestedPredicates[ predName ];
                                const restrictions = predDef?.restrictions;

                                // Filter credentials by restrictions
                                let filteredCreds = creds.filter((cred: any) => {
                                    const credential = {
                                        credentialDefinitionId: cred.credentialInfo?.credentialDefinitionId,
                                        schemaId: cred.credentialInfo?.schemaId,
                                    };
                                    return matchesRestriction(credential, restrictions);
                                });

                                // Filter by predicate condition (e.g., age >= 21)
                                filteredCreds = filteredCreds.filter((cred: any) => {
                                    return matchesPredicateCondition(cred, predDef);
                                });

                                if (filteredCreds.length === 0) {
                                    console.warn(`⚠️ No credentials match restrictions and predicate condition for predicate: ${predName}`);
                                    return;
                                }

                                parsedCredentials[ predName ] = filteredCreds.map((cred: any) => ({
                                    credentialId: cred.credentialId,
                                    credentialDefinitionId: cred.credentialInfo?.credentialDefinitionId,
                                    schemaId: cred.credentialInfo?.schemaId,
                                    attributes: cred.credentialInfo?.attributes || {},
                                    isPredicate: true,
                                    credentialInfo: cred.credentialInfo,
                                }));

                                // Get predicate definition from format data
                                if (predDef && !seenAttributes.has(predName)) {
                                    const predDisplayName = predDef.name || predName;
                                    const formattedName = predDisplayName
                                        .split('_')
                                        .map((word: any) => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(' ');

                                    // Get the actual value from the first matching credential
                                    const firstCred = filteredCreds[ 0 ];
                                    let predValue = '';
                                    if (firstCred.credentialInfo?.attributes && firstCred.credentialInfo.attributes[ predDisplayName ]) {
                                        predValue = String(firstCred.credentialInfo.attributes[ predDisplayName ]);
                                    }

                                    // Format condition: e.g., "Area Sqft (>= 1000)"
                                    const condition = `${predDef.p_type || '>='} ${predDef.p_value || ''}`;
                                    const displayValue = predValue ? `${predValue} (${condition})` : condition;

                                    attrsList.push({
                                        name: formattedName,
                                        value: displayValue,
                                        attrKey: predName,
                                        isPredicate: true,
                                        predicateCondition: condition,
                                        predicateValue: predValue,
                                    });
                                    seenAttributes.add(predName);
                                }
                            }
                        });
                    }
                }

                setCredentials(parsedCredentials);

                // Auto-select the oldest credential for each attribute/predicate
                const autoSelected: Record<string, string> = {};
                Object.entries(parsedCredentials).forEach(([ key, creds ]) => {
                    if (creds.length > 0) {
                        // Select the last one (oldest) as per mediator team's example
                        autoSelected[ key ] = creds[ creds.length - 1 ].credentialId;
                    }
                });
                setSelectedCredentials(autoSelected);

                if (attrsList.length > 0) {
                    setAttributes(attrsList);
                }
            } catch (error) {
                console.error('Error loading credentials:', error);
            } finally {
                setLoadingCredentials(false);
            }
        };

        const init = async () => {
            try {
                // If proofRecordId is provided directly, fetch that specific record
                if (routeProofRecordId) {
                    const agent = credoAgentService.getAgent();
                    if (agent) {
                        const record = await agent.proofs.getById(routeProofRecordId);
                        if (isMounted) {
                            setProofRecord(record);

                            // Load all matching credentials for selection
                            try {
                                setLoadingCredentials(true);

                                // Fetch format data to get predicate conditions
                                const formatData = await agent.proofs.getFormatData(routeProofRecordId);

                                // Log the FULL format data structure to find where restrictions might be
                                console.log('📦 FULL Format Data:', JSON.stringify(formatData, null, 2));

                                let fetchedRequestedAttributes = (formatData.request as any).anoncreds?.requested_attributes || {};
                                let fetchedRequestedPredicates = (formatData.request as any).anoncreds?.requested_predicates || {};

                                // Log ALL properties of the proof record to find where restrictions might be stored
                                console.log('🔍 Proof Record Keys:', Object.keys(record));
                                console.log('🔍 Proof Record Full:', JSON.stringify(record, null, 2));

                                // Try multiple ways to access the proof request
                                if (record) {
                                    // Method 1: requestAttachments
                                    if ((record as any).requestAttachments) {
                                        const attachments = (record as any).requestAttachments;
                                        console.log('📎 Method 1 - Request Attachments:', JSON.stringify(attachments, null, 2));
                                        for (const attachment of attachments) {
                                            if (attachment.data?.json) {
                                                const proofRequest = attachment.data.json;
                                                console.log('📋 Original Proof Request from attachments:', JSON.stringify(proofRequest, null, 2));
                                                if (proofRequest.requested_attributes) {
                                                    fetchedRequestedAttributes = proofRequest.requested_attributes;
                                                }
                                                if (proofRequest.requested_predicates) {
                                                    fetchedRequestedPredicates = proofRequest.requested_predicates;
                                                }
                                            }
                                        }
                                    }

                                    // Method 2: requestMessage
                                    if ((record as any).requestMessage) {
                                        const requestMsg = (record as any).requestMessage;
                                        console.log('📎 Method 2 - Request Message:', JSON.stringify(requestMsg, null, 2));
                                        if (requestMsg.content) {
                                            const content = requestMsg.content;
                                            if (content.requested_attributes) {
                                                fetchedRequestedAttributes = content.requested_attributes;
                                            }
                                            if (content.requested_predicates) {
                                                fetchedRequestedPredicates = content.requested_predicates;
                                            }
                                        }
                                    }

                                    // Method 3: Check all properties for any nested proof request
                                    for (const key in record) {
                                        const value = (record as any)[ key ];
                                        if (value && typeof value === 'object' && !Array.isArray(value)) {
                                            if (value.requested_attributes || value.requested_predicates) {
                                                console.log(`📎 Method 3 - Found in property "${key}":`, JSON.stringify(value, null, 2));
                                                if (value.requested_attributes) {
                                                    fetchedRequestedAttributes = value.requested_attributes;
                                                }
                                                if (value.requested_predicates) {
                                                    fetchedRequestedPredicates = value.requested_predicates;
                                                }
                                            }
                                        }
                                    }
                                }

                                console.log('📊 Format Data - Requested Attributes:', JSON.stringify(fetchedRequestedAttributes, null, 2));
                                console.log('📊 Format Data - Requested Predicates:', JSON.stringify(fetchedRequestedPredicates, null, 2));

                                // Extract requested credential definition IDs from the proof request
                                const requestedCredDefIds = extractRequestedCredDefIds(fetchedRequestedAttributes, fetchedRequestedPredicates, formatData);
                                console.log('🎯 Requested Credential Definition IDs:', Array.from(requestedCredDefIds));

                                // Store in state for use in render
                                setRequestedAttributes(fetchedRequestedAttributes);

                                const allCredentialsData = await agent.proofs.getCredentialsForRequest({
                                    proofRecordId: routeProofRecordId,
                                });

                                console.log('🔎 ALL matching credentials:', JSON.stringify(allCredentialsData, null, 2));

                                // Parse credentials from the response
                                const parsedCredentials: Record<string, CredentialOption[]> = {};
                                const attrsList: any[] = [];
                                const seenAttributes = new Set<string>();

                                if (allCredentialsData && (allCredentialsData.proofFormats as any)?.anoncreds) {
                                    const anonCreds = (allCredentialsData.proofFormats as any).anoncreds;

                                    // Process attributes
                                    if (anonCreds.attributes) {
                                        Object.entries(anonCreds.attributes).forEach(([ attrName, creds ]: [ string, any ]) => {
                                            if (Array.isArray(creds) && creds.length > 0) {
                                                // Get restrictions for this attribute
                                                const attrDef = fetchedRequestedAttributes[ attrName ];
                                                const restrictions = attrDef?.restrictions;

                                                // Filter credentials by restrictions or requested cred_def_ids
                                                const filteredCreds = filterCredentialsByRestrictions(creds, restrictions, requestedCredDefIds);

                                                if (filteredCreds.length === 0) {
                                                    console.warn(`⚠️ No credentials match restrictions for attribute: ${attrName}`);
                                                    return;
                                                }

                                                parsedCredentials[ attrName ] = filteredCreds.map((cred: any) => ({
                                                    credentialId: cred.credentialId,
                                                    credentialDefinitionId: cred.credentialInfo?.credentialDefinitionId,
                                                    schemaId: cred.credentialInfo?.schemaId,
                                                    attributes: cred.credentialInfo?.attributes || {},
                                                    revocationRegistryId: cred.credentialInfo?.revocationRegistryId || null,
                                                }));

                                                // Extract attribute values for display (use first credential)
                                                const firstCred = filteredCreds[ 0 ];
                                                const attrDisplayName = attrDef?.name || attrName;

                                                if (firstCred.credentialInfo?.attributes) {
                                                    Object.entries(firstCred.credentialInfo.attributes).forEach(([ key, value ]) => {
                                                        // Match the attribute name from the request
                                                        if (key === attrDisplayName && !seenAttributes.has(attrName)) {
                                                            const formattedName = key
                                                                .split('_')
                                                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                                                .join(' ');

                                                            attrsList.push({
                                                                name: formattedName,
                                                                value: String(value),
                                                                attrKey: attrName,
                                                                isPredicate: false,
                                                            });
                                                            seenAttributes.add(attrName);
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                    }

                                    // Process predicates
                                    if (anonCreds.predicates) {
                                        Object.entries(anonCreds.predicates).forEach(([ predName, creds ]: [ string, any ]) => {
                                            if (Array.isArray(creds) && creds.length > 0) {
                                                // Get restrictions for this predicate
                                                const predDef = fetchedRequestedPredicates[ predName ];
                                                const restrictions = predDef?.restrictions;

                                                // Filter credentials by restrictions or requested cred_def_ids
                                                let filteredCreds = filterCredentialsByRestrictions(creds, restrictions, requestedCredDefIds);

                                                // Filter by predicate condition (e.g., age >= 21)
                                                filteredCreds = filteredCreds.filter((cred: any) => {
                                                    return matchesPredicateCondition(cred, predDef);
                                                });

                                                if (filteredCreds.length === 0) {
                                                    console.warn(`⚠️ No credentials match restrictions and predicate condition for predicate: ${predName}`);
                                                    return;
                                                }

                                                parsedCredentials[ predName ] = filteredCreds.map((cred: any) => ({
                                                    credentialId: cred.credentialId,
                                                    credentialDefinitionId: cred.credentialInfo?.credentialDefinitionId,
                                                    schemaId: cred.credentialInfo?.schemaId,
                                                    attributes: cred.credentialInfo?.attributes || {},
                                                    revocationRegistryId: cred.credentialInfo?.revocationRegistryId || null,
                                                }));

                                                // Get predicate definition from format data
                                                if (predDef && !seenAttributes.has(predName)) {
                                                    const predDisplayName = predDef.name || predName;
                                                    const formattedName = predDisplayName
                                                        .split('_')
                                                        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                                                        .join(' ');

                                                    // Get the actual value from the first matching credential
                                                    const firstCred = filteredCreds[ 0 ];
                                                    let predValue = '';
                                                    if (firstCred.credentialInfo?.attributes && firstCred.credentialInfo.attributes[ predDisplayName ]) {
                                                        predValue = String(firstCred.credentialInfo.attributes[ predDisplayName ]);
                                                    }

                                                    // Format condition: e.g., "Area Sqft (>= 1000)"
                                                    const condition = `${predDef.p_type || '>='} ${predDef.p_value || ''}`;
                                                    const displayValue = predValue ? `${predValue} (${condition})` : condition;

                                                    attrsList.push({
                                                        name: formattedName,
                                                        value: displayValue,
                                                        attrKey: predName,
                                                        isPredicate: true,
                                                        predicateCondition: condition,
                                                        predicateValue: predValue,
                                                        predicateDisplayName: predDisplayName,
                                                        predicateType: predDef.p_type,
                                                        predicateValueThreshold: predDef.p_value,
                                                    });
                                                    seenAttributes.add(predName);
                                                }
                                            }
                                        });
                                    }
                                }

                                setCredentials(parsedCredentials);

                                // Auto-select the oldest credential for each attribute/predicate
                                const autoSelected: Record<string, string> = {};
                                Object.entries(parsedCredentials).forEach(([ key, creds ]) => {
                                    if (creds.length > 0) {
                                        // Select the last one (oldest) as per mediator team's example
                                        autoSelected[ key ] = creds[ creds.length - 1 ].credentialId;
                                    }
                                });
                                setSelectedCredentials(autoSelected);

                                if (attrsList.length > 0) {
                                    setAttributes(attrsList);
                                }
                            } catch (error) {
                                console.error('Error loading credentials:', error);
                            } finally {
                                setLoadingCredentials(false);
                            }

                            setIsLoading(false);
                        }
                    }
                    return;
                }

                if (invitationUrl) {
                    console.log('Accepting invitation...');
                    await dispatch(acceptInvitation(invitationUrl)).unwrap();
                }

                pollInterval = setInterval(async () => {
                    const agent = credoAgentService.getAgent();
                    if (agent) {
                        const records = await agent.proofs.getAll();
                        // Find the most recent proof request in RequestReceived state
                        const request: any = records
                            .filter(r => r.state === ProofState.RequestReceived)
                            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[ 0 ];

                        if (request && isMounted) {
                            setProofRecord(request);

                            // Load all matching credentials for selection (similar to ZKP flow)
                            try {
                                setLoadingCredentials(true);

                                // Fetch format data to get predicate conditions and requested attributes
                                const formatData = await agent.proofs.getFormatData(request.id);
                                let fetchedRequestedAttributes = (formatData.request as any).anoncreds?.requested_attributes || {};
                                let fetchedRequestedPredicates = (formatData.request as any).anoncreds?.requested_predicates || {};

                                // Try to get restrictions from proof record attachments if not in format data
                                if (request && (request as any).requestAttachments) {
                                    const attachments = (request as any).requestAttachments;
                                    for (const attachment of attachments) {
                                        if (attachment.data?.json) {
                                            const proofRequest = attachment.data.json;
                                            if (proofRequest.requested_attributes) {
                                                fetchedRequestedAttributes = proofRequest.requested_attributes;
                                            }
                                            if (proofRequest.requested_predicates) {
                                                fetchedRequestedPredicates = proofRequest.requested_predicates;
                                            }
                                        }
                                    }
                                }

                                console.log('📊 Format Data - Requested Attributes:', JSON.stringify(fetchedRequestedAttributes, null, 2));
                                console.log('📊 Format Data - Requested Predicates:', JSON.stringify(fetchedRequestedPredicates, null, 2));

                                // Extract requested credential definition IDs from the proof request
                                const requestedCredDefIds = extractRequestedCredDefIds(fetchedRequestedAttributes, fetchedRequestedPredicates, formatData);
                                console.log('🎯 Requested Credential Definition IDs:', Array.from(requestedCredDefIds));

                                // Store in state for use in render
                                setRequestedAttributes(fetchedRequestedAttributes);

                                const allCredentialsData = await agent.proofs.getCredentialsForRequest({
                                    proofRecordId: request.id,
                                });

                                console.log('🔎 ALL matching credentials:', JSON.stringify(allCredentialsData, null, 2));

                                // Parse credentials from the response
                                const parsedCredentials: Record<string, CredentialOption[]> = {};
                                const attrsList: any[] = [];
                                const seenAttributes = new Set<string>();

                                if (allCredentialsData && (allCredentialsData.proofFormats as any)?.anoncreds) {
                                    const anonCreds = (allCredentialsData.proofFormats as any).anoncreds;

                                    // Process attributes
                                    if (anonCreds.attributes) {
                                        Object.entries(anonCreds.attributes).forEach(([ attrName, creds ]: [ string, any ]) => {
                                            if (Array.isArray(creds) && creds.length > 0) {
                                                // Get restrictions for this attribute
                                                const attrDef = fetchedRequestedAttributes[ attrName ];
                                                const restrictions = attrDef?.restrictions;

                                                // Filter credentials by restrictions or requested cred_def_ids
                                                const filteredCreds = filterCredentialsByRestrictions(creds, restrictions, requestedCredDefIds);

                                                if (filteredCreds.length === 0) {
                                                    console.warn(`⚠️ No credentials match restrictions for attribute: ${attrName}`);
                                                    return;
                                                }

                                                parsedCredentials[ attrName ] = filteredCreds.map((cred: any) => ({
                                                    credentialId: cred.credentialId,
                                                    credentialDefinitionId: cred.credentialInfo?.credentialDefinitionId,
                                                    schemaId: cred.credentialInfo?.schemaId,
                                                    attributes: cred.credentialInfo?.attributes || {},
                                                    revocationRegistryId: cred.credentialInfo?.revocationRegistryId || null,
                                                }));

                                                // Extract attribute values for display (use first credential)
                                                const firstCred = filteredCreds[ 0 ];
                                                const attrDisplayName = attrDef?.name || attrName;

                                                if (firstCred.credentialInfo?.attributes) {
                                                    Object.entries(firstCred.credentialInfo.attributes).forEach(([ key, value ]) => {
                                                        // Match the attribute name from the request
                                                        if (key === attrDisplayName && !seenAttributes.has(attrName)) {
                                                            const formattedName = key
                                                                .split('_')
                                                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                                                .join(' ');

                                                            attrsList.push({
                                                                name: formattedName,
                                                                value: String(value),
                                                                attrKey: attrName,
                                                                isPredicate: false,
                                                            });
                                                            seenAttributes.add(attrName);
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                    }

                                    // Process predicates
                                    if (anonCreds.predicates) {
                                        Object.entries(anonCreds.predicates).forEach(([ predName, creds ]: [ string, any ]) => {
                                            if (Array.isArray(creds) && creds.length > 0) {
                                                // Get restrictions for this predicate
                                                const predDef = fetchedRequestedPredicates[ predName ];
                                                const restrictions = predDef?.restrictions;

                                                // Filter credentials by restrictions or requested cred_def_ids
                                                let filteredCreds = filterCredentialsByRestrictions(creds, restrictions, requestedCredDefIds);

                                                // Filter by predicate condition (e.g., age >= 21)
                                                filteredCreds = filteredCreds.filter((cred: any) => {
                                                    return matchesPredicateCondition(cred, predDef);
                                                });

                                                if (filteredCreds.length === 0) {
                                                    console.warn(`⚠️ No credentials match restrictions and predicate condition for predicate: ${predName}`);
                                                    return;
                                                }

                                                parsedCredentials[ predName ] = filteredCreds.map((cred: any) => ({
                                                    credentialId: cred.credentialId,
                                                    credentialDefinitionId: cred.credentialInfo?.credentialDefinitionId,
                                                    schemaId: cred.credentialInfo?.schemaId,
                                                    attributes: cred.credentialInfo?.attributes || {},
                                                    revocationRegistryId: cred.credentialInfo?.revocationRegistryId || null,
                                                }));

                                                // Get predicate definition from format data
                                                if (predDef && !seenAttributes.has(predName)) {
                                                    const predDisplayName = predDef.name || predName;
                                                    const formattedName = predDisplayName
                                                        .split('_')
                                                        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                                                        .join(' ');

                                                    // Get the actual value from the first matching credential
                                                    const firstCred = filteredCreds[ 0 ];
                                                    let predValue = '';
                                                    if (firstCred.credentialInfo?.attributes && firstCred.credentialInfo.attributes[ predDisplayName ]) {
                                                        predValue = String(firstCred.credentialInfo.attributes[ predDisplayName ]);
                                                    }

                                                    // Format condition: e.g., "Area Sqft (>= 1000)"
                                                    const condition = `${predDef.p_type || '>='} ${predDef.p_value || ''}`;
                                                    const displayValue = predValue ? `${predValue} (${condition})` : condition;

                                                    attrsList.push({
                                                        name: formattedName,
                                                        value: displayValue,
                                                        attrKey: predName,
                                                        isPredicate: true,
                                                        predicateCondition: condition,
                                                        predicateValue: predValue,
                                                        predicateDisplayName: predDisplayName,
                                                        predicateType: predDef.p_type,
                                                        predicateValueThreshold: predDef.p_value,
                                                    });
                                                    seenAttributes.add(predName);
                                                }
                                            }
                                        });
                                    }
                                }

                                setCredentials(parsedCredentials);

                                // Auto-select the oldest credential for each attribute/predicate
                                const autoSelected: Record<string, string> = {};
                                Object.entries(parsedCredentials).forEach(([ key, creds ]) => {
                                    if (creds.length > 0) {
                                        // Select the last one (oldest) as per mediator team's example
                                        autoSelected[ key ] = creds[ creds.length - 1 ].credentialId;
                                    }
                                });
                                setSelectedCredentials(autoSelected);

                                if (attrsList.length > 0) {
                                    setAttributes(attrsList);
                                } else {
                                    // Fallback if no credentials selected or found
                                    setAttributes([ { name: 'Status', value: 'No matching credentials found' } ]);
                                }
                            } catch (err) {
                                console.error('Error loading credentials:', err);
                                // Fallback to showing requested attributes names only if selection fails
                                try {
                                    const fallbackList: any[] = [];
                                    const requestAny = request as any;
                                    if (requestAny.formats && requestAny.formats.length > 0) {
                                        const format = requestAny.formats[ 0 ];
                                        if (format.attachmentId && requestAny.requestAttachments) {
                                            const attachment = requestAny.requestAttachments.find(
                                                (a: any) => a.id === format.attachmentId
                                            );
                                            if (attachment && attachment.data && attachment.data.json) {
                                                const proofRequest = attachment.data.json;
                                                if (proofRequest.requested_attributes) {
                                                    Object.keys(proofRequest.requested_attributes).forEach(key => {
                                                        const attr = proofRequest.requested_attributes[ key ];
                                                        fallbackList.push({
                                                            name: attr.name || key,
                                                            value: 'Requested (Not Found)'
                                                        });
                                                    });
                                                }
                                            }
                                        }
                                    }
                                    setAttributes(fallbackList.length > 0 ? fallbackList : [ { name: 'Proof Request', value: 'Details pending' } ]);
                                } catch (fallbackErr) {
                                    setAttributes([ { name: 'Proof Request', value: 'Details pending' } ]);
                                }
                            } finally {
                                setLoadingCredentials(false);
                            }

                            setIsLoading(false);
                            clearInterval(pollInterval);
                        }
                    }
                }, 2000);

            } catch (error) {
                console.error('Error initializing proof request:', error);
                Alert.alert('Error', 'Failed to process proof request');
                setIsLoading(false);
            }
        };

        init();

        return () => {
            isMounted = false;
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [ invitationUrl, dispatch, routeProofRecordId ]);

    const handleShare = async () => {
        if (!proofRecord) {
            console.warn('Proof record is missing in handleShare');
            return;
        }

        const agent = credoAgentService.getAgent();
        if (!agent) {
            Alert.alert('Error', 'Agent not available');
            return;
        }

        try {
            setIsLoading(true);

            // First, get the auto-selected credentials structure as a template
            console.log('🔍 Getting auto-selected credentials structure...');
            const autoSelected = await agent.proofs.selectCredentialsForRequest({
                proofRecordId: proofRecord.id,
            });

            console.log('📋 Auto-selected structure:', JSON.stringify(autoSelected, null, 2));

            // Now modify it with the user's manual selections
            // We'll work directly with the auto-selected structure to preserve all fields
            if ((autoSelected.proofFormats as any)?.anoncreds) {
                const anonCreds = (autoSelected.proofFormats as any).anoncreds;

                // Process attributes - update credential IDs if user made different selections
                if (anonCreds.attributes && typeof anonCreds.attributes === 'object') {
                    Object.keys(anonCreds.attributes).forEach((key) => {
                        if (selectedCredentials[ key ] && selectedCredentials[ key ] !== anonCreds.attributes[ key ]?.credentialId) {
                            // User selected a different credential, update only the credentialId
                            anonCreds.attributes[ key ].credentialId = selectedCredentials[ key ];
                        }
                    });
                }

                // Process predicates - update credential IDs if user made different selections
                if (anonCreds.predicates && typeof anonCreds.predicates === 'object') {
                    Object.keys(anonCreds.predicates).forEach((key) => {
                        if (selectedCredentials[ key ] && selectedCredentials[ key ] !== anonCreds.predicates[ key ]?.credentialId) {
                            // User selected a different credential, update only the credentialId
                            anonCreds.predicates[ key ].credentialId = selectedCredentials[ key ];
                        }
                    });
                }
            }

            console.log('📋 Modified selection:', JSON.stringify(autoSelected.proofFormats, null, 2));

            // Accept using the modified auto-selected credentials
            await agent.proofs.acceptRequest({
                proofRecordId: proofRecord.id,
                proofFormats: autoSelected.proofFormats,
            });

            // Save verification receipt to WatermelonDB for history tracking
            try {
                const uniqueCreds = getUniqueSelectedCredentials(selectedCredentials, credentials);
                const firstCred = uniqueCreds[ 0 ];
                const firstCredAttributes = firstCred?.attributes || {};

                const credName = getCredentialName(0, firstCred?.schemaId, firstCredAttributes);
                const hName = String(firstCredAttributes.name || firstCredAttributes.full_name || firstCredAttributes.holder_name || 'User');

                // Generate a reference ID for display
                const refId = `#${firstCred?.schemaId?.split('/').pop()?.substring(0, 3).toUpperCase() || 'VR'}-${Math.floor(Math.random() * 9000) + 1000}`;

                await VerificationReceiptService.saveVerificationReceipt({
                    verificationId: proofRecord.id,
                    verifierName: verifierName === "undefined" || !verifierName ? "Verifier" : verifierName,
                    credentialName: credName,
                    holderName: hName,
                    state: 'granted',
                    sharedAttributes: attributes.map(attr => ({
                        name: attr.name,
                        value: attr.value
                    })),
                    referenceId: refId,
                    location: 'Remote Session'
                });
            } catch (receiptError) {
                console.error('⚠️ Failed to save verification receipt:', receiptError);
            }

            setIsLoading(false);
            setShowSuccessModal(true);
        } catch (error: any) {
            console.error('❌ Error accepting proof request:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));

            // Provide user-friendly error messages based on error type
            let errorMessage = 'Failed to share proof';

            if (error.message?.includes('revocation') || error.message?.includes('non_revoked')) {
                errorMessage = 'This proof request requires revocation information, but the selected credential does not support revocation. Please select a different credential that supports revocation.';
            } else if (error.message?.includes('credential')) {
                errorMessage = error.message || 'Invalid credential selected for this proof request.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            Alert.alert('Error', errorMessage);
            setIsLoading(false);
        }
    };

    const handleDeny = async () => {
        if (!proofRecord) return;
        try {
            setIsLoading(true);
            await dispatch(declineProofRequest(proofRecord.id)).unwrap();
            navigation.goBack();
        } catch (error: any) {
            console.error('Error declining proof:', error);
            navigation.goBack();
        }
    };

    if (isLoading && !proofRecord) {
        return (
            <View style={[ styles.container, styles.center ]}>
                <ActivityIndicator size="large" color="#5b18b8" />
                <Text style={styles.loadingMessage}>Processing Request...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back-ios" size={20} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Verification Request</Text>
                <TouchableOpacity style={styles.moreButton}>
                    <MaterialIcons name="more-vert" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.contentContainer}>
                {/* Card */}
                <LinearGradient
                    colors={[ '#5b18b8', '#7E22CE' ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.card}
                >
                    <View style={styles.cardContent}>
                        <View style={styles.verifierInfo}>
                            <View style={styles.logoContainer}>
                                {/* Placeholder for logo */}
                                <View style={styles.logoPlaceholder} />
                            </View>
                            <View>
                                <Text style={styles.verifierName}>{verifierName === "undefined" ? "Verifier" : verifierName}</Text>
                                <Text style={styles.attributeCount}>
                                    {attributes.filter((a: any) => !a.isPredicate).length} Attributes
                                    {attributes.filter((a: any) => a.isPredicate).length > 0 &&
                                        ` • ${attributes.filter((a: any) => a.isPredicate).length} Conditions`
                                    }
                                </Text>
                            </View>
                        </View>

                        <View style={styles.dateContainer}>
                            <Text style={styles.dateLabel}>Requested On</Text>
                            <Text style={styles.dateValue}>{new Date().toLocaleDateString()}</Text>
                        </View>
                    </View>

                    {/* Abstract Design Element (Right side) */}
                    <View style={styles.designElementContainer}>
                        <View style={[ styles.diamond, styles.diamond1 ]} />
                        <View style={[ styles.diamond, styles.diamond2 ]} />
                    </View>
                </LinearGradient>

                {/* Selected Credential(s) Details Section */}
                {!loadingCredentials && Object.keys(selectedCredentials).length > 0 && (
                    <View style={styles.credentialDetailsSection}>
                        {(() => {
                            const uniqueCreds = getUniqueSelectedCredentials(selectedCredentials, credentials);
                            const isSingleCred = isSingleCredentialUsed(selectedCredentials);

                            if (isSingleCred && uniqueCreds.length === 1) {
                                // Single credential - show detailed card
                                const cred = uniqueCreds[0];
                                const credAttributes = cred.attributes || {};
                                const credentialName = getCredentialName(0, cred.schemaId, credAttributes);
                                const issuerName = getIssuerFromAttributes(credAttributes);
                                const attrsForCred = getAttributesForCredential(cred.credentialId, selectedCredentials, attributes);
                                
                                const isExpanded = expandedCredentialId === cred.credentialId;
                                const allAttributeEntries = Object.entries(credAttributes);
                                const initialAttributeCount = 2;
                                const attributeEntries = isExpanded 
                                    ? allAttributeEntries 
                                    : allAttributeEntries.slice(0, initialAttributeCount);
                                const hasMoreAttributes = allAttributeEntries.length > initialAttributeCount;
                                
                                return (
                                    <View style={styles.singleCredentialCard}>
                                        <View style={styles.credentialCardHeader}>
                                            <MaterialIcons name="verified" size={24} color="#5b18b8" />
                                            <View style={styles.credentialCardHeaderText}>
                                                <Text style={styles.credentialCardTitle}>Selected Credential</Text>
                                                <Text style={styles.credentialName}>{credentialName}</Text>
                                                {issuerName && (
                                                    <Text style={styles.credentialIssuerName}>Issued by {issuerName}</Text>
                                                )}
                                            </View>
                                        </View>
                                        <View style={styles.credentialCardInfo}>
                                            <Text style={styles.credentialAttributesCount}>
                                                {attrsForCred.length} {attrsForCred.length === 1 ? 'attribute' : 'attributes'} from this credential
                                            </Text>
                                            {attributeEntries.length > 0 && (
                                                <View style={styles.credentialAttributesList}>
                                                    {attributeEntries.map(([attrName, attrValue], idx) => {
                                                        const formattedName = attrName
                                                            .split('_')
                                                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                                            .join(' ');
                                                        return (
                                                            <View key={idx} style={styles.credentialAttributeItem}>
                                                                <Text style={styles.credentialAttributeName} numberOfLines={1}>
                                                                    {formattedName}:
                                                                </Text>
                                                                <Text style={styles.credentialAttributeValue} numberOfLines={2}>
                                                                    {String(attrValue)}
                                                                </Text>
                                                            </View>
                                                        );
                                                    })}
                                                    {hasMoreAttributes && (
                                                        <TouchableOpacity
                                                            onPress={() => setExpandedCredentialId(isExpanded ? null : cred.credentialId)}
                                                            style={styles.showMoreButton}
                                                        >
                                                            <Text style={styles.showMoreText}>
                                                                {isExpanded ? 'Show less' : `Show ${allAttributeEntries.length - initialAttributeCount} more attributes`}
                                                            </Text>
                                                            <MaterialIcons 
                                                                name={isExpanded ? "expand-less" : "expand-more"} 
                                                                size={20} 
                                                                color="#5b18b8" 
                                                            />
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                );
                            } else if (uniqueCreds.length > 1) {
                                // Multiple credentials - show compact summary
                                return (
                                    <View style={styles.multipleCredentialsSummary}>
                                        <View style={styles.multipleCredentialsHeader}>
                                            <MaterialIcons name="folder" size={20} color="#5b18b8" />
                                            <Text style={styles.multipleCredentialsTitle}>
                                                Selected Credentials ({uniqueCreds.length})
                                            </Text>
                                        </View>
                                        {uniqueCreds.map((cred, index) => {
                                            const credAttributes = cred.attributes || {};
                                            const credentialName = getCredentialName(index, cred.schemaId, credAttributes);
                                            const issuerName = getIssuerFromAttributes(credAttributes);
                                            const attrsForCred = getAttributesForCredential(cred.credentialId, selectedCredentials, attributes);
                                            
                                            // Get first 3 attributes to show (more for multiple credentials view)
                                            const attributeEntries = Object.entries(credAttributes).slice(0, 3);
                                            
                                            return (
                                                <View key={cred.credentialId} style={[
                                                    styles.credentialSummaryItem,
                                                    index === 0 && styles.credentialSummaryItemFirst
                                                ]}>
                                                    <View style={styles.credentialSummaryInfo}>
                                                        <View style={styles.credentialSummaryLeft}>
                                                            <View style={styles.credentialSummaryHeader}>
                                                                <Text style={styles.credentialSummaryName} numberOfLines={1}>
                                                                    {credentialName}
                                                                </Text>
                                                                {issuerName && (
                                                                    <Text style={styles.credentialSummaryIssuer} numberOfLines={1}>
                                                                        by {issuerName}
                                                                    </Text>
                                                                )}
                                                            </View>
                                                            {attributeEntries.length > 0 && (
                                                                <View style={styles.credentialSummaryAttributes}>
                                                                    {attributeEntries.map(([attrName, attrValue], idx) => {
                                                                        const formattedName = attrName
                                                                            .split('_')
                                                                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                                                            .join(' ');
                                                                        return (
                                                                            <Text key={idx} style={[styles.credentialSummaryAttributeText, idx > 0 && { marginTop: 2 }]} numberOfLines={1}>
                                                                                {formattedName}: {String(attrValue)}
                                                                            </Text>
                                                                        );
                                                                    })}
                                                                    {Object.keys(credAttributes).length > 3 && (
                                                                        <Text style={styles.credentialSummaryMore}>
                                                                            +{Object.keys(credAttributes).length - 3} more
                                                                        </Text>
                                                                    )}
                                                                </View>
                                                            )}
                                                        </View>
                                                        <Text style={styles.credentialSummaryCount}>
                                                            {attrsForCred.length} {attrsForCred.length === 1 ? 'attr' : 'attrs'}
                                                        </Text>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                );
                            }
                            return null;
                        })()}
                    </View>
                )}

                <Text style={styles.sectionTitle}>Attributes & Conditions Requested</Text>

                {/* Attributes List */}
                {loadingCredentials ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#5b18b8" />
                        <Text style={styles.loadingText}>Loading credentials...</Text>
                    </View>
                ) : (
                    <View style={styles.attributesList}>
                        {attributes.length > 0 ? attributes.map((attr: any, index: number) => {
                            const attrKey = attr.attrKey || attr.name.toLowerCase().replace(/\s+/g, '_');
                            const matchingCreds = credentials[ attrKey ] || [];
                            const selectedId = selectedCredentials[ attrKey ];

                            // Find the selected credential to get its current value
                            const selectedCredential = matchingCreds.find(c => c.credentialId === selectedId);

                            // Determine the display value dynamically
                            let displayValue = attr.value; // Fallback to original value

                            if (selectedCredential && selectedCredential.attributes) {
                                if (attr.isPredicate) {
                                    // For predicates, get the value from the selected credential
                                    const predDisplayName = attr.predicateDisplayName || attr.name.toLowerCase().replace(/\s+/g, '_');
                                    const credValue = selectedCredential.attributes[ predDisplayName ];
                                    if (credValue !== undefined) {
                                        const condition = attr.predicateCondition || `${attr.predicateType || '>='} ${attr.predicateValueThreshold || ''}`;
                                        displayValue = `${credValue} (${condition})`;
                                    }
                                } else {
                                    // For attributes, find the matching attribute value
                                    const attrDef = requestedAttributes[ attrKey ];
                                    const attrDisplayName = attrDef?.name || attrKey;
                                    const credValue = selectedCredential.attributes[ attrDisplayName ];
                                    if (credValue !== undefined) {
                                        displayValue = String(credValue);
                                    }
                                }
                            }

                            return (
                                <View key={index} style={styles.attributeItem}>
                                    <View style={styles.attributeInfo}>
                                        <View style={styles.attributeNameContainer}>
                                            <Text style={styles.attributeName}>{attr.name}</Text>
                                            {attr.isPredicate && (
                                                <View style={styles.predicateBadge}>
                                                    <MaterialIcons name="verified" size={14} color="#5b18b8" />
                                                    <Text style={styles.predicateBadgeText}>Condition</Text>
                                                </View>
                                            )}
                                        </View>
                                        <View style={styles.valueContainer}>
                                            <Text style={[ styles.attributeValue, attr.isPredicate && styles.predicateValue ]}>
                                                {displayValue}
                                            </Text>
                                            <Text style={styles.valuePreviewLabel}>
                                                Value to be shared
                                            </Text>
                                        </View>
                                    </View>
                                    {matchingCreds.length > 1 && (
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            style={styles.credentialSelector}
                                        >
                                            {matchingCreds.map((cred, credIndex) => {
                                                const credentialName = getCredentialName(credIndex, cred.schemaId, cred.attributes);
                                                return (
                                                    <TouchableOpacity
                                                        key={cred.credentialId}
                                                        style={[
                                                            styles.credentialBadge,
                                                            selectedId === cred.credentialId && styles.credentialBadgeSelected,
                                                        ]}
                                                        onPress={() => setSelectedCredentials({ ...selectedCredentials, [ attrKey ]: cred.credentialId })}
                                                    >
                                                        <Text style={styles.credentialBadgeText} numberOfLines={1}>
                                                            {credentialName}
                                                        </Text>
                                                        {selectedId === cred.credentialId && (
                                                            <MaterialIcons name="check-circle" size={16} color="#5b18b8" />
                                                        )}
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </ScrollView>
                                    )}
                                </View>
                            );
                        }) : (
                            <Text>No specific attributes requested.</Text>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.shareButton} onPress={handleShare} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.shareButtonText}>Share</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.denyButton} onPress={handleDeny} disabled={isLoading}>
                    <Text style={styles.denyButtonText}>Deny</Text>
                </TouchableOpacity>
            </View>

            <SuccessProofModal
                visible={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    // Navigate to Connections tab (AllCredentialsListScreen) in TabNavigator
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 0,
                            routes: [
                                {
                                    name: 'DrawerNavigator',
                                    state: {
                                        routes: [
                                            {
                                                name: 'MainStack',
                                                state: {
                                                    index: 3, // AllCredentialsListScreen is the 4th tab (0-indexed)
                                                    routes: [
                                                        { name: 'Home' },
                                                        { name: 'Credentials' },
                                                        { name: 'Scan QR' },
                                                        { name: 'AllCredentialsListScreen' },
                                                        { name: 'ProofRequestList' },
                                                    ],
                                                },
                                            },
                                        ],
                                    },
                                },
                            ],
                        })
                    );
                }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F9FAFB',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    moreButton: {
        padding: 8,
    },
    contentContainer: {
        padding: 16,
    },
    card: {
        borderRadius: 16,
        padding: 20,
        height: 200,
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
    },
    cardContent: {
        flex: 1,
        justifyContent: 'space-between',
        zIndex: 2,
    },
    verifierInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoContainer: {
        marginRight: 12,
    },
    logoPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
    },
    verifierName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    attributeCount: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '600',
    },
    dateContainer: {
        marginTop: 20,
    },
    dateLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    dateValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginTop: 4,
    },
    designElementContainer: {
        position: 'absolute',
        right: -20,
        top: -20,
        bottom: -20,
        width: 150,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    diamond: {
        width: 80,
        height: 80,
        backgroundColor: 'transparent',
        borderWidth: 15,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        transform: [ { rotate: '45deg' } ],
        position: 'absolute',
    },
    diamond1: {
        right: 20,
    },
    diamond2: {
        right: 50,
        borderColor: '#FFFFFF',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5b18b8',
        marginBottom: 16,
    },
    attributesList: {
        gap: 12,
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 8,
        fontSize: 14,
        color: '#6B7280',
    },
    attributeItem: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 12,
    },
    attributeInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    attributeNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 8,
    },
    attributeName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    attributeValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
        flex: 1,
        textAlign: 'right',
    },
    predicateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3E8FF',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 4,
    },
    predicateBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#5b18b8',
    },
    predicateValue: {
        color: '#5b18b8',
    },
    credentialSelector: {
        flexDirection: 'row',
        marginTop: 8,
    },
    credentialBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        maxWidth: 150,
    },
    credentialBadgeSelected: {
        borderColor: '#5b18b8',
        backgroundColor: '#F3E8FF',
    },
    credentialBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        marginRight: 4,
        flexShrink: 1,
    },
    valueContainer: {
        alignItems: 'flex-end',
        flex: 1,
    },
    valuePreviewLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        marginTop: 2,
        fontStyle: 'italic',
    },
    footer: {
        flexDirection: 'row',
        padding: 16,
        gap: 16,
        backgroundColor: '#F9FAFB',
    },
    shareButton: {
        flex: 1,
        backgroundColor: '#5b18b8',
        paddingVertical: 14,
        borderRadius: 24,
        alignItems: 'center',
    },
    shareButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    denyButton: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingVertical: 14,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#5b18b8',
    },
    denyButtonText: {
        color: '#5b18b8',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingMessage: {
        marginTop: 10,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    credentialDetailsSection: {
        marginBottom: 24,
    },
    singleCredentialCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    credentialCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    credentialCardHeaderText: {
        marginLeft: 12,
        flex: 1,
    },
    credentialCardTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    credentialName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    credentialIssuerName: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '400',
        marginTop: 2,
    },
    credentialCardInfo: {
        marginTop: 8,
    },
    credentialAttributesCount: {
        fontSize: 14,
        color: '#5b18b8',
        fontWeight: '600',
        marginBottom: 8,
    },
    credentialAttributesList: {
        marginTop: 8,
    },
    credentialAttributeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    credentialAttributeName: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
        minWidth: 80,
    },
    credentialAttributeValue: {
        fontSize: 12,
        color: '#1F2937',
        fontWeight: '500',
        flex: 1,
        marginLeft: 8,
    },
    showMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#F3E8FF',
        borderWidth: 1,
        borderColor: '#E9D5FF',
    },
    showMoreText: {
        fontSize: 12,
        color: '#5b18b8',
        fontWeight: '600',
        marginRight: 4,
    },
    multipleCredentialsSummary: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    multipleCredentialsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    multipleCredentialsTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        marginLeft: 8,
    },
    credentialSummaryItem: {
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    credentialSummaryItemFirst: {
        borderTopWidth: 0,
    },
    credentialSummaryInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    credentialSummaryLeft: {
        flex: 1,
        marginRight: 12,
    },
    credentialSummaryHeader: {
        marginBottom: 4,
    },
    credentialSummaryName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    credentialSummaryIssuer: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '400',
        marginTop: 2,
    },
    credentialSummaryAttributes: {
        marginTop: 2,
    },
    credentialSummaryAttributeText: {
        fontSize: 11,
        color: '#6B7280',
        lineHeight: 16,
    },
    credentialSummaryMore: {
        fontSize: 10,
        color: '#9CA3AF',
        fontStyle: 'italic',
        marginTop: 2,
    },
    credentialSummaryCount: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
        marginTop: 2,
    },
});

export default ProofRequestDetailsScreen;
