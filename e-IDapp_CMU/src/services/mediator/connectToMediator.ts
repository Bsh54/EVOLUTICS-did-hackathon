import { credoAgentService } from '../agent';
import { fetchMediatorInvitation } from './fetchMediatorInvitation';
import { saveMediatorConnectionId, loadMediatorConnectionId } from '../../utils/localStorage';

/**
 * Establishes connection with the mediator
 * This function should be called after the agent is initialized
 */
export const connectToMediator = async (): Promise<string | null> => {
  try {
    // 1. Check if agent is initialized
    if (!credoAgentService.isAgentInitialized()) {
      console.error('Agent not initialized. Cannot connect to mediator.');
      throw new Error('Agent must be initialized before connecting to mediator');
    }

    // 2. Check if mediator connection already exists
    const existingConnectionId = await loadMediatorConnectionId();
    if (existingConnectionId) {
      return existingConnectionId;

      // Verify if the existing connection is valid
      // try {
      //   const agent = credoAgentService.getAgent();
      //   if (agent) {
      //     const connection: any = await agent.connections.getById(existingConnectionId);
      //     if (connection && connection.state === 'complete') {
      //       console.log('Existing mediator connection is valid');
      //       return existingConnectionId;
      //     }
      //   }
      // } catch (error) {
      //   console.log('Existing connection not found or invalid, creating new connection');
      // }
    }

    // 3. Mediator invitation URL fetch
    const invitationUrl = await fetchMediatorInvitation();

    // 4. Agent invitation receive
    const agent = credoAgentService.getAgent();
    if (!agent) {
      throw new Error('Agent instance not available');
    }

    const { outOfBandRecord, connectionRecord } = await agent.oob.receiveInvitationFromUrl(
      invitationUrl,
      {
        autoAcceptConnection: true,
        autoAcceptInvitation: true,
      }
    );


    if (!connectionRecord) {
      throw new Error('No connection record created from invitation');
    }

    const completedConnection = await agent.connections.returnWhenIsConnected(
      connectionRecord.id,
      {
        timeoutMs: 30000, // 30 seconds timeout
      }
    );

    // 6. Save connection ID to local storage
    await saveMediatorConnectionId(completedConnection.id);

    return completedConnection.id;
  } catch (error) {
    console.error('❌ Mediator connection failed:', error);
    throw error;
  }
};

/**
 * Checks if mediator connection exists and is complete
 */
export const isMediatorConnected = async (): Promise<boolean> => {
  try {
    const connectionId = await loadMediatorConnectionId();
    if (!connectionId) {
      return false;
    }

    if (!credoAgentService.isAgentInitialized()) {
      return false;
    }

    const agent = credoAgentService.getAgent();
    if (!agent) {
      return false;
    }

    const connection: any = await agent.connections.getById(connectionId);
    return connection.state === 'complete';
  } catch (error) {
    console.error('Error checking mediator connection:', error);
    return false;
  }
};
