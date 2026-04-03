# e-ID Holder App - Architecture Overview

## Executive Summary

The e-ID Holder App is a React Native application that implements a decentralized identity (DID) wallet using Hyperledger Aries/Credo framework. The architecture follows a layered service-oriented pattern with Redux for state management, event-driven updates, and local persistence.

---

## 1. High-Level Architecture

### Core Architecture Pattern
- **Service Layer**: Centralized business logic in service classes
- **State Management**: Redux Toolkit for application state
- **Event-Driven Updates**: Credo event listeners for real-time state synchronization
- **Persistence**: WatermelonDB for local storage + Secure Storage for sensitive data

### Technology Stack
- **Framework**: React Native with TypeScript
- **Identity Framework**: Credo-TS (Hyperledger Aries implementation)
- **Native Libraries**: 
  - `@hyperledger/aries-askar-react-native` (Wallet storage)
  - `@hyperledger/anoncreds-react-native` (Anonymous credentials)
  - `@hyperledger/indy-vdr-react-native` (Indy ledger access)
- **State Management**: Redux Toolkit + Credo Redux Store
- **Database**: WatermelonDB (local persistence)
- **Secure Storage**: React Native Secure Storage

---

## 2. Key Architectural Components

### 2.1 Core Service Layer

#### `CredoAgentService` (`src/services/CredoAgentService.ts`)
**Role**: Central service that wraps and manages the Credo Agent instance.

**Key Responsibilities**:
- Agent initialization and configuration
- Wallet management (Askar-based)
- Module registration (Askar, IndyVDR, AnonCreds, Connections, Credentials, Proofs, DIDs, OutOfBand, MediationRecipient)
- Connection management
- Credential operations
- Proof request handling

**Key Methods**:
- `initialize(config)`: Sets up agent with wallet, modules, and transports
- `acceptInvitation(invitationUrl)`: Processes connection/credential invitations
- `getConnections()`: Retrieves all connections
- `getCredentials()`: Retrieves all credentials
- `acceptCredentialOffer(credentialRecordId)`: Accepts credential offers
- `acceptProofRequest(proofRecordId)`: Accepts proof requests
- `declineProofRequest(proofRecordId)`: Declines proof requests

**Module Registration Order** (Critical):
1. Askar (wallet storage)
2. IndyVDR (ledger access)
3. AnonCreds (credential format)
4. Connections, Credentials, Proofs, DIDs, OutOfBand, MediationRecipient

#### Supporting Services

**`ConnectionService.ts`**:
- Maps Credo `ConnectionRecord` to app `Connection` type
- Handles out-of-band record extraction
- Filters mediator connections
- Declines connections

**`CredentialService.ts`**:
- Retrieves credentials with connection labels
- Matches credentials to connections via threadId, parentThreadId, or timestamp
- Accepts credential offers

**`ProofService.ts`**:
- Retrieves proof requests
- Finds matching credentials for proof requests
- Accepts/declines proof requests

**`CredoEventListener.ts`**:
- Sets up event listeners for credential, proof, and connection state changes
- Auto-processes credential flow (OfferReceived → CredentialReceived → Done)
- Updates Redux store on state changes
- Manages pending credentials cleanup

---

### 2.2 State Management Architecture

#### Redux Store Structure (`src/store/index.ts`)

The store combines:
1. **Custom App State** (`credoSlice`): App-specific state management
2. **Credo Redux Store**: Auto-synced state from Credo agent (agent, connections, credentials, proofs, mediation)

**Store Slices**:
- `credo`: Custom app state (connections, credentials, pending credentials, agent status)
- `user`: User profile data
- `agent`: Credo agent state (auto-synced)
- `connections`: Credo connections state (auto-synced)
- `credentials`: Credo credentials state (auto-synced)
- `proofs`: Credo proofs state (auto-synced)
- `mediation`: Credo mediation state (auto-synced)

#### `credoSlice` State Structure (`src/store/slices/credoSlice.ts`)

```typescript
interface CredoState {
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
    connectionId?: string;
  }>;
}
```

