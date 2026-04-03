import { createSlice, createAsyncThunk, PayloadAction, current } from '@reduxjs/toolkit';
import { credoAgentService } from '../../services/agent';
import { CredoAgentConfig } from '../../services/CredoAgentService';
import { saveConnectionsData, loadConnectionsData, saveCredentialsData, loadCredentialsData } from '../../utils/localStorage';
import { CredentialExchangeRecord, CredentialState } from '@credo-ts/core';

// Helper function to serialize CredentialExchangeRecord to plain object
const serializeCredentialRecord = (record: CredentialExchangeRecord): any => {
  const attributes: Array<{ name: string; value: string }> = [];
  if (record.credentialAttributes) {
    record.credentialAttributes.forEach(attr => {
      attributes.push({ name: attr.name, value: attr.value });
    });
  }

  // Extract metadata as plain object
  const metadata: any = {};
  try {
    // Convert metadata Map to plain object
    if (record.metadata && typeof record.metadata.get === 'function') {
      // Try to get common metadata values
      const comment = record.metadata.get('comment');
      if (comment) {
        metadata.comment = typeof comment === 'object' && comment !== null ? comment : { comment: comment };
      }

      const indyCredential = record.metadata.get('_internal/indyCredential');
      if (indyCredential) {
        metadata.indyCredential = typeof indyCredential === 'object' && indyCredential !== null ? indyCredential : {};
      }

      // Extract outOfBandId for connection matching when credentials are issued without connection
      const outOfBandId = record.metadata.get('outOfBandId');
      if (outOfBandId) {
        metadata.outOfBandId = outOfBandId;
      }
    }
  } catch (error) {
    console.warn('Error extracting metadata:', error);
  }

  // Extract indy metadata if available
  const indyMetadata = metadata.indyCredential || {};
  const schemaId = indyMetadata?.schemaId;
  const credDefId = indyMetadata?.credentialDefinitionId;

  return {
    id: record.id,
    state: record.state,
    role: record.role,
    connectionId: record.connectionId,
    threadId: record.threadId,
    parentThreadId: record.parentThreadId,
    credentialAttributes: attributes,
    schemaId,
    credDefId,
    comment: metadata.comment?.comment,
    outOfBandId: metadata.outOfBandId,
    createdAt: record.createdAt ? record.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: record.updatedAt ? record.updatedAt.toISOString() : undefined,
    // Exclude non-serializable fields like _tags, metadata Map, etc.
  };
};

// Types
export interface Connection {
  id: string;
  state: string;
  theirLabel?: string;
  createdAt: string;
  theirDid?: string;
  // Out-of-band record data
  outOfBandId?: string;
  outOfBandLabel?: string;
  outOfBandInvitation?: any;
  handshakeProtocols?: string[];
  outOfBandMetadata?: any;
  // Credential attributes from out-of-band (if credential offer was in invitation)
  credentialAttributesFromOOB?: Array<{ name: string; value: string }>;
  // URL parameters from invitation URL
  urlLabel?: string; // Label from URL parameter (&label=...)
  urlType?: string; // Type from URL parameter (&type=...)
}

export interface CredoState {
  // Agent status
  isInitialized: boolean;
  isInitializing: boolean;
  initializationError: string | null;
  agentId: string;
  agentLabel: string;

  // Connections
  connections: Connection[];
  connectionsLoading: boolean;
  connectionsError: string | null;
  lastConnectionUserDetails: null | null;

  // Credentials
  credentials: any[];
  credentialsLoading: boolean;
  credentialsError: string | null;

  // Pending credentials (optimistic updates)
  pendingCredentials: Array<{
    id: string;
    label: string;
    timestamp: string;
    invitationUrl?: string;
    connectionId?: string; // Store connection ID when available for better matching
  }>;
}

const initialState: CredoState = {
  isInitialized: false,
  isInitializing: false,
  initializationError: null,
  agentId: '',
  agentLabel: '',

  connections: [],
  connectionsLoading: false,
  connectionsError: null,
  lastConnectionUserDetails: null,

  credentials: [],
  credentialsLoading: false,
  credentialsError: null,
  pendingCredentials: [],
};

