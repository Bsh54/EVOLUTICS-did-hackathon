import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { ISSUER_ATTRIBUTE_NAMES, findMostImportantAttribute } from '../../../services/CredentialService';

export interface CredentialDisplayItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  iconName: string;
  iconColor: string;
  iconBg: string;
  credential: any; // Keep full credential object for navigation
}

/**
 * Hook to process and transform credentials for display
 * Maps credentials to display format, sorts by creation date, and returns recent ones
 */
export const useCredentials = (limit: number = 100): CredentialDisplayItem[] => {
  const credentials = useSelector((state: RootState) => state.credo.credentials);
  const connections = useSelector((state: RootState) => state.credo.connections);
  const pendingCredentials = useSelector((state: RootState) => state.credo.pendingCredentials);

  const recentCredentials = useMemo(() => {
    // Map pending credentials to display format
    const pendingItems: CredentialDisplayItem[] = pendingCredentials.map((pending: any) => ({
      id: pending.id,
      title: pending.label || 'Processing Credential',
      subtitle: 'Processing...',
      date: new Date(pending.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      iconName: 'pending',
      iconColor: '#F59E0B',
      iconBg: '#F59E0B',
      credential: {
        id: pending.id,
        state: 'processing',
        isPending: true,
      },
    }));

    const mappedCredentials = credentials
      .map((cred: any) => {
        // Debug logging
        // console.log('=== CREDENTIAL DATA ===');
        // console.log('Credential ID:', cred.id);
        // console.log('Credential connectionId:', cred.connectionId);
        // console.log('Credential outOfBandId:', cred.outOfBandId);
        // console.log('Credential connectionLabel:', cred.connectionLabel);
        // console.log('Credential attributes:', JSON.stringify(cred.credentialAttributes, null, 2));
        // console.log('Credential state:', cred.state);
        // console.log('Credential schemaId:', cred.schemaId);

        // Find associated connection - try multiple methods
        let associatedConnection = null;

        // First try by connectionId
        if (cred.connectionId) {
          console.log('Looking for connection with ID:', cred.connectionId);
          console.log('Available connection IDs:', connections.map(c => c.id));
          associatedConnection = connections.find((conn: any) => conn.id === cred.connectionId);
          console.log('Found connection by connectionId:', associatedConnection ? 'YES' : 'NO');
        }

        // If not found, try to match by outOfBandId (credentials might be linked via OOB record)
        if (!associatedConnection && cred.outOfBandId) {
          associatedConnection = connections.find((conn: any) => conn.outOfBandId === cred.outOfBandId);
          console.log('Found connection by outOfBandId:', associatedConnection ? 'YES' : 'NO');
        }

        // if (associatedConnection) {
        //   console.log('=== ASSOCIATED CONNECTION DATA ===');
        //   console.log('Connection ID:', associatedConnection.id);
        //   console.log('Connection theirLabel:', associatedConnection.theirLabel);
        //   console.log('Connection urlLabel:', associatedConnection.urlLabel);
        //   console.log('Connection urlType:', associatedConnection.urlType);
        //   console.log('Connection outOfBandLabel:', associatedConnection.outOfBandLabel);
        //   console.log('Connection outOfBandInvitation:', JSON.stringify(associatedConnection.outOfBandInvitation, null, 2));
        //   console.log('Connection credentialAttributesFromOOB:', JSON.stringify(associatedConnection.credentialAttributesFromOOB, null, 2));
        // } else {
        //   console.log('NO ASSOCIATED CONNECTION FOUND');
        //   console.log('Available connections:', connections.map(c => ({ id: c.id, theirLabel: c.theirLabel, outOfBandId: c.outOfBandId })));
        // }

        // Extract out-of-band data if available
        const oobAttributes = associatedConnection?.credentialAttributesFromOOB || [];
        // console.log('OOB Attributes extracted:', JSON.stringify(oobAttributes, null, 2));

        // Extract relevant information from credential record
        const attributes = cred.credentialAttributes || [];
        // console.log('Credential attributes extracted:', JSON.stringify(attributes, null, 2));

        // Helper to check if a value is purely numerical
        const isNumericalValue = (value: any): boolean => {
          if (typeof value === 'number') return true;
          if (typeof value !== 'string') return false;
          const trimmed = value.trim();
          // Check if it's a pure number (1-4 digits, likely age or count)
          if (/^\d{1,4}$/.test(trimmed)) return true;
          return false;
        };

        // Helper to validate issuer name
        const isValidIssuerName = (value: any): boolean => {
          if (!value) return false;
          if (typeof value !== 'string') return false;
          const trimmed = value.trim();
          return trimmed !== '' &&
            trimmed !== 'Unknown Issuer' &&
            trimmed.toLowerCase() !== 'unknown' &&
            trimmed !== 'null' &&
            trimmed !== 'undefined' &&
            !isNumericalValue(trimmed);
        };

        // Step 1: Check issuer name from ALL sources (in priority order)
        // Priority: connection labels > invitation labels > OOB issuer > credential issuer attributes
        const connectionLabel = cred.connectionLabel && cred.connectionLabel !== 'Unknown Issuer' ? cred.connectionLabel : null;
        const invitationLabel = associatedConnection?.urlLabel ||
          associatedConnection?.outOfBandInvitation?.label ||
          associatedConnection?.outOfBandLabel;
        const oobIssuer = oobAttributes.find((attr: any) =>
          ISSUER_ATTRIBUTE_NAMES.includes(attr.name)
        )?.value;
        const credentialIssuer = attributes.find((attr: any) =>
          ISSUER_ATTRIBUTE_NAMES.includes(attr.name)
        )?.value;

        // Check issuer name sources in priority order
        let issuerName: string | null = null;
        if (isValidIssuerName(connectionLabel)) {
          issuerName = connectionLabel!;
        } else if (invitationLabel && isValidIssuerName(invitationLabel)) {
          issuerName = invitationLabel;
        } else if (associatedConnection?.theirLabel && isValidIssuerName(associatedConnection.theirLabel)) {
          issuerName = associatedConnection.theirLabel;
        } else if (oobIssuer && isValidIssuerName(oobIssuer)) {
          issuerName = oobIssuer;
        } else if (credentialIssuer && isValidIssuerName(credentialIssuer)) {
          issuerName = credentialIssuer;
        }

        // Step 2: If issuer name is present, use it. Otherwise, go to priority attribute names from listings
        let title: string;
        if (issuerName) {
          // Use issuer name for preview card title (do NOT modify the issuer name value itself)
          title = issuerName.trim();
        } else {
          // Find most important attribute from listings (avoiding numerical attributes and issuer-related attributes)
          const allAttributes = [ ...oobAttributes, ...attributes ];
          const mostImportantAttr = findMostImportantAttribute(allAttributes);

          if (mostImportantAttr && !isNumericalValue(mostImportantAttr)) {
            title = mostImportantAttr;
          } else {
            // Step 3: Final fallback to connection-based labels
            const fallbackTitle = associatedConnection
              ? (invitationLabel ||
                connectionLabel ||
                associatedConnection?.theirLabel ||
                'Unknown Issuer')
              : (invitationLabel ||
                connectionLabel ||
                'Unknown Issuer');

            // Final safeguard: ensure fallback title is not numerical
            title = isNumericalValue(fallbackTitle) ? 'Unknown Issuer' : fallbackTitle;
          }
        }

        // Final validation: ensure title is never numerical
        if (isNumericalValue(title)) {
          title = 'Unknown Issuer';
        }

        // console.log('=== TITLE EXTRACTION ===');
        // console.log('oobIssuer:', oobIssuer);
        // console.log('invitationLabel:', invitationLabel);
        // console.log('connectionLabel:', connectionLabel);
        // console.log('associatedConnection?.theirLabel:', associatedConnection?.theirLabel);
        // console.log('credentialIssuer:', credentialIssuer);
        // console.log('issuerAttr?.value:', issuerAttr?.value);
        // console.log('Final title:', title);

        // Enhanced subtitle extraction with OOB priority - use invitation label as strong fallback
        const subtitle =
          oobAttributes.find((attr: any) => ISSUER_ATTRIBUTE_NAMES.includes(attr.name))?.value ||
          invitationLabel ||
          credentialIssuer ||
          attributes.find((attr: any) => ISSUER_ATTRIBUTE_NAMES.includes(attr.name))?.value ||
          connectionLabel ||
          associatedConnection?.theirLabel ||
          associatedConnection?.urlLabel ||
          associatedConnection?.outOfBandLabel ||
          cred.connectionId ||
          cred.schemaId ||
          'Unknown Issuer';

        // console.log('Final subtitle:', subtitle);
        // console.log('========================\n');

        // createdAt is already a string (ISO format) from serialization
        const date = cred.createdAt ? new Date(cred.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

        // Determine icon and color based on credential state or type
        let iconName = 'verified';
        let iconColor = '#10B981';
        let iconBg = '#10B981';

        if (cred.state === 'offer-received' || cred.state === 'request-sent') {
          iconName = 'pending';
          iconColor = '#F59E0B';
          iconBg = '#F59E0B';
        } else if (cred.state === 'done') {
          iconName = 'verified';
          iconColor = '#10B981';
          iconBg = '#10B981';
        }

        const mapped: CredentialDisplayItem = {
          id: cred.id,
          title,
          subtitle,
          date,
          iconName,
          iconColor,
          iconBg,
          credential: cred, // Keep full credential object for navigation
        };

        return mapped;
      })
      // Sort by creation date (most recent first)
      .sort((a: any, b: any) => {
        const aTime = a.credential?.createdAt ? new Date(a.credential.createdAt).getTime() : 0;
        const bTime = b.credential?.createdAt ? new Date(b.credential.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      // Take only the most recent ones based on limit
      .slice(0, limit);

    // Combine pending credentials (at the top) with actual credentials
    const allCredentials = [ ...pendingItems, ...mappedCredentials ];

    return allCredentials;
  }, [ credentials, connections, pendingCredentials, limit ]);

  return recentCredentials;
};

