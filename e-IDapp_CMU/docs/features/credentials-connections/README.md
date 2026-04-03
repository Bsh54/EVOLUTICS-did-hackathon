# Listing Features Implementation Documentation

## Overview

This document describes the implementation of dynamic listing features for credentials and connections in the Polyversity Wallet application. The implementation enables persistent storage, dynamic data fetching, and real-time updates for both credentials and connections.

## Implementation Date

December 2024

## Changes Summary

The implementation adds the following capabilities:
1. Dynamic credential and connection counts in the dashboard
2. Persistent storage for connections and credentials in local storage
3. Automatic synchronization between Redux state and local storage
4. Dynamic data display in credential and connection screens
5. Exclusion of `response_attached` field from credential storage

---

## 1. Dashboard Screen Updates

### File: `src/screens/DashboardScreen.tsx`

### Changes Made:
- Replaced hardcoded stat values with dynamic counts from Redux store
- Changed "Work" stat card to "Connections" displaying connection count
- Changed "Credentials" stat card to display actual credential count
- Added automatic data fetching on component mount

### Key Implementation:

```typescript
// Added Redux selectors
const { connections, credentials } = useSelector((state: RootState) => state.credo);

// Added data fetching on mount
useEffect(() => {
  const fetchData = async () => {
    try {
      dispatch(fetchConnections());
      dispatch(fetchCredentials());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  fetchData();
}, [dispatch]);
```

### Stat Cards Updated:
- **Credentials Card**: Now displays `{credentials.length}` instead of hardcoded `12`
- **Connections Card**: Replaced "Work" stat with "Connections" displaying `{connections.length}` instead of hardcoded `5`
- Icon changed from `work` to `people` for connections

---

## 2. Local Storage Implementation

### File: `src/utils/localStorage.ts`

### New Storage Keys:
```typescript
CONNECTIONS_DATA: 'polyid_connections_data',
CREDENTIALS_DATA: 'polyid_credentials_data',
```

### New Functions Added:

#### `saveConnectionsData(connections: any[]): Promise<void>`
- Saves connections array to AsyncStorage
- Serializes data as JSON before storage
- Handles errors gracefully

#### `loadConnectionsData(): Promise<any[] | null>`
- Loads connections array from AsyncStorage
- Deserializes JSON data
- Returns null if no data exists or on error

#### `saveCredentialsData(credentials: any[]): Promise<void>`
- **Important**: Excludes `response_attached` field from each credential before saving
- Uses destructuring to remove the field: `const { response_attached, ...rest } = cred`
- Saves cleaned credentials array to AsyncStorage
- Prevents storage of unnecessary response data

#### `loadCredentialsData(): Promise<any[] | null>`
- Loads credentials array from AsyncStorage
- Deserializes JSON data
- Returns null if no data exists or on error

### Updated Functions:

#### `clearStoredData(): Promise<void>`
- Now includes `CONNECTIONS_DATA` and `CREDENTIALS_DATA` in the cleanup
- Ensures complete data wipe on logout/reset

---

## 3. Redux Store Integration

### File: `src/store/slices/credoSlice.ts`

### New Async Thunks:

#### `fetchCredentials`
```typescript
export const fetchCredentials = createAsyncThunk(
  'credo/fetchCredentials',
  async (_, { rejectWithValue }) => {
    try {
      const credentials = await credoAgentService.getCredentials();
      return credentials;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch credentials');
    }
  }
);
```

#### `loadStoredData`
```typescript
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
```

### New Reducers:

#### `addCredential`
- Adds or updates a credential in the state
- Automatically saves to localStorage (excluding `response_attached`)
- Handles duplicate IDs by updating existing entries

#### `updateCredential`
- Updates an existing credential
- Automatically saves to localStorage
- Only updates if credential exists

### Updated Reducers:

#### `addConnection` & `updateConnection`
- Now automatically save to localStorage after state updates
- Ensures persistence across app sessions

### Extra Reducers Updates:

#### `fetchConnections.fulfilled`
- Automatically saves fetched connections to localStorage
- Ensures data persistence

#### `fetchCredentials.fulfilled`
- Automatically saves fetched credentials to localStorage
- Excludes `response_attached` field via `saveCredentialsData` function

#### `acceptInvitation.fulfilled`
- Automatically saves updated connections list to localStorage
- Maintains data consistency

#### `loadStoredData.fulfilled`
- Populates Redux state with stored data on initialization
- Only loads if stored data exists

---

## 4. CredoAgentService Updates

### File: `src/services/CredoAgentService.ts`

### New Method:

#### `getCredentials(): Promise<CredentialExchangeRecord[]>`
```typescript
async getCredentials(): Promise<CredentialExchangeRecord[]> {
  if (!this.agent) throw new Error('Agent not initialized');
  try {
    const credentialRecords = await this.agent.credentials.getAll();
    return credentialRecords;
  } catch (error) {
    console.log('Error getting credentials:', error);
    return [];
  }
}
```

- Fetches all credentials from the Aries agent
- Returns empty array on error
- Used by Redux thunk to populate credential list

---

## 5. Credentials Screen Updates

### File: `src/screens/CredentialsScreen.tsx`

### Changes Made:
- Replaced dummy data (`credentialsDataByCategory`) with Redux store data
- Added credential fetching on component mount
- Implemented data mapping from credential records to display format
- Enhanced search functionality to work with real data

### Data Mapping:
```typescript
const mappedCredentials = credentials.map((cred: any) => {
  const attributes = cred.credentialAttributes || [];
  const title = attributes.find((attr: any) => attr.name === 'name')?.value || 
               attributes.find((attr: any) => attr.name === 'title')?.value ||
               cred.id || 'Credential';
  const subtitle = attributes.find((attr: any) => attr.name === 'issuer')?.value ||
                  cred.connectionId || 'Unknown Issuer';
  const date = cred.createdAt ? new Date(cred.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
  
  return {
    id: cred.id,
    title,
    subtitle,
    date,
    iconName: 'verified',
    iconColor: '#10B981',
    iconBg: '#10B981',
    credential: cred, // Keep full credential object for detail view
  };
});
```

### Features:
- Extracts meaningful information from credential attributes
- Falls back to credential ID if attributes not available
- Formats dates in readable format (e.g., "9 Feb")
- Preserves full credential object for detail navigation

---

## 6. All Credentials List Screen Updates

### File: `src/screens/AllCredentialsListScreen.tsx`