// Async Thunks
export const initializeAgent = createAsyncThunk(
  'credo/initializeAgent',
  async (config: CredoAgentConfig, { rejectWithValue }) => {
    try {
      const result = await credoAgentService.initialize(config);

      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to initialize agent');
    }
  }
);

export const fetchConnections = createAsyncThunk(
  'credo/fetchConnections',
  async (_, { rejectWithValue }) => {
    try {
      // Check if agent is initialized
      if (!credoAgentService.isAgentInitialized()) {
        return rejectWithValue('Agent not initialized. Please wait for initialization to complete.');
      }

      // Check wallet readiness (with timeout to avoid blocking)
      const walletReady = await Promise.race([
        credoAgentService.isWalletReady(),
        new Promise<boolean>(resolve => setTimeout(() => resolve(false), 1000))
      ]);

      if (!walletReady) {
        return rejectWithValue('Wallet is not ready yet. Please try again in a moment.');
      }

      const connections = await credoAgentService.getConnections();
      // Preserve all connection data including out-of-band information
      return connections.map((conn: any) => ({
        id: conn.id,
        state: conn.state,
        theirLabel: conn.theirLabel,
        createdAt: conn.createdAt,
        theirDid: conn.theirDid,
        outOfBandId: conn.outOfBandId,
        outOfBandLabel: conn.outOfBandLabel,
        outOfBandInvitation: conn.outOfBandInvitation,
        handshakeProtocols: conn.handshakeProtocols,
        outOfBandMetadata: conn.outOfBandMetadata,
        credentialAttributesFromOOB: conn.credentialAttributesFromOOB,
        urlLabel: conn.urlLabel,
        urlType: conn.urlType,
      }));
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      // Provide better error message for wallet initialization errors
      if (errorMessage.includes('not been initialized') || errorMessage.includes('Wallet has not been initialized')) {
        return rejectWithValue('Wallet is not ready yet. The retry mechanism will handle this automatically.');
      }
      return rejectWithValue(errorMessage || 'Failed to fetch connections');
    }
  }
);

export const declineConnection = createAsyncThunk(
  'credo/declineConnection',
  async (invitationUrl: string, { rejectWithValue: _rejectWithValue }) => {
    try {
      const result = await credoAgentService.declineConnection(invitationUrl);
      return {
        connection: result,
      };
    } catch (error: any) {
      return _rejectWithValue(error.message || 'Failed to decline connection');
    }
  }
);

export const acceptInvitation = createAsyncThunk(
  'credo/acceptInvitation',
  async (invitationUrl: string, { rejectWithValue: _rejectWithValue }) => {
    try {
      const result = await credoAgentService.acceptInvitation(invitationUrl);
      return {
        connection: result,
      };
    } catch (error: any) {
      return _rejectWithValue(error.message || 'Failed to accept invitation');
    }
  }
);

export const fetchCredentials = createAsyncThunk(
  'credo/fetchCredentials',
  async (_, { rejectWithValue }) => {
    try {
      // Check if agent is initialized
      if (!credoAgentService.isAgentInitialized()) {
        return rejectWithValue('Agent not initialized. Please wait for initialization to complete.');
      }

      // Check wallet readiness (with timeout to avoid blocking)
      const walletReady = await Promise.race([
        credoAgentService.isWalletReady(),
        new Promise<boolean>(resolve => setTimeout(() => resolve(false), 1000))
      ]);

      if (!walletReady) {
        return rejectWithValue('Wallet is not ready yet. Please try again in a moment.');
      }

      const credentialsWithLabels = await credoAgentService.getCredentials();
      // Serialize credential records to plain objects to avoid non-serializable values
      return credentialsWithLabels.map(({ record, connectionLabel }) => {
        const serialized = serializeCredentialRecord(record);
        return {
          ...serialized,
          connectionLabel,
        };
      });
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      // Provide better error message for wallet initialization errors
      if (errorMessage.includes('not been initialized') || errorMessage.includes('Wallet has not been initialized')) {
        return rejectWithValue('Wallet is not ready yet. The retry mechanism will handle this automatically.');
      }
      return rejectWithValue(errorMessage || 'Failed to fetch credentials');
    }
  }
);