**Key Async Thunks**:
- `initializeAgent`: Initializes the Credo agent
- `fetchConnections`: Retrieves connections from agent
- `acceptInvitation`: Accepts connection invitations
- `fetchCredentials`: Retrieves credentials from agent
- `acceptCredentialOffer`: Accepts credential offers
- `acceptProofRequest`: Accepts proof requests
- `declineProofRequest`: Declines proof requests
- `loadStoredData`: Loads persisted data from local storage

**Optimistic Updates**:
- `pendingCredentials`: Tracks credentials being processed before they appear in agent state
- Automatically cleaned up when matching credentials are found or after timeout

---

### 2.3 Data Flow Architecture

#### Connection Flow
1. **QR Scan** → `ScanQRScreen` scans invitation URL
2. **Invitation Parsing** → `invitationDecoder` extracts type and label
3. **Modal Display** → Appropriate modal shown (`RequestModal`, `RequestCredentialModal`, `ProofRequestModal`, `ZkpRequestModal`)
4. **Acceptance** → Redux thunk `acceptInvitation` called
5. **Service Layer** → `CredoAgentService.acceptInvitation()` processes invitation
6. **Event Listener** → `CredoEventListener` detects connection state change
7. **Redux Update** → `fetchConnections` dispatched, state updated
8. **Persistence** → `saveConnectionsData()` saves to WatermelonDB
9. **UI Update** → Components re-render via Redux selectors

#### Credential Flow
1. **Invitation Received** → Credential offer in invitation or via connection
2. **Event Listener** → `CredoEventListener` detects `CredentialState.OfferReceived`
3. **Auto-Request** → Listener automatically sends credential request
4. **Credential Received** → Listener detects `CredentialState.CredentialReceived`
5. **Auto-Accept** → Listener automatically stores credential
6. **Done State** → Listener detects `CredentialState.Done`
7. **Redux Update** → `fetchCredentials` dispatched, state updated
8. **Pending Cleanup** → Matching pending credentials removed
9. **Persistence** → `saveCredentialsData()` saves to WatermelonDB (excluding `response_attached`)
10. **UI Update** → Components re-render via Redux selectors

#### Proof Request Flow
1. **Proof Request Received** → Via connection or QR scan
2. **Event Listener** → `CredoEventListener` detects `ProofState.RequestReceived`
3. **UI Display** → Proof request shown in modal or detail screen
4. **User Action** → User accepts/declines via UI
5. **Service Layer** → `CredoAgentService.acceptProofRequest()` or `declineProofRequest()`
6. **Credential Matching** → `ProofService.getMatchingCredentialsForProofRequest()` finds matching credentials
7. **Proof Sent** → Credentials selected and proof sent
8. **Event Listener** → Listener detects `ProofState.PresentationSent` → `ProofState.Done`
9. **Redux Update** → Credo Redux store auto-updates
10. **UI Update** → Components re-render via Redux selectors

---

### 2.4 Persistence Architecture

#### Storage Layers

**1. Secure Storage** (`src/utils/secureStorage.ts`):
- Wallet ID and key
- PIN
- Mediator connection ID
- Wallet initialization flags

**2. WatermelonDB** (`src/db/`):
- User profile data (`User` model)
- Connections (`Connection` model)
- Credentials (`Credential` model)

**3. Redux Persistence**:
- Connections and credentials saved to WatermelonDB on Redux state changes
- Loaded on app startup via `loadStoredData` thunk

**Persistence Flow**:
1. Redux action dispatched (e.g., `fetchConnections.fulfilled`)
2. Redux reducer updates state
3. Side effect saves to WatermelonDB (`saveConnectionsData()` or `saveCredentialsData()`)
4. On app restart, `loadStoredData` thunk loads persisted data
5. Redux state hydrated with persisted data

**Data Serialization**:
- Credentials exclude `response_attached` field before saving
- Connection records include out-of-band metadata
- Timestamps converted to ISO strings for storage

---

### 2.5 UI Component Architecture

