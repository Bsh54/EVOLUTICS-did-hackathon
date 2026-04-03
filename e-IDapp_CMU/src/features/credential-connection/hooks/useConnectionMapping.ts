import { useMemo } from 'react';
import { Connection } from '../../../store/slices/credoSlice';
import { isMediatorConnection } from '../../../utils/connectionUtils';

export interface MappedConnection {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  avatar: any;
  status: 'new' | 'completed' | 'accepted';
  state: string;
  isOnline: boolean;
  isMediator: boolean;
  connection: Connection;
}

/**
 * Hook to map connections from Redux to display format
 * Handles out-of-band data extraction, status determination, and subtitle creation
 * Returns mapped connections sorted by creation date (latest first)
 */
export const useConnectionMapping = (connections: Connection[]): MappedConnection[] => {
  const mappedConnections = useMemo(() => {
    // Map connections to display format
    const mapped = connections.map((conn: Connection) => {
      // Format creation date
      const createdAt = conn.createdAt
        ? new Date(conn.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';

      // Determine display status
      let displayStatus: 'new' | 'completed' | 'accepted' = 'new';
      if (conn.state === 'completed') {
        displayStatus = 'completed';
      } else if (conn.state === 'accepted' || conn.state === 'response-sent') {
        displayStatus = 'accepted';
      }

      // Use out-of-band invitation label if available, fallback to theirLabel
      let displayTitle =
        conn.outOfBandInvitation?.label ||
        conn.outOfBandLabel ||
        conn.theirLabel ||
        'Unknown Connection';

      // Check if this is a mediator connection using centralized utility
      const isMediator = isMediatorConnection(conn);

      // Transform mediator-invite labels to be more user-friendly
      if (isMediator) {
        displayTitle = 'Mediator Connection';
      }

      // Extract service endpoint for subtitle
      const serviceEndpoint = conn.outOfBandInvitation?.services?.[ 0 ]?.serviceEndpoint;
      const serviceType = conn.outOfBandInvitation?.services?.[ 0 ]?.type;
      const handshakeProtocols =
        conn.handshakeProtocols || conn.outOfBandInvitation?.handshake_protocols || [];

      // Create informative subtitle
      let subtitle = '';
      if (serviceEndpoint) {
        const domain = serviceEndpoint.replace(/^https?:\/\//, '').split('/')[ 0 ];
        subtitle = `${serviceType || 'Service'}: ${domain}`;
      } else if (handshakeProtocols.length > 0) {
        const protocolName = handshakeProtocols[ 0 ].split('/').pop() || 'Connection';
        subtitle = `${protocolName} protocol`;
      } else {
        if (conn.state === 'completed') {
          subtitle = 'Connection established';
        } else {
          subtitle = `Status: ${conn.state}`;
        }
      }

      return {
        id: conn.id,
        title: displayTitle,
        subtitle: subtitle,
        date: createdAt,
        avatar: require('../../../assets/credentials/avatar.png'),
        status: displayStatus,
        state: conn.state,
        isOnline: false,
        isMediator: isMediator,
        connection: conn, // Keep full connection object
      };
    });

    // Sort by creation date (latest first)
    return mapped.sort((a, b) => {
      const dateA = a.connection.createdAt ? new Date(a.connection.createdAt).getTime() : 0;
      const dateB = b.connection.createdAt ? new Date(b.connection.createdAt).getTime() : 0;
      return dateB - dateA; // Descending order (newest first)
    });
  }, [ connections ]);

  return mappedConnections;
};

