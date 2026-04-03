import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { Connection } from '../../../store/slices/credoSlice';
import { isMediatorConnection } from '../../../utils/connectionUtils';

/**
 * Hook to filter connections, excluding mediator connections and invitation-sent connections
 * Filters out connections that are mediators (checked across all label fields) or have "invitation-sent" state
 * 
 * @param includeMediators - If true, returns all connections including mediators. Default: false
 */
export const useConnections = (includeMediators: boolean = false): Connection[] => {
  const connections = useSelector((state: RootState) => state.credo.connections);

  const filteredConnections = useMemo(() => {
    let filtered = connections;
    
    // Filter out invitation-sent connections
    filtered = filtered.filter((conn: Connection) => {
      return conn.state !== 'invitation-sent';
    });
    
    // Filter out mediator connections if not including them
    if (!includeMediators) {
      filtered = filtered.filter((conn: Connection) => !isMediatorConnection(conn));
    }
    
    return filtered;
  }, [connections, includeMediators]);

  return filteredConnections;
};