#### Feature-Based Organization (`src/features/`)

**`credential-connection/`**:
- **Components**: Connection cards, credential cards, proof request cards, lists, modals
- **Hooks**: 
  - `useConnections`: Filters and returns connections
  - `useCredentials`: Transforms credentials for display, handles pending credentials
  - `useProofRequests`: Fetches and formats proof requests from Credo store

**`agent/`**:
- **`AgentProvider.tsx`**: Wraps app with Credo's `AgentProvider`, handles agent initialization
- **`AgentService.ts`**: Exports agent service instance
- **`useAgent()` hook**: Safe hook to access agent instance

**`zkp/`**:
- **`ZkpRequestModal.tsx`**: Modal for zero-knowledge proof requests

#### Screen Components (`src/screens/`)

**Key Screens**:
- `DashboardScreen`: Main dashboard with stats and recent items
- `ScanQRScreen`: QR code scanner for invitations
- `CredentialsScreen`: Full credentials list
- `ProofRequestDetailsScreen`: Proof request details and acceptance
- `ConnectionDetailScreen`: Connection details
- `CredentialDetailScreen`: Credential details

**Navigation Structure**:
- Tab Navigator: Home, Credentials, Scan QR
- Drawer Navigator: Additional screens and settings

---

## 3. State Management Patterns

### 3.1 Dual State Management

The app uses **two parallel state management systems**:

1. **Custom Redux Slice** (`credoSlice`):
   - App-specific state (pending credentials, UI loading states)
   - Manual synchronization with agent
   - Optimistic updates

2. **Credo Redux Store**:
   - Auto-synced with agent state
   - Real-time updates via Credo's internal mechanisms
   - Used for proofs and some connection/credential queries

**Rationale**: 
- Credo store provides real-time updates but may not capture all app-specific state
- Custom slice allows for optimistic updates and pending state tracking
- Both systems complement each other

### 3.2 Event-Driven Updates

**Event Listeners** (`CredoEventListener.ts`):
- Listen to Credo agent events
- Automatically process credential flow
- Dispatch Redux actions on state changes
- Clean up pending credentials

**Benefits**:
- Real-time state synchronization
- Automatic credential processing
- Reduced manual polling

### 3.3 Optimistic Updates

**Pending Credentials**:
- Added immediately when invitation is scanned
- Removed when matching credential is found or after timeout
- Provides immediate UI feedback

**Matching Strategy**:
1. By `connectionId` (most reliable)
2. By `outOfBandId`
3. By timestamp proximity (within 30 seconds)

---

## 4. Key Design Decisions

### 4.1 Module Registration Order
**Critical**: Module registration order matters for dependency injection:
1. Askar → 2. IndyVDR → 3. AnonCreds → 4. Other modules

### 4.2 Auto-Accept vs Manual Accept
- **Connections**: Auto-accept enabled (`autoAcceptConnections: true`)
- **Credentials**: Auto-accept disabled (`autoAcceptCredentials: AutoAcceptCredential.Never`)
  - Event listener handles auto-processing, but UI can intercept
- **Proofs**: Auto-accept disabled (`autoAcceptProofs: AutoAcceptProof.Never`)
  - User must explicitly accept/decline

### 4.3 Mediator Connection
- Mediator connection established automatically on agent initialization
- Mediator connections filtered out from UI displays
- Uses `MediationRecipientModule` with `PickUpV2` strategy

### 4.4 Data Persistence Strategy
- **Redux State**: Ephemeral, synced with agent
- **WatermelonDB**: Persistent storage for connections and credentials
- **Secure Storage**: Sensitive data (wallet keys, PIN)

### 4.5 Error Handling
- Errors caught at service layer and propagated to Redux
- Redux state includes error fields (`connectionsError`, `credentialsError`, `initializationError`)
- UI components handle errors via Redux selectors

---

## 5. Data Flow Diagrams