### Changes Made:
- Replaced dummy data (`connectionsDataByStatus`) with Redux store data
- Added connection fetching on component mount
- Implemented status-based filtering (New Requests vs Accepted)
- Enhanced search functionality

### Data Mapping:
```typescript
const mappedConnections = connections.map((conn: any) => {
  const createdAt = conn.createdAt ? new Date(conn.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
  const isNewRequest = conn.state === 'invitation-sent' || conn.state === 'request-sent' || conn.state === 'response-sent';
  
  return {
    id: conn.id,
    title: conn.theirLabel || 'Unknown',
    subtitle: isNewRequest ? 'Wants to send you a connection request' : 'Connection established successfully',
    date: createdAt,
    avatar: require('../assets/credentials/avatar.png'),
    status: isNewRequest ? 'new' : 'accepted',
    isOnline: false,
    connection: conn, // Keep full connection object
  };
});
```

### Status Filtering:
- **New Requests**: Connections with states `invitation-sent`, `request-sent`, or `response-sent`
- **Accepted**: Connections with completed states
- Dynamic filtering based on connection state

---

## 7. Credential Acceptance Integration

### Files Updated:
- `src/components/AcceptCredentialModal.tsx`
- `src/screens/CredentialRequestDetailScreen.tsx`

### Changes Made:
Both components now fetch credentials after successful acceptance to update Redux store and localStorage.

### Implementation:
```typescript
await credoAgentService.acceptCredentialOffer(credentialOffer.id);

// Wait a bit for credential to be fully processed
await new Promise(resolve => setTimeout(resolve, 1000));

// Fetch updated credentials to update Redux store and localStorage
await dispatch(fetchCredentials()).unwrap();
```

### Benefits:
- Immediate UI updates after credential acceptance
- Automatic persistence to localStorage
- Consistent state across the application

---

## 8. Agent Initialization Hook Updates

### File: `src/hooks/useAgentInitialization.ts`

### Changes Made:
- Added `loadStoredData` dispatch after agent initialization
- Ensures stored data is loaded into Redux state on app startup

### Implementation:
```typescript
await dispatch(initializeAgent({
  label: storedUserData.name || userData.name || 'PolyID Holder',
  pin: pin,
  endpoints: []
})).unwrap();

// Load stored connections and credentials after initialization
await dispatch(loadStoredData()).unwrap();
```

---

## Data Flow

### Initialization Flow:
1. App starts → `useAgentInitialization` hook runs
2. Agent initializes → `initializeAgent` thunk completes
3. Stored data loads → `loadStoredData` thunk populates Redux state
4. UI renders → Components display data from Redux store

### Credential Acceptance Flow:
1. User accepts credential → `acceptCredentialOffer` called
2. Credential processed → Agent stores credential
3. Redux updates → `fetchCredentials` thunk fetches updated list
4. LocalStorage saves → `saveCredentialsData` persists data (excluding `response_attached`)
5. UI updates → Components re-render with new data

### Connection Acceptance Flow:
1. User accepts invitation → `acceptInvitation` thunk called
2. Connection created → Agent creates connection record
3. Redux updates → Connection added to state
4. LocalStorage saves → `saveConnectionsData` persists data
5. UI updates → Components re-render with new connection

---

## Key Design Decisions

### 1. Exclusion of `response_attached`
- **Decision**: Exclude `response_attached` field from credential storage
- **Reason**: This field contains temporary response data that is not needed for persistence
- **Implementation**: Destructuring in `saveCredentialsData` function removes the field before serialization

### 2. Automatic Persistence
- **Decision**: Automatically save to localStorage on every state update
- **Reason**: Ensures data is always persisted without manual intervention
- **Implementation**: Reducers call storage functions after state updates

### 3. Data Loading on Initialization
- **Decision**: Load stored data after agent initialization
- **Reason**: Provides immediate data availability without waiting for network calls
- **Implementation**: `loadStoredData` thunk called in `useAgentInitialization` hook

### 4. Separate Fetching from Storage
- **Decision**: Fetch from agent and save separately
- **Reason**: Allows for fresh data fetching while maintaining persistence
- **Implementation**: `fetchCredentials` and `fetchConnections` thunks fetch and save independently

---

## Testing Considerations

### Areas to Test:
1. **Dashboard Counts**: Verify counts match actual credentials/connections
2. **Persistence**: Close and reopen app to verify data persists
3. **Credential Acceptance**: Accept credential and verify it appears in lists
4. **Connection Acceptance**: Accept invitation and verify connection appears
5. **Search Functionality**: Test search with real data
6. **Status Filtering**: Verify connections filter correctly by status
7. **Data Exclusion**: Verify `response_attached` is not stored

### Edge Cases:
- Empty lists (no credentials/connections)
- Network errors during fetching
- Storage errors during saving
- Invalid credential/connection data
- Missing credential attributes

---

## Migration Notes

### For Existing Users:
- Existing data will be loaded from localStorage if available
- New data structure will be created on first fetch
- No data loss expected during migration

### Storage Keys:
- New keys: `polyid_connections_data`, `polyid_credentials_data`
- Old keys remain unchanged
- Clear data function updated to include new keys

---

## Future Enhancements

### Potential Improvements:
1. **Incremental Updates**: Only fetch changed credentials/connections
2. **Offline Support**: Better handling of offline scenarios
3. **Data Validation**: Validate stored data before loading
4. **Compression**: Compress large credential/connection lists
5. **Encryption**: Encrypt sensitive credential data
6. **Sync Strategy**: Implement sync strategy for multiple devices

---

## Files Modified

1. `src/screens/DashboardScreen.tsx` - Dynamic counts and data fetching
2. `src/utils/localStorage.ts` - Storage functions for connections and credentials
3. `src/store/slices/credoSlice.ts` - Redux integration and persistence
4. `src/services/CredoAgentService.ts` - Added `getCredentials` method
5. `src/screens/CredentialsScreen.tsx` - Dynamic credential display
6. `src/screens/AllCredentialsListScreen.tsx` - Dynamic connection display
7. `src/components/AcceptCredentialModal.tsx` - Post-acceptance data fetching
8. `src/screens/CredentialRequestDetailScreen.tsx` - Post-acceptance data fetching
9. `src/hooks/useAgentInitialization.ts` - Stored data loading

---

## Redux Serialization Fix

### Issue
Redux Toolkit was warning about non-serializable values in credential records. `CredentialExchangeRecord` objects contain non-serializable data like:
- Date objects (`createdAt`, `updatedAt`)
- Map objects (`metadata`)
- Complex objects (`_tags`)

