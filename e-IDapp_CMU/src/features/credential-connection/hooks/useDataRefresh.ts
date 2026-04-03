import { useDispatch, useSelector } from 'react-redux';
import { useAgent } from '../../../features/agent';
import { AppDispatch, RootState } from '../../../store';
import { fetchConnections, fetchCredentials } from '../../../store/slices/credoSlice';

/**
 * Hook to refresh credential and connection data
 * Centralizes data fetching logic for use across the app
 * Only refreshes if agent is initialized
 * Now uses useAgent hook instead of direct service access
 */
export const useDataRefresh = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { agent, loading: agentLoading } = useAgent();
  const { isInitialized, isInitializing } = useSelector((state: RootState) => state.credo);

  const checkAgentReady = (): boolean => {
    // Check agent from hook and Redux initialization state
    return !agentLoading && agent !== null && isInitialized && !isInitializing;
  };

  const refreshData = async () => {
    if (!checkAgentReady()) {
      console.log('Agent not ready, skipping data refresh');
      return;
    }

    try {
      await Promise.all([
        dispatch(fetchConnections()).unwrap(),
        dispatch(fetchCredentials()).unwrap()
      ]);
      console.log('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      // Don't throw - allow UI to continue even if refresh fails
    }
  };

  const refreshConnections = async () => {
    if (!checkAgentReady()) {
      console.log('Agent not ready, skipping connections refresh');
      return;
    }

    try {
      await dispatch(fetchConnections()).unwrap();
      console.log('Connections refreshed successfully');
    } catch (error) {
      console.error('Error refreshing connections:', error);
      // Don't throw - allow UI to continue even if refresh fails
    }
  };

  const refreshCredentials = async () => {
    if (!checkAgentReady()) {
      console.log('Agent not ready, skipping credentials refresh');
      return;
    }

    try {
      await dispatch(fetchCredentials()).unwrap();
      console.log('Credentials refreshed successfully');
    } catch (error) {
      console.error('Error refreshing credentials:', error);
      // Don't throw - allow UI to continue even if refresh fails
    }
  };

  return {
    refreshData,
    refreshConnections,
    refreshCredentials,
    isAgentReady: checkAgentReady()
  };
};