### 5.1 Agent Initialization Flow
```
App Start
  ↓
useAgentInitialization hook
  ↓
Redux: initializeAgent thunk
  ↓
CredoAgentService.initialize()
  ↓
Load wallet config from Secure Storage
  ↓
Create Agent with modules
  ↓
Register event listeners
  ↓
Agent.initialize()
  ↓
Redux: initializeAgent.fulfilled
  ↓
Agent ready
```

### 5.2 Credential Acceptance Flow
```
QR Scan / Invitation Received
  ↓
CredoEventListener: CredentialState.OfferReceived
  ↓
Auto-send credential request
  ↓
CredoEventListener: CredentialState.CredentialReceived
  ↓
Auto-store credential
  ↓
CredoEventListener: CredentialState.Done
  ↓
Redux: fetchCredentials()
  ↓
Remove matching pending credentials
  ↓
Save to WatermelonDB
  ↓
UI updates via Redux selectors
```

### 5.3 Proof Request Flow
```
Proof Request Received
  ↓
CredoEventListener: ProofState.RequestReceived
  ↓
UI displays proof request modal
  ↓
User accepts
  ↓
Redux: acceptProofRequest thunk
  ↓
CredoAgentService.acceptProofRequest()
  ↓
ProofService.getMatchingCredentialsForProofRequest()
  ↓
Select credentials
  ↓
Send proof
  ↓
CredoEventListener: ProofState.Done
  ↓
Credo Redux store updates
  ↓
UI updates
```

---

## 6. File Structure Summary

```
src/
├── services/              # Core business logic
│   ├── CredoAgentService.ts    # Main agent service
│   ├── ConnectionService.ts    # Connection operations
│   ├── CredentialService.ts    # Credential operations
│   ├── ProofService.ts         # Proof operations
│   ├── CredoEventListener.ts   # Event listeners
│   └── agent.ts                # Service instance export
│
├── store/                 # Redux state management
│   ├── index.ts                # Store configuration
│   └── slices/
│       ├── credoSlice.ts       # App-specific state
│       └── userSlice.ts         # User state
│
├── features/              # Feature modules
│   ├── agent/                  # Agent provider/hooks
│   ├── credential-connection/  # Credential/connection UI
│   └── zkp/                    # Zero-knowledge proofs
│
├── screens/              # Screen components
├── components/          # Reusable UI components
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
│   ├── localStorage.ts         # Persistence utilities
│   └── invitationDecoder.ts    # QR/invitation parsing
└── db/                  # WatermelonDB models
```

---

## 7. Architectural Strengths

1. **Separation of Concerns**: Clear service layer, state management, and UI separation
2. **Event-Driven**: Real-time updates via event listeners
3. **Persistence**: Multi-layer persistence (Secure Storage + WatermelonDB)
4. **Type Safety**: TypeScript throughout
5. **Modularity**: Feature-based organization
6. **Optimistic Updates**: Immediate UI feedback with pending state

---

## 8. Potential Improvements

1. **State Synchronization**: Consider consolidating dual state management systems
2. **Error Recovery**: Add retry mechanisms for failed operations
3. **Offline Support**: Enhance offline credential/connection management
4. **Testing**: Add unit tests for services and integration tests for flows
5. **Documentation**: Add JSDoc comments to public APIs
6. **Performance**: Optimize credential/connection matching algorithms

---

## 9. Dependencies and Integration Points

### External Dependencies
- **Credo-TS**: Core identity framework
- **Hyperledger Libraries**: Native React Native bridges
- **Redux Toolkit**: State management
- **WatermelonDB**: Local database
- **React Navigation**: Navigation

### Integration Points
- **Credo Agent**: Central integration point for all identity operations
- **Redux Store**: State synchronization between app and Credo
- **Event System**: Credo events → Redux actions → UI updates
- **Persistence Layer**: Redux → WatermelonDB → Secure Storage

---

## Conclusion

The e-ID Holder App architecture provides a robust foundation for decentralized identity management. The layered architecture, event-driven updates, and dual state management system enable real-time synchronization while maintaining app-specific state. The persistence layer ensures data durability across app sessions, and the modular structure supports maintainability and extensibility.