### Solution

#### File: `src/store/slices/credoSlice.ts`

Added a `serializeCredentialRecord` helper function that converts `CredentialExchangeRecord` objects to plain serializable JavaScript objects:

```typescript
const serializeCredentialRecord = (record: CredentialExchangeRecord): any => {
  // Extract credential attributes
  const attributes: Array<{ name: string; value: string }> = [];
  if (record.credentialAttributes) {
    record.credentialAttributes.forEach(attr => {
      attributes.push({ name: attr.name, value: attr.value });
    });
  }

  // Extract metadata as plain object
  const metadata: any = {};
  // Convert metadata Map to plain object
  // Extract comment and indyCredential metadata
  
  // Convert Date objects to ISO strings
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
    createdAt: record.createdAt ? record.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: record.updatedAt ? record.updatedAt.toISOString() : undefined,
  };
};
```

#### Updated `fetchCredentials` Thunk:
```typescript
export const fetchCredentials = createAsyncThunk(
  'credo/fetchCredentials',
  async (_, { rejectWithValue }) => {
    try {
      const credentials = await credoAgentService.getCredentials();
      // Serialize credential records to plain objects
      return credentials.map(serializeCredentialRecord);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch credentials');
    }
  }
);
```

#### File: `src/store/index.ts`

Added middleware configuration to suppress serialization warnings as a safety measure:

```typescript
middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: ['credo/fetchCredentials/fulfilled', 'credo/fetchConnections/fulfilled'],
      ignoredActionPaths: ['payload.0._tags', 'payload.0.metadata'],
      ignoredPaths: ['credo.credentials.0._tags', 'credo.credentials.0.metadata'],
    },
  }),
```

### Benefits:
- Eliminates Redux serialization warnings
- Ensures all stored data is JSON-serializable
- Maintains compatibility with Redux DevTools
- Enables proper state persistence and time-travel debugging

---

---

## Tabbed Interface and Navigation Enhancements

### Overview
Enhanced the DashboardScreen with a tabbed interface and improved navigation flow, allowing users to seamlessly navigate between credentials and connections, view full lists, and access detailed information for each item.

### Implementation Date
December 2024

---

## 9. Dashboard Tabbed Interface

### File: `src/screens/DashboardScreen.tsx`

### Changes Made:
- Implemented a tabbed interface with two tabs: "Credentials" and "Connections"
- Added dynamic tab state management using `useState`
- Filtered out mediator connections from the display
- Enhanced UX with status badges, improved layouts, and empty states

### Key Implementation:

#### Tab State Management:
```typescript
const [activeTab, setActiveTab] = useState<'credentials' | 'connections'>('credentials');

// Filter out mediator connections
const filteredConnections = useMemo(() => {
  return connections.filter((conn: any) => {
    const label = conn.theirLabel || '';
    return !label.toLowerCase().includes('mediator-invite');
  });
}, [connections]);
```

#### Tab Header UI:
```typescript
<View style={styles.tabHeader}>
  <TouchableOpacity
    style={[styles.tabButton, {
      backgroundColor: activeTab === 'credentials' ? '#7C3AED' : '#F3F4F6',
    }]}
    onPress={() => setActiveTab('credentials')}
  >
    <MaterialIcons name="description" />
    <Text>Credentials ({credentials.length})</Text>
  </TouchableOpacity>
  
  <TouchableOpacity
    style={[styles.tabButton, {
      backgroundColor: activeTab === 'connections' ? '#7C3AED' : '#F3F4F6',
    }]}
    onPress={() => setActiveTab('connections')}
  >
    <MaterialIcons name="people" />
    <Text>Connections ({filteredConnections.length})</Text>
  </TouchableOpacity>
</View>
```

### Features:
- **Dynamic Counts**: Tab buttons show real-time counts of credentials and connections
- **Visual Feedback**: Active tab highlighted in purple with white text
- **Filtered Connections**: Automatically excludes mediator connections from display
- **Empty States**: User-friendly empty states with actionable buttons
- **Status Badges**: Visual indicators for credential and connection status

---

## 10. Navigation Flow Enhancements

### Overview
Implemented comprehensive navigation flow where:
1. Clicking items in dashboard tabs navigates to detail pages
2. "View All" buttons navigate to full list screens
3. Clicking items in list screens navigates to detail pages
4. Detail pages display full dynamic information

### Files Modified:

#### `src/screens/DashboardScreen.tsx`
- **Credential Items**: Navigate to `CredentialDetail` screen with credential data
- **Connection Items**: Navigate to `ConnectionDetail` screen with connection data
- **View All Buttons**: Navigate to `Credentials` tab and `AllCredentialsListScreen`

#### `src/screens/AllCredentialsListScreen.tsx`
- **Connection Cards**: Entire card is clickable and navigates to `ConnectionDetail`
- **View Details Buttons**: Navigate to `ConnectionDetail` with connection data

#### `src/screens/CredentialsScreen.tsx`
- Already navigates to `CredentialDetail` when items are clicked

---

## 11. ConnectionDetailScreen Implementation

### File: `src/screens/ConnectionDetailScreen.tsx` (New)

### Purpose:
Displays comprehensive details for a single connection, including connection information, status, dates, and metadata.

### Key Features:

#### Dynamic Data Display:
```typescript
const route = useRoute<ConnectionDetailRouteProp>();
const { connection } = route.params;

const displayName = connection?.theirLabel || 'Unknown Connection';
const connectionId = connection?.id || 'N/A';
const theirDid = connection?.theirDid || 'N/A';
const isCompleted = connection?.state === 'completed';
```

#### Information Sections:
1. **Header Section**:
   - Connection avatar with status-based color (green for active, orange for pending)
   - Connection name
   - Status badge

2. **Connection Information Section**:
   - Connection ID
   - Their DID
   - Status
   - Created date

3. **Last Updated Section**:
   - Shows when connection was last updated (if available)

### UI Components:
- Gradient header matching app theme
- Scrollable content area
- Information cards with clear labels and values
- Status badges with color coding
- Responsive design with scaling

---

## 12. CredentialDetailScreen Dynamic Data Integration

### File: `src/screens/CredentialDetailScreen.tsx`

### Changes Made:
- Replaced static data with dynamic data from route params
- Added dynamic attribute rendering
- Implemented state-based UI changes
- Added helper function for attribute icons