export const acceptProofRequest = createAsyncThunk(
  'credo/acceptProofRequest',
  async (proofRecordId: string, { rejectWithValue }) => {
    try {
      await credoAgentService.acceptProofRequest(proofRecordId);
      return proofRecordId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to accept proof request');
    }
  }
);

export const declineProofRequest = createAsyncThunk(
  'credo/declineProofRequest',
  async (proofRecordId: string, { rejectWithValue }) => {
    try {
      await credoAgentService.declineProofRequest(proofRecordId);
      return proofRecordId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to decline proof request');
    }
  }
);

export const acceptCredentialOffer = createAsyncThunk(
  'credo/acceptCredentialOffer',
  async (credentialRecordId: string, { rejectWithValue }) => {
    try {
      const result = await credoAgentService.acceptCredentialOffer(credentialRecordId);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to accept credential offer');
    }
  }
);

export const loadStoredData = createAsyncThunk(
  'credo/loadStoredData',
  async (_, { rejectWithValue }) => {
    try {
      const storedConnections = await loadConnectionsData();
      const storedCredentials = await loadCredentialsData();
      return {
        connections: storedConnections || [],
        credentials: storedCredentials || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load stored data');
    }
  }
);

// Slice
const credoSlice = createSlice({
  name: 'credo',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.initializationError = null;
      state.connectionsError = null;
      state.credentialsError = null;
    },

    addConnection: (state, action: PayloadAction<Connection>) => {
      const existingIndex = state.connections.findIndex(conn => conn.id === action.payload.id);
      if (existingIndex >= 0) {
        state.connections[ existingIndex ] = action.payload;
      } else {
        state.connections.push(action.payload);
      }
      // Save to localStorage
      // Deep clone to ensure no Proxy objects remain
      const serializedConnections = JSON.parse(JSON.stringify(current(state.connections)));
      saveConnectionsData(serializedConnections).catch(error => {
        console.error('Error saving connections:', error);
      });
    },
    updateConnection: (state, action: PayloadAction<{ id: string; updates: Partial<Connection> }>) => {
      const index = state.connections.findIndex(conn => conn.id === action.payload.id);
      if (index >= 0) {
        state.connections[ index ] = { ...state.connections[ index ], ...action.payload.updates };
        // Save to localStorage
        // Deep clone to ensure no Proxy objects remain
        const serializedConnectionsUpdate = JSON.parse(JSON.stringify(current(state.connections)));
        saveConnectionsData(serializedConnectionsUpdate).catch(error => {
          console.error('Error saving connections:', error);
        });
      }
    },
    addCredential: (state, action: PayloadAction<any>) => {
      const existingIndex = state.credentials.findIndex(cred => cred.id === action.payload.id);
      if (existingIndex >= 0) {
        state.credentials[ existingIndex ] = action.payload;
      } else {
        state.credentials.push(action.payload);
      }
      // Save to localStorage (response_attached will be excluded in saveCredentialsData)
      saveCredentialsData(current(state.credentials)).catch(error => console.error('Error saving credentials:', error));
    },
    updateCredential: (state, action: PayloadAction<{ id: string; updates: any }>) => {
      const index = state.credentials.findIndex(cred => cred.id === action.payload.id);
      if (index >= 0) {
        state.credentials[ index ] = { ...state.credentials[ index ], ...action.payload.updates };
        // Save to localStorage
        saveCredentialsData(current(state.credentials)).catch(error => console.error('Error saving credentials:', error));
      }
    },
    addPendingCredential: (state, action: PayloadAction<{ id: string; label: string; invitationUrl?: string; connectionId?: string }>) => {
      const existingIndex = state.pendingCredentials.findIndex(p => p.id === action.payload.id);
      if (existingIndex >= 0) {
        state.pendingCredentials[ existingIndex ] = {
          ...action.payload,
          timestamp: new Date().toISOString(),
        };
      } else {
        state.pendingCredentials.push({
          ...action.payload,
          timestamp: new Date().toISOString(),
        });
      }
    },
    updatePendingCredential: (state, action: PayloadAction<{ id: string; connectionId?: string }>) => {
      const index = state.pendingCredentials.findIndex(p => p.id === action.payload.id);
      if (index >= 0) {
        state.pendingCredentials[ index ] = {
          ...state.pendingCredentials[ index ],
          connectionId: action.payload.connectionId,
        };
      }
    },
    removePendingCredential: (state, action: PayloadAction<string>) => {
      state.pendingCredentials = state.pendingCredentials.filter(p => p.id !== action.payload);
    },
    clearPendingCredentials: (state) => {
      state.pendingCredentials = [];
    },
    cleanupOldPendingCredentials: (state) => {
      // Remove pending credentials older than 5 minutes (they should have completed by then)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      state.pendingCredentials = state.pendingCredentials.filter(
        p => p.timestamp > fiveMinutesAgo
      );
    },

  },
  extraReducers: (builder) => {
    // Initialize Agent
    builder
      .addCase(initializeAgent.pending, (state) => {
        state.isInitializing = true;
        state.initializationError = null;
      })
      .addCase(initializeAgent.fulfilled, (state, action) => {
        state.isInitializing = false;
        state.isInitialized = true;
        state.initializationError = null;
        state.agentId = action.payload.agentId || '';
        state.agentLabel = action.payload.agentLabel || '';
      })
      .addCase(initializeAgent.rejected, (state, action) => {
        state.isInitializing = false;
        state.isInitialized = false;
        state.initializationError = action.payload as string;
      });

    // Fetch Connections
    builder
      .addCase(fetchConnections.pending, (state) => {
        state.connectionsLoading = true;
        state.connectionsError = null;
      })
      .addCase(fetchConnections.fulfilled, (state, action) => {
        state.connectionsLoading = false;
        state.connections = action.payload;
        state.connectionsError = null;
        // Save to localStorage
        // Deep clone to ensure no Proxy objects remain
        const serializedFetchedConnections = JSON.parse(JSON.stringify(action.payload));
        saveConnectionsData(serializedFetchedConnections).catch(error => {
          console.error('Error saving connections:', error);
        });
      })
      .addCase(fetchConnections.rejected, (state, action) => {
        state.connectionsLoading = false;
        state.connectionsError = action.payload as string;
      });

    // Accept Invitation
    builder
      .addCase(acceptInvitation.pending, (state) => {
        state.connectionsLoading = true;
        state.connectionsError = null;
      })
      .addCase(acceptInvitation.fulfilled, (state, action) => {
        state.connectionsLoading = false;
        state.connectionsError = null;

        // Add connection to connections list if it doesn't exist
        const connection = (action.payload as any).connection;
        if (connection) {
          const existingIndex = state.connections.findIndex(conn => conn.id === connection.id);
          if (existingIndex >= 0) {
            // Update existing connection
            state.connections[ existingIndex ] = connection;
          } else {
            // Add new connection
            state.connections.push(connection);
          }
          // Save to localStorage
          // Deep clone to ensure no Proxy objects remain
          const serializedInvitationConnections = JSON.parse(JSON.stringify(current(state.connections)));
          saveConnectionsData(serializedInvitationConnections).catch(error => console.error('Error saving connections:', error));

          // Update pending credentials with connectionId for better matching
          // Find pending credentials that match this connection by invitation URL or timestamp
          const connectionTime = new Date(connection.createdAt).getTime();
          state.pendingCredentials.forEach((pending, index) => {
            const pendingTime = new Date(pending.timestamp).getTime();
            const timeDiff = Math.abs(connectionTime - pendingTime);
            // If connection was created within 10 seconds of pending, likely a match
            if (timeDiff < 10000 && !pending.connectionId) {
              state.pendingCredentials[ index ] = {
                ...pending,
                connectionId: connection.id,
              };
            }
          });
        }
      })
      .addCase(acceptInvitation.rejected, (state, action) => {
        state.connectionsLoading = false;
        state.connectionsError = action.payload as string;
      });

    // Fetch Credentials
    builder
      .addCase(fetchCredentials.pending, (state) => {
        state.credentialsLoading = true;
        state.credentialsError = null;
      })
      .addCase(fetchCredentials.fulfilled, (state, action) => {
        state.credentialsLoading = false;
        state.credentials = action.payload;
        state.credentialsError = null;
        // Save to localStorage (response_attached will be excluded in saveCredentialsData)
        saveCredentialsData(action.payload).catch(error => console.error('Error saving credentials:', error));

        // Remove pending credentials that match newly fetched credentials
        const now = Date.now();
        const credentials = action.payload;

        state.pendingCredentials = state.pendingCredentials.filter((pending: any) => {
          const pendingTime = new Date(pending.timestamp).getTime();
          const age = now - pendingTime;

          // Remove if older than 5 minutes
          if (age > 5 * 60 * 1000) {
            console.log('🗑️ Removing old pending credential:', pending.id, 'age:', Math.round(age / 1000), 's');
            return false;
          }

          // Check if any credential matches this pending by connectionId
          if (pending.connectionId) {
            const matchingCred = credentials.find((cred: any) => {
              const credState = cred.state || cred.credential?.state;
              // CredentialState.Done is typically 'Done' as a string
              const isDone = credState === 'Done' || credState === CredentialState.Done || credState === 'done';
              return cred.connectionId === pending.connectionId && isDone;
            });
            if (matchingCred) {
              console.log('✅ Removing pending credential:', pending.id, 'matched by connectionId in fetched credentials');
              return false;
            }
          }

          // Check if any credential was created around the same time as pending
          const matchingCredByTime = credentials.find((cred: any) => {
            const credState = cred.state || cred.credential?.state;
            const isDone = credState === 'Done' || credState === CredentialState.Done || credState === 'done';
            if (!isDone) return false;
            const credTime = new Date(cred.createdAt || cred.credential?.createdAt || 0).getTime();
            const timeDiff = Math.abs(credTime - pendingTime);
            return timeDiff < 30000; // Within 30 seconds
          });

          if (matchingCredByTime) {
            console.log('✅ Removing pending credential:', pending.id, 'matched by timestamp in fetched credentials');
            return false;
          }

          return true; // Keep this pending credential
        });
      })
      .addCase(fetchCredentials.rejected, (state, action) => {
        state.credentialsLoading = false;
        state.credentialsError = action.payload as string;
      });

    // Accept Proof Request
    builder
      .addCase(acceptProofRequest.pending, (state) => {
        // Can add loading state here if needed
      })
      .addCase(acceptProofRequest.fulfilled, (state, action) => {
        console.log('✅ Proof request accepted successfully:', action.payload);
        // The Credo Redux store will handle the actual proof state updates
        // This is just for any app-specific logic if needed
      })
      .addCase(acceptProofRequest.rejected, (state, action) => {
        console.error('❌ Failed to accept proof request:', action.payload);
      });

    // Decline Proof Request  
    builder
      .addCase(declineProofRequest.pending, (state) => {
        // Can add loading state here if needed
      })
      .addCase(declineProofRequest.fulfilled, (state, action) => {
        console.log('✅ Proof request declined successfully:', action.payload);
        // The Credo Redux store will handle the actual proof state updates
      })
      .addCase(declineProofRequest.rejected, (state, action) => {
        console.error('❌ Failed to decline proof request:', action.payload);
      });

    // Load Stored Data
    builder
      .addCase(loadStoredData.fulfilled, (state, action) => {
        if (action.payload.connections && action.payload.connections.length > 0) {
          state.connections = action.payload.connections;
        }
        if (action.payload.credentials && action.payload.credentials.length > 0) {
          state.credentials = action.payload.credentials;
        }
      });
  },
});

export const {
  clearErrors,
  addConnection,
  updateConnection,
  addCredential,
  updateCredential,
  addPendingCredential,
  updatePendingCredential,
  removePendingCredential,
  clearPendingCredentials,
  cleanupOldPendingCredentials,
} = credoSlice.actions;

export default credoSlice.reducer;