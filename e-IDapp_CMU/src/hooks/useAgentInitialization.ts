import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { initializeAgent, loadStoredData } from '../store/slices/credoSlice';
import { credoAgentService } from '../services/agent';
import { loadUserData } from '../utils/localStorage';

/**
 * Global hook to ensure agent is initialized
 * Automatically initializes agent when:
 * 1. PIN is verified (handled in VerifyPinScreen)
 * 2. Agent becomes uninitialized during app usage
 */
export const useAgentInitialization = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isInitialized, isInitializing } = useSelector((state: RootState) => state.credo);
  const userData = useSelector((state: RootState) => state.user);

  useEffect(() => {
    const ensureAgentInitialized = async () => {
      // Skip if already initializing
      if (isInitializing) {
        console.log('Agent initialization already in progress...');
        return;
      }

      // Check if agent service thinks it's initialized
      const agentServiceInitialized = credoAgentService.isAgentInitialized();

      // If Redux says initialized and service confirms, we're good
      if (isInitialized && agentServiceInitialized) {
        console.log('Agent already initialized');
        return;
      }

      // If not initialized, try to initialize
      if (!isInitialized || !agentServiceInitialized) {
        console.log('Agent not initialized, attempting to initialize...');

        try {
          // Try to get user data and PIN from storage
          const storedUserData = await loadUserData();

          if (!storedUserData || !storedUserData.pin) {
            console.log('User data or PIN not found, cannot initialize agent');
            return;
          }

          // Verify PIN exists and is valid (don't check value, just existence)
          const pin = storedUserData.pin;

          if (!pin || pin.length !== 6) {
            console.log('Invalid PIN format, cannot initialize agent');
            return;
          }

          console.log('Initializing agent with stored user data...');
          await dispatch(initializeAgent({
            label: storedUserData.name || userData.name || 'PolyID Holder',
            pin: pin,
            endpoints: []
          })).unwrap();

          // Load stored connections and credentials after initialization
          await dispatch(loadStoredData()).unwrap();

          console.log('Agent initialized successfully via useAgentInitialization');
        } catch (error) {
          console.error('Error initializing agent in useAgentInitialization:', error);
        }
      }
    };

    // Run check when component mounts or when initialization state changes
    ensureAgentInitialized();
  }, [ isInitialized, isInitializing, dispatch, userData.name ]);

  return {
    isInitialized,
    isInitializing,
  };
};

