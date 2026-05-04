import { useState, useEffect } from 'react';
import { connectToMediator, isMediatorConnected } from '../services/mediator';
import { credoAgentService } from '../services/agent';

/**
 * Hook to manage mediator connection status
 * Yeh hook mediator connection ki status track karta hai
 */
export const useMediatorConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check mediator connection status
  const checkConnection = async () => {
    try {
      const connected = await isMediatorConnected();
      setIsConnected(connected);
      return connected;
    } catch (err) {
      console.error('Error checking mediator connection:', err);
      return false;
    }
  };

  // Manually connect to mediator
  const connect = async () => {
    if (isConnecting) {
      console.log('Already connecting to mediator...');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      if (!credoAgentService.isAgentInitialized()) {
        throw new Error('Agent must be initialized first');
      }

      const connectionId = await connectToMediator();
      
      if (connectionId) {
        setIsConnected(true);
        console.log('Mediator connected via hook');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to connect to mediator';
      setError(errorMessage);
      console.error('Mediator connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    checkConnection,
  };
};