### Key Implementation:

#### Route Parameter Extraction:
```typescript
const route = useRoute<CredentialDetailRouteProp>();
const { credential } = route.params || {};

const attributes = credential?.credentialAttributes || [];
const credentialTitle = attributes.find((attr: any) => attr.name === 'name')?.value || 
                       attributes.find((attr: any) => attr.name === 'title')?.value ||
                       credential?.schemaId?.split(':')[2] ||
                       credential?.id || 'Credential';
```

#### Dynamic Attribute Rendering:
```typescript
{attributes.map((attr: any, index: number) => (
  <View key={index} style={styles.attributeRow}>
    <View style={styles.attributeBoxLarge}>
      <Text style={styles.attributeLabel}>
        {attr.name?.toUpperCase() || 'ATTRIBUTE'}
      </Text>
      <Text style={styles.attributeValue}>
        {attr.value || 'N/A'}
      </Text>
    </View>
    <MaterialIcons 
      name={getAttributeIcon(attr.name)} 
      size={24} 
      color="#9CA3AF" 
    />
  </View>
))}
```

#### State-Based UI:
- **Pending Credentials**: Red gradient, "Accept/Decline" buttons shown
- **Completed Credentials**: Green gradient, no action buttons
- **Empty Attributes**: Shows helpful message when no attributes available

#### Attribute Icon Helper:
```typescript
const getAttributeIcon = (name: string): string => {
  const lowerName = name?.toLowerCase() || '';
  if (lowerName.includes('name')) return 'person';
  if (lowerName.includes('event')) return 'event';
  if (lowerName.includes('date')) return 'calendar-today';
  if (lowerName.includes('email')) return 'email';
  // ... more mappings
  return 'info';
};
```

---

## 13. Navigation Stack Updates

### File: `src/navigation/AppNavigator.tsx`

### Changes Made:
- Added `ConnectionDetail` route to navigation stack
- Imported `ConnectionDetailScreen` component
- Updated `RootStackParamList` type definition

### Implementation:
```typescript
export type RootStackParamList = {
  // ... existing routes
  CredentialDetail: { credential: any };
  CredentialRequestDetail: { credentialOffer: any };
  ConnectionDetail: { connection: any }; // New
};

// In Stack Navigator:
<Stack.Screen name="ConnectionDetail" component={ConnectionDetailScreen} />
```

---

## Navigation Flow Diagram

### Dashboard → Detail Flow:
```
DashboardScreen (Tabbed)
├── Credentials Tab
│   ├── Click Credential Item → CredentialDetailScreen
│   └── Click "View All" → CredentialsScreen (Full List)
│
└── Connections Tab
    ├── Click Connection Item → ConnectionDetailScreen
    └── Click "View All" → AllCredentialsListScreen (Full List)
```

### List → Detail Flow:
```
CredentialsScreen
└── Click Credential Item → CredentialDetailScreen

AllCredentialsListScreen
├── Click Connection Card → ConnectionDetailScreen
└── Click "View Details" Button → ConnectionDetailScreen
```

---

## UX Improvements Summary

### Visual Enhancements:
1. **Status Badges**: Color-coded badges for pending/active states
2. **Empty States**: Informative empty states with action buttons
3. **Touch Feedback**: `activeOpacity` for better user feedback
4. **Icons**: Contextual icons based on attribute types
5. **Color Coding**: 
   - Green for active/completed items
   - Orange/Amber for pending items
   - Purple for primary actions

### Information Display:
1. **Credential Details**:
   - Dynamic title extraction from attributes
   - All credential attributes displayed
   - Issuer information
   - Status and dates
   - Schema ID (if available)

2. **Connection Details**:
   - Connection name/label
   - Connection ID
   - Their DID
   - Status
   - Creation and update dates

### Navigation Improvements:
1. **Intuitive Flow**: Clicking items always goes to detail pages
2. **Consistent Behavior**: Same navigation pattern across all screens
3. **Data Passing**: Full objects passed to detail screens for complete information
4. **Back Navigation**: Proper back button handling

---

## Files Modified Summary

### New Files:
1. `src/screens/ConnectionDetailScreen.tsx` - New detail screen for connections

### Modified Files:
1. `src/screens/DashboardScreen.tsx` - Tabbed interface and navigation updates
2. `src/screens/CredentialDetailScreen.tsx` - Dynamic data integration
3. `src/screens/AllCredentialsListScreen.tsx` - Navigation to detail pages
4. `src/navigation/AppNavigator.tsx` - Added ConnectionDetail route

---

## Testing Considerations

### Areas to Test:
1. **Tab Switching**: Verify tabs switch correctly and show correct data
2. **Navigation**: Test all navigation paths (dashboard → detail, list → detail)
3. **Data Display**: Verify detail screens show correct dynamic data
4. **Empty States**: Test behavior when no credentials/connections exist
5. **Filtering**: Verify mediator connections are filtered correctly
6. **Status Display**: Check status badges show correct colors and text

### Edge Cases:
- Empty credential attributes
- Missing connection labels
- Invalid dates
- Very long attribute values
- Multiple pending credentials/connections

---

## Conclusion

The listing features implementation provides a robust foundation for displaying and managing credentials and connections in the Polyversity Wallet. The implementation ensures data persistence, real-time updates, and a seamless user experience while maintaining data integrity by excluding unnecessary fields like `response_attached` and properly serializing all data for Redux compatibility.

The addition of the tabbed interface and comprehensive navigation flow enhances the user experience by providing:
- **Quick Access**: Tabbed interface for easy switching between credentials and connections
- **Detailed Views**: Full detail screens for both credentials and connections
- **Intuitive Navigation**: Consistent navigation patterns throughout the app
- **Dynamic Data**: All screens display real-time data from Redux/localStorage
- **Better UX**: Status indicators, empty states, and visual feedback improve usability

The implementation follows React Native best practices and maintains consistency with the existing codebase architecture.

---

## Out-of-Band Record Data Capture

### Overview
Enhanced the connection and credential handling to capture and store comprehensive data from out-of-band records, including invitation details, handshake protocols, metadata, and credential attributes when available.

### Implementation Date
December 2024

---

## 14. Out-of-Band Record Data Extraction

### File: `src/services/CredoAgentService.ts`

### Changes Made:
- Enhanced `Connection` interface to include out-of-band record fields
- Added comprehensive logging of out-of-band record details
- Implemented extraction of credential attributes from out-of-band requests
- Updated `acceptInvitation` to capture and store all out-of-band data
- Enhanced `getConnections` to fetch and attach out-of-band records
- Updated `mapConnectionRecord` to include out-of-band data

