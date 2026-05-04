import React, { useState, useEffect, ReactNode, createContext, useContext } from 'react';
import CredoAgentProvider from '@credo-ts/react-hooks';
import { agentService } from './AgentService';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

interface AgentProviderProps {
  children: ReactNode;
}

// Create a safe wrapper context that always provides a context
// This allows useAgent() to be called even when CredoAgentProvider is not yet available
const SafeAgentContext = createContext<{ agent: any; loading: boolean } | null>(null);

/**
 * AgentProvider component
 * Wraps the app with Credo's AgentProvider and handles agent initialization
 */
export const AgentProvider: React.FC<AgentProviderProps> = ({ children }) => {
  const [ agent, setAgent ] = useState<any>(null);
  const [ isInitializing, setIsInitializing ] = useState(true);
  const [ error, setError ] = useState<string | null>(null);

  useEffect(() => {
    const initializeAgent = async () => {
      try {
        setIsInitializing(true);
        setError(null);

        // Check if agent is already initialized
        if (agentService.isAgentInitialized()) {
          const agentInstance = agentService.getAgent();
          if (agentInstance) {
            setAgent(agentInstance);
            // The agentSlice from @credo-ts/redux-store automatically syncs
            // with the agent's state once the agent is initialized.
            setIsInitializing(false);
            return;
          }
        }

        // Agent not initialized, but we'll let the app handle initialization
        // through Redux actions (as per existing pattern)
        // This provider will be ready once the agent is initialized elsewhere
        setIsInitializing(false);
      } catch (err: any) {
        console.error('Error in AgentProvider initialization:', err);
        setError(err.message || 'Failed to initialize agent');
        setIsInitializing(false);
      }
    };

    initializeAgent();
  }, []);

  // Listen for agent initialization from Redux
  useEffect(() => {
    const checkAgent = () => {
      if (agentService.isAgentInitialized()) {
        const agentInstance = agentService.getAgent();
        if (agentInstance && agentInstance !== agent) {
          setAgent(agentInstance);
        }
      }
    };

    // Check periodically for agent initialization
    const interval = setInterval(checkAgent, 1000);
    return () => clearInterval(interval);
  }, [ agent ]);

  // If agent is not available yet, show loading or return children
  // The app will handle initialization through existing Redux flow
  if (isInitializing && !agent) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7E22CE" />
        <Text style={styles.text}>Initializing agent...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  // Only wrap with Credo's AgentProvider when agent is available
  // CredoAgentProvider requires a valid agent instance and cannot accept null/undefined
  if (agent) {
    return (
      <SafeAgentContext.Provider value={{ agent, loading: false }}>
        <CredoAgentProvider agent={agent}>{children}</CredoAgentProvider>
      </SafeAgentContext.Provider>
    );
  }

  // When agent is not available, provide safe context so useAgent() can be called
  return (
    <SafeAgentContext.Provider value={{ agent: null, loading: isInitializing }}>
      {children}
    </SafeAgentContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});

/**
 * Safe wrapper hook for useAgent that works even when CredoAgentProvider is not available
 * This hook can be used instead of useAgent() from @credo-ts/react-hooks
 * 
 * IMPORTANT: Components should import this hook from './features/agent' instead of '@credo-ts/react-hooks'
 * 
 * Strategy: Use the service directly to get the agent. This avoids hook rule violations
 * and works whether CredoAgentProvider is present or not. The service is the source of truth.
 * 
 * We don't use useCredoAgent() hook because we can't conditionally call it, and it throws
 * when CredoAgentProvider is not present. Instead, we use the service which always works.
 */
export const useAgent = () => {
  const safeContext = useContext(SafeAgentContext);

  // Always use the service as the source of truth
  // This works whether CredoAgentProvider is present or not
  const serviceAgent = agentService.isAgentInitialized() ? agentService.getAgent() : null;

  // Return agent from service, with loading state from safeContext
  return {
    agent: serviceAgent || safeContext?.agent || null,
    loading: safeContext?.loading || !serviceAgent,
  };
};

/**
 * Hook to get the agent instance
 * This hook will work once the agent is initialized and provided
 * @deprecated Use useAgent() instead
 */
export const useAgentInstance = () => {
  const { agent } = useAgent();
  return agent;
};