### Key Implementation:

#### Enhanced Connection Interface:
```typescript
export interface Connection {
  id: string;
  state: string;
  theirLabel?: string;
  createdAt: string;
  theirDid?: string;
  // Out-of-band record data
  outOfBandId?: string;
  outOfBandLabel?: string;
  outOfBandInvitation?: any; // Store invitation details
  handshakeProtocols?: string[];
  outOfBandMetadata?: any;
  // Credential attributes from out-of-band (if credential offer was in invitation)
  credentialAttributesFromOOB?: Array<{ name: string; value: string }>;
}
```

#### Out-of-Band Record Logging:
```typescript
console.log('=== OUT OF BAND RECORD DETAILS ===');
console.log('Full outOfBandRecord:', JSON.stringify(outOfBandRecord, null, 2));
console.log('outOfBandRecord.id:', outOfBandRecord?.id);
console.log('outOfBandRecord.outOfBandInvitation:', JSON.stringify(outOfBandRecord?.outOfBandInvitation, null, 2));
console.log('outOfBandRecord.handshakeProtocols:', oobRecord?.handshakeProtocols);
console.log('outOfBandRecord.requests:', JSON.stringify(oobRecord?.requests, null, 2));
console.log('outOfBandRecord.state:', oobRecord?.state);
console.log('outOfBandRecord.metadata:', oobRecord?.metadata);
```

#### Credential Attributes Extraction:
```typescript
// Extract credential attributes from out-of-band record if available
let credentialAttributesFromOOB: Array<{ name: string; value: string }> = [];
try {
  if (oobRecord?.requests) {
    for (const request of oobRecord.requests) {
      if (request && typeof request === 'object') {
        if ('credential_preview' in request || 'credentialPreview' in request) {
          const preview = (request as any).credential_preview || (request as any).credentialPreview;
          if (preview?.attributes) {
            credentialAttributesFromOOB = preview.attributes.map((attr: any) => ({
              name: attr.name || attr['mime-type'] || 'unknown',
              value: attr.value || '',
            }));
          }
        }
      }
    }
  }
} catch (error) {
  console.warn('Error extracting credential attributes from out-of-band record:', error);
}
```

#### Enhanced getConnections Method:
```typescript
async getConnections(): Promise<Connection[]> {
  const connectionRecords = await this.agent.connections.getAll();
  
  // Try to fetch out-of-band records for connections that have outOfBandId
  const connectionsWithOOB = await Promise.all(
    connectionRecords.map(async (record) => {
      let outOfBandRecord = null;
      
      if (record.outOfBandId) {
        try {
          const oobRecords = await this.agent!.oob.getAll();
          outOfBandRecord = oobRecords.find((oob) => oob.id === record.outOfBandId) || null;
        } catch (error) {
          console.warn(`Could not fetch out-of-band record for connection ${record.id}:`, error);
        }
      }
      
      return this.mapConnectionRecord(record, outOfBandRecord);
    })
  );
  
  return connectionsWithOOB;
}
```

### Features:
- **Comprehensive Data Capture**: All out-of-band record properties are captured and stored
- **Credential Attributes**: Extracts credential attributes from out-of-band requests when available
- **Invitation Details**: Stores invitation label, goal, goalCode, and accept protocols
- **Metadata Preservation**: Extracts and stores metadata from out-of-band records
- **Handshake Protocols**: Captures handshake protocol information
- **Backward Compatibility**: Existing connections without out-of-band data continue to work

---

## 15. Redux Store Updates for Out-of-Band Data

### File: `src/store/slices/credoSlice.ts`

### Changes Made:
- Updated `Connection` interface to match `CredoAgentService` interface
- Enhanced `fetchConnections` to preserve all out-of-band data fields
- Ensured all out-of-band data is persisted to local storage

### Implementation:
```typescript
export const fetchConnections = createAsyncThunk(
  'credo/fetchConnections',
  async (_, { rejectWithValue }) => {
    const connections = await credoAgentService.getConnections();
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
    }));
  }
);
```

---

## Data Captured from Out-of-Band Records

### Connection-Level Data:
1. **outOfBandId**: The ID of the out-of-band record
2. **outOfBandLabel**: Label from the out-of-band invitation
3. **outOfBandInvitation**: Full invitation object containing:
   - `label`: Invitation label
   - `goal`: Invitation goal
   - `goalCode`: Goal code
   - `accept`: Accepted protocols
4. **handshakeProtocols**: Array of handshake protocols used
5. **outOfBandMetadata**: Extracted metadata from the out-of-band record

### Credential-Level Data:
1. **credentialAttributesFromOOB**: Array of credential attributes extracted from out-of-band requests when a credential offer is included in the invitation

---

## Benefits

1. **Rich Connection Context**: Connections now include full invitation context
2. **Early Credential Preview**: Credential attributes available even before credential exchange completes
3. **Better Debugging**: Comprehensive logging helps troubleshoot connection issues
4. **Future-Proof**: All available data is captured for future use cases
5. **Data Completeness**: No loss of information from out-of-band records

---

## Testing Considerations

### Areas to Test:
1. **Out-of-Band Logging**: Verify all out-of-band record properties are logged correctly
2. **Credential Attributes**: Test extraction when credential offers are in invitations
3. **Connection Fetching**: Verify out-of-band records are fetched and attached correctly
4. **Data Persistence**: Ensure all out-of-band data is saved to local storage
5. **Backward Compatibility**: Test with existing connections that don't have out-of-band data

### Edge Cases:
- Out-of-band records without requests
- Out-of-band records with multiple requests
- Missing invitation properties
- Invalid credential preview formats
- Connections without outOfBandId

---

## UI Integration of Out-of-Band Data

### Overview
Integrated out-of-band record data into connection detail screens and preview cards to display more legible and informative connection information.

### Implementation Date
December 2024

---

## 16. ConnectionDetailScreen Enhancement

### File: `src/screens/ConnectionDetailScreen.tsx`

### Changes Made:
- Enhanced display name to prioritize out-of-band invitation label
- Added "Invitation Details" section displaying:
  - Invitation label
  - Goal (if available)
  - Service endpoint
  - Handshake protocols (displayed as chips)
  - Accepted protocols (displayed as chips)
- Added "Credential Preview" section for credential attributes from out-of-band records
- Improved visual presentation with protocol chips

### Key Implementation:

#### Enhanced Display Name:
```typescript
const displayName = connection?.theirLabel || 
                    connection?.outOfBandLabel || 
                    connection?.outOfBandInvitation?.label || 
                    'Unknown Connection';
```

#### Invitation Details Section:
```typescript
{oobInvitation && (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <MaterialIcons name="link" size={20} color="#7C3AED" />
      <Text>Invitation Details</Text>
    </View>
    <View style={styles.infoCard}>
      {/* Invitation label, goal, service endpoint, protocols */}
    </View>
  </View>
)}
```

#### Protocol Chips Display:
```typescript
<View style={styles.protocolContainer}>
  {handshakeProtocols.map((protocol: string, index: number) => (
    <View key={index} style={styles.protocolChip}>
      <Text>{protocol.split('/').pop() || protocol}</Text>
    </View>
  ))}
</View>
```

---

## 17. Preview Cards Enhancement

### Files: `src/screens/DashboardScreen.tsx`, `src/screens/AllCredentialsListScreen.tsx`

### Changes Made:
- Updated connection preview cards to use out-of-band invitation labels
- Enhanced subtitles to show service endpoints or protocol information
- Improved legibility by extracting domain names from service endpoints

### Key Implementation:

#### DashboardScreen Connection Item:
```typescript
const displayName = item.outOfBandInvitation?.label || 
                   item.outOfBandLabel || 
                   item.theirLabel || 
                   'Unknown Connection';

const serviceEndpoint = item.outOfBandInvitation?.services?.[0]?.serviceEndpoint;
const serviceType = item.outOfBandInvitation?.services?.[0]?.type;

// Subtitle shows service endpoint or status
{serviceEndpoint 
  ? `${serviceType || 'Service'}: ${serviceEndpoint.replace(/^https?:\/\//, '').split('/')[0]}` 
  : item.state === 'completed' 
    ? 'Connection established' 
    : `Status: ${item.state}`}
```

#### AllCredentialsListScreen Connection Mapping:
```typescript
const displayTitle = conn.outOfBandInvitation?.label || 
                    conn.outOfBandLabel || 
                    conn.theirLabel || 
                    'Unknown';

const serviceEndpoint = conn.outOfBandInvitation?.services?.[0]?.serviceEndpoint;
const handshakeProtocols = conn.handshakeProtocols || conn.outOfBandInvitation?.handshake_protocols || [];

// Create informative subtitle
let subtitle = '';
if (serviceEndpoint) {
  const domain = serviceEndpoint.replace(/^https?:\/\//, '').split('/')[0];
  subtitle = `${serviceType || 'Service'}: ${domain}`;
} else if (handshakeProtocols.length > 0) {
  const protocolName = handshakeProtocols[0].split('/').pop() || 'Connection';
  subtitle = `${protocolName} protocol`;
} else {
  subtitle = isNewRequest ? 'Wants to send you a connection request' : 'Connection established successfully';
}
```

---

## Benefits of UI Integration

1. **Better Legibility**: Out-of-band invitation labels are more descriptive than generic connection labels
2. **Service Information**: Users can see which service endpoint the connection uses
3. **Protocol Visibility**: Handshake and accepted protocols are clearly displayed
4. **Credential Preview**: Early access to credential attributes when available in invitations
5. **Consistent Experience**: Same data displayed across detail screens and preview cards
6. **Domain Extraction**: Service endpoints show clean domain names instead of full URLs

---

## Visual Enhancements

### Protocol Chips:
- Blue background (`#DBEAFE`) for handshake protocols
- Purple background (`#E0E7FF`) for accepted protocols
- Shortened protocol names (extracts last segment from URL)
- Responsive wrapping for multiple protocols

### Service Endpoint Display:
- Extracts domain from full URL
- Shows service type when available
- Truncates long URLs with ellipsis
- Middle truncation for better readability

---

## Testing Considerations

### Areas to Test:
1. **Display Name Priority**: Verify out-of-band labels are shown before generic labels
2. **Service Endpoint Extraction**: Test domain extraction from various URL formats
3. **Protocol Display**: Verify protocol chips render correctly
4. **Credential Preview**: Test display when credential attributes are in out-of-band records
5. **Fallback Behavior**: Test with connections that don't have out-of-band data
6. **Long Labels**: Test with very long invitation labels and service endpoints

### Edge Cases:
- Missing service endpoints
- Multiple services in invitation
- Very long protocol URLs
- Missing handshake protocols
- Empty credential attributes array

---

## 14. Configurable Connection Filter Implementation

### Implementation Date

January 2025

### Overview

This implementation adds a configurable filter for mediator connections, allowing screens to choose whether to display mediator connections or filter them out. This provides flexibility for different use cases while maintaining backward compatibility.

### Problem Statement

Previously, the `useConnections` hook automatically filtered out all connections with "mediator-invite" in their label. This caused issues when:
1. All connections in Redux were mediator connections (resulting in empty lists)
2. Dashboard stats showed connection count but displayed 0 connections
3. Users needed to see mediator connections in certain contexts

### Solution

Made the connection filter configurable through an optional `includeMediators` parameter that defaults to `false` (maintaining existing behavior). Screens can now opt-in to show mediator connections when needed.

---

## 14.1. Updated useConnections Hook

### File: `src/features/credential-connection/hooks/useConnections.ts`

### Changes Made:

- Added optional `includeMediators` parameter (default: `false`)
- When `true`, returns all connections without filtering
- When `false`, maintains existing filtering behavior (filters out mediator connections)

### Implementation:

```typescript
/**
 * Hook to filter connections, excluding mediator connections
 * Filters out connections that have "mediator-invite" in theirLabel
 * 
 * @param includeMediators - If true, returns all connections including mediators. Default: false
 */
export const useConnections = (includeMediators: boolean = false): Connection[] => {
  const connections = useSelector((state: RootState) => state.credo.connections);

  const filteredConnections = useMemo(() => {
    if (includeMediators) {
      return connections;
    }
    return connections.filter((conn: Connection) => {
      const label = conn.theirLabel || '';
      return !label.toLowerCase().includes('mediator-invite');
    });
  }, [connections, includeMediators]);

  return filteredConnections;
};
```

### Benefits:

1. **Backward Compatible**: Default behavior unchanged (mediators filtered out)
2. **Flexible**: Screens can choose to show mediators when needed
3. **Consistent**: Single source of truth for connection filtering logic

---

## 14.2. Updated CredentialConnectionList Component

### File: `src/features/credential-connection/components/CredentialConnectionList.tsx`

### Changes Made:

- Added `includeMediators?: boolean` prop to component interface
- Passes prop to `useConnections(includeMediators)` hook
- Defaults to `false` for backward compatibility

### Implementation:

```typescript
interface CredentialConnectionListProps {
  navigation: any;
  layoutScale: number;
  fontScale: number;
  iconScale: number;
  credentialsLimit?: number;
  connectionsLimit?: number;
  includeMediators?: boolean; // New prop
}

const CredentialConnectionList: React.FC<CredentialConnectionListProps> = ({
  navigation,
  layoutScale,
  fontScale,
  iconScale,
  credentialsLimit = 3,
  connectionsLimit = 10,
  includeMediators = false, // Default to false
}) => {
  // ...
  const filteredConnections = useConnections(includeMediators);
  // ...
};
```

---

## 14.3. Updated DashboardScreen

### File: `src/screens/DashboardScreen.tsx`

### Changes Made:

- Set `includeMediators={true}` on `CredentialConnectionList` component
- Dashboard now shows all connections including mediators
- Ensures stats count matches displayed connections

### Implementation:

```typescript
<CredentialConnectionList
  navigation={navigation}
  layoutScale={layoutScale}
  fontScale={fontScale}
  iconScale={iconScale}
  includeMediators={true} // Show all connections including mediators
/>
```

### Rationale:

- Dashboard is a comprehensive overview screen
- Users should see all their connections in the dashboard
- Stats count should match displayed items for consistency

---

## 14.4. Updated ConnectionsFullList Component

### File: `src/features/credential-connection/components/ConnectionsFullList.tsx`

### Changes Made:

- Added `includeMediators?: boolean` prop to component interface
- Passes prop to `useConnections(includeMediators)` hook
- Defaults to `false` (mediators filtered out in full list view)

### Implementation:

```typescript
interface ConnectionsFullListProps {
  navigation: any;
  headerComponent?: React.ReactNode;
  includeMediators?: boolean; // New prop
}

const ConnectionsFullList: React.FC<ConnectionsFullListProps> = ({
  navigation,
  headerComponent,
  includeMediators = false, // Default to false
}) => {
  // ...
  const filteredConnections = useConnections(includeMediators);
  // ...
};
```

---

## 14.5. Updated AllCredentialsListScreen

### File: `src/screens/AllCredentialsListScreen.tsx`

### Changes Made:

- Set `includeMediators={true}` on `ConnectionsFullList` component
- "All Connection list" screen now shows all connections including mediators

### Implementation:

```typescript
<ConnectionsFullList
  navigation={navigation}
  headerComponent={headerComponent}
  includeMediators={true} // Show all connections including mediators
/>
```

### Rationale:

- Screen is titled "All Connection list" - should show all connections
- Users expect to see everything when viewing "all" connections

---

## 14.6. Enhanced ConnectionCard Component

### File: `src/features/credential-connection/components/ConnectionCard.tsx`

### Changes Made:

- Added logic to transform "mediator-invite-..." labels to "Mediator Connection"
- Improves user experience by showing friendly labels instead of technical IDs

### Implementation:

```typescript
// Use out-of-band invitation label if available, fallback to theirLabel
let displayName = item.outOfBandInvitation?.label ||
  item.outOfBandLabel ||
  item.theirLabel ||
  'Unknown Connection';

// Transform mediator-invite labels to be more user-friendly
if (displayName.toLowerCase().startsWith('mediator-invite-')) {
  displayName = 'Mediator Connection';
}
```

### Benefits:

- Better UX: Users see "Mediator Connection" instead of "mediator-invite-1763645541869"
- Consistent labeling across all screens
- Easier to understand connection types

---

## 14.7. Usage Examples

### Showing All Connections (Including Mediators):

```typescript
// Dashboard screen
<CredentialConnectionList
  includeMediators={true}
  // ... other props
/>

// All connections list screen
<ConnectionsFullList
  includeMediators={true}
  // ... other props
/>
```

### Filtering Out Mediators (Default Behavior):

```typescript
// Most screens (default behavior)
<CredentialConnectionList
  // includeMediators defaults to false
  // ... other props
/>

// Or explicitly
<ConnectionsFullList
  includeMediators={false}
  // ... other props
/>
```

### Using the Hook Directly:

```typescript
// Get all connections including mediators
const allConnections = useConnections(true);

// Get filtered connections (mediators excluded)
const filteredConnections = useConnections(false);
// or
const filteredConnections = useConnections(); // false is default
```

---

## 14.8. Data Refetching Strategy

### Overview

The application implements a centralized data refetching strategy to ensure the UI stays synchronized with the latest credential and connection data. This is particularly important after user actions like accepting connection invitations or credentials.

### Implementation

#### useDataRefresh Hook

**File:** `src/features/credential-connection/hooks/useDataRefresh.ts`

A centralized hook that provides functions to refresh credential and connection data:

```typescript
export const useDataRefresh = () => {
  const dispatch = useDispatch<AppDispatch>();

  const refreshData = async () => {
    // Refreshes both connections and credentials in parallel
    await Promise.all([
      dispatch(fetchConnections()).unwrap(),
      dispatch(fetchCredentials()).unwrap()
    ]);
  };

  const refreshConnections = async () => {
    await dispatch(fetchConnections()).unwrap();
  };

  const refreshCredentials = async () => {
    await dispatch(fetchCredentials()).unwrap();
  };

  return { 
    refreshData,
    refreshConnections,
    refreshCredentials
  };
};
```

**Features:**
- **Centralized Logic**: Single source of truth for data refreshing
- **Parallel Fetching**: `refreshData()` fetches connections and credentials simultaneously for better performance
- **Error Handling**: Includes try/catch blocks with error logging
- **Granular Control**: Individual functions for refreshing specific data types

### Current Refetching Strategy

| Location                | When                       | Method                                            | What Gets Refetched       |
| ----------------------- | -------------------------- | ------------------------------------------------- | ------------------------- |
| `RequestModal`          | After accepting connection | `useDataRefresh().refreshData()`                  | Connections + Credentials |
| `DashboardScreen`       | On mount                   | Manual `dispatch(fetchConnections/Credentials())` | Connections + Credentials |
| `ConnectionsFullList`   | On mount                   | Manual `dispatch(fetchConnections())`             | Connections only          |
| `CredentialsFullList`   | On mount                   | Manual `dispatch(fetchCredentials())`             | Credentials only          |
| `AcceptCredentialModal` | After accepting credential | Manual `dispatch(fetchCredentials())`             | Credentials only          |

### Integration Examples

#### 1. RequestModal Integration

**File:** `src/components/RequestModal.tsx`

After accepting a connection invitation from QR scan:

```typescript
const { refreshData } = useDataRefresh();

const handleAccept = async () => {
  // Accept invitation
  const result = await dispatch(acceptInvitation(urlToUse)).unwrap();
  
  // Refresh data to update dashboard immediately
  await refreshData();
  
  // Show success modal
  setShowSuccessModal(true);
};
```

**Result:** Dashboard updates immediately after accepting a connection, showing the new connection without requiring navigation or manual refresh.

#### 2. DashboardScreen Initial Fetch

**File:** `src/screens/DashboardScreen.tsx`

Fetches data when component mounts:

```typescript
useEffect(() => {
  const fetchData = async () => {
    try {
      dispatch(fetchConnections());
      dispatch(fetchCredentials());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  fetchData();
}, [dispatch]);
```

**Note:** Currently uses manual dispatch. Could be refactored to use `useDataRefresh()` hook for consistency.

#### 3. List Screen Mount Fetching

**Files:** 
- `src/features/credential-connection/components/ConnectionsFullList.tsx`
- `src/features/credential-connection/components/CredentialsFullList.tsx`

Both screens fetch their respective data on mount:

```typescript
// ConnectionsFullList
useEffect(() => {
  dispatch(fetchConnections());
}, [dispatch]);

// CredentialsFullList
useEffect(() => {
  dispatch(fetchCredentials());
}, [dispatch]);
```

### Benefits

1. **Immediate Updates**: UI reflects changes immediately after user actions
2. **Consistency**: Centralized hook ensures consistent refetching behavior
3. **Performance**: Parallel fetching reduces total refresh time
4. **Maintainability**: Single source of truth for refetching logic
5. **Error Handling**: Centralized error handling and logging

### Usage Recommendations

#### When to Use `refreshData()`:
- After accepting connection invitations
- After accepting credential offers
- When returning to dashboard from other screens (using `useFocusEffect`)
- After bulk operations affecting both connections and credentials

#### When to Use Individual Functions:
- After operations affecting only connections (`refreshConnections()`)
- After operations affecting only credentials (`refreshCredentials()`)
- When optimizing for specific data updates

### Example: Using with Navigation Focus

To refresh data when navigating back to a screen:

```typescript
import { useFocusEffect } from '@react-navigation/native';

const { refreshData } = useDataRefresh();

useFocusEffect(
  useCallback(() => {
    refreshData();
  }, [])
);
```

### Future Enhancements

Potential improvements to the refetching strategy:

1. **Consistent Hook Usage**: Refactor all screens to use `useDataRefresh()` instead of manual dispatch
2. **Focus-Based Refetching**: Add `useFocusEffect` to DashboardScreen for automatic refresh on navigation
3. **Pull-to-Refresh**: Add pull-to-refresh functionality to list screens
4. **Optimistic Updates**: Update UI optimistically before server confirmation
5. **Background Refresh**: Periodic background refresh for long-running sessions
6. **Smart Refetching**: Only refetch when data has actually changed

---

## 14.9. Files Modified Summary

### Modified Files:

1. `src/features/credential-connection/hooks/useConnections.ts`
   - Added `includeMediators` parameter
   - Updated filtering logic

2. `src/features/credential-connection/components/CredentialConnectionList.tsx`
   - Added `includeMediators` prop
   - Passes prop to hook

3. `src/screens/DashboardScreen.tsx`
   - Set `includeMediators={true}`

4. `src/features/credential-connection/components/ConnectionsFullList.tsx`
   - Added `includeMediators` prop
   - Passes prop to hook

5. `src/screens/AllCredentialsListScreen.tsx`
   - Set `includeMediators={true}`

6. `src/features/credential-connection/components/ConnectionCard.tsx`
   - Enhanced label transformation for mediator connections

---

## 14.10. Testing Considerations

### Areas to Test:

1. **Dashboard Display**: Verify dashboard shows all connections including mediators
2. **Stats Consistency**: Check that stats count matches displayed connections
3. **Filter Behavior**: Test that other screens still filter mediators by default
4. **Label Display**: Verify mediator connections show "Mediator Connection" label
5. **Backward Compatibility**: Ensure existing screens work without changes

### Test Cases:

1. **Dashboard with Mediators**:
   - Should display all connections
   - Stats should show correct count
   - Mediator connections should show friendly labels

2. **Default Filtering**:
   - Screens without `includeMediators` prop should filter mediators
   - Empty lists when all connections are mediators (expected behavior)

3. **Explicit Filtering**:
   - Setting `includeMediators={false}` should filter mediators
   - Setting `includeMediators={true}` should show all connections

4. **Label Transformation**:
   - "mediator-invite-..." labels should display as "Mediator Connection"
   - Other labels should display normally

### Edge Cases:

- All connections are mediators (should show in dashboard, filtered elsewhere)
- Mixed connections (some mediators, some regular)
- Empty connections array
- Connections without labels
- Very long mediator-invite labels

---

## 14.11. Benefits Summary

1. **Flexibility**: Screens can choose whether to show mediator connections
2. **Consistency**: Dashboard stats match displayed connections
3. **Backward Compatibility**: Default behavior unchanged for existing screens
4. **Better UX**: Friendly labels for mediator connections
5. **Maintainability**: Single source of truth for filtering logic
6. **User Control**: Different screens can have different filtering behavior

---

## 14.12. Migration Guide

### For Existing Screens:

No changes required - existing screens continue to filter mediators by default.

### For New Screens:

To show all connections including mediators:

```typescript
// Option 1: Using CredentialConnectionList
<CredentialConnectionList
  includeMediators={true}
  // ... other props
/>

// Option 2: Using ConnectionsFullList
<ConnectionsFullList
  includeMediators={true}
  // ... other props
/>

// Option 3: Using hook directly
const allConnections = useConnections(true);
```

---

## Conclusion

The configurable connection filter implementation provides the flexibility needed to display mediator connections in appropriate contexts while maintaining backward compatibility. The dashboard and "All Connections" screen now show complete connection lists, ensuring users have full visibility of their connections while other screens maintain focused views.

