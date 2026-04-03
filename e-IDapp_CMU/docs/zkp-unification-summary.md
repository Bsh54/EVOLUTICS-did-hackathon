# ZKP Verification Flow Unification

## Overview

This document consolidates the architectural changes made to unify the Zero-Knowledge Proof (ZKP) verification flow in the Polyversity Wallet application. The primary goal was to transition from an auto-accept system to a user-controlled manual selection process, providing better transparency and control over credential sharing.

## Implementation Date

December 2025

## Problem Statement

Previously, the ZKP verification flow had conflicting behaviors:
- The `CredoEventListener` automatically accepted proof requests without user interaction
- The `ZkpRequestModal` attempted to provide manual credential selection, but auto-accept interfered
- Users had limited visibility into what conditions were being verified (especially predicates)
- Navigation flow was inconsistent after proof acceptance

## Solution Architecture

The solution restructures the flow into three distinct components:

1. **Event Listener**: Disabled auto-accept, now only logs and notifies
2. **Notification Modal**: Simplified to act as a gateway to detailed view
3. **Details Screen**: Comprehensive view with full credential selection and predicate condition display

---

## Component Changes

### 1. CredoEventListener.ts

**File**: `src/services/CredoEventListener.ts`

**Changes Made**:
- Disabled automatic proof request acceptance in `ProofState.RequestReceived` handler
- Removed `agent.proofs.acceptRequest()` call
- Added logging of format data (requested attributes and predicates) for debugging
- Event listener now only observes and logs, allowing UI to handle user decisions

**Key Code Change**:
```typescript
case ProofState.RequestReceived:
    console.log('📩 [RequestReceived] Proof request received - waiting for user action');
    // Auto-accept disabled - UI will handle user's decision
    const formatData = await agent.proofs.getFormatData(proofRecord.id);
    // Log format data for debugging
    break;
```

**Impact**: Users now have full control over when and which credentials to share.

---

### 2. ZkpRequestModal.tsx

**File**: `src/features/zkp/components/ZkpRequestModal.tsx`

**Changes Made**:
- Simplified from full credential selection modal to notification gateway
- Removed credential loading and selection logic (moved to `ProofRequestDetailsScreen`)
- Added "View Details" button that navigates to `ProofRequestDetailsScreen`
- Kept "Decline" functionality for immediate rejection
- Reduced component complexity significantly

**Previous Behavior**:
- Loaded all matching credentials
- Displayed credential selection UI
- Handled acceptance/decline directly

**New Behavior**:
- Shows notification: "New Verification Request from [Verifier]"
- Provides two actions:
  - **View Details**: Navigates to detailed screen
  - **Decline**: Immediately declines the request

**Key Code Change**:
```typescript
const handleViewDetails = () => {
    onClose();
    navigation.navigate('ProofRequestDetails', {
        proofRecordId,
        verifierName,
    });
};
```

**Impact**: Cleaner separation of concerns, better user experience with dedicated details screen.

---

### 3. ProofRequestDetailsScreen.tsx

**File**: `src/screens/ProofRequestDetailsScreen.tsx`

**Changes Made**:
- **Enhanced Credential Loading**: Uses `getCredentialsForRequest()` to fetch all matching credentials
- **Format Data Integration**: Fetches `getFormatData()` to retrieve predicate conditions (`p_type`, `p_value`)
- **Predicate Condition Display**: Shows conditions like "Area Sqft (>= 1000)" instead of just attribute names
- **Manual Credential Selection**: Allows users to select which credential to use for each attribute/predicate
- **Navigation Update**: After successful share, navigates to Connections tab (`AllCredentialsListScreen`)

**New Features**:

1. **Predicate Condition Display**:
   - Fetches format data to get predicate definitions
   - Displays conditions in format: `[Value] ([Operator] [Threshold])`
   - Example: "1500 (>= 1000)" for area_sqft predicate
   - Visual badge indicator for predicates vs regular attributes

2. **Credential Selection UI**:
   - Shows credential selector badges when multiple credentials match
   - Auto-selects oldest credential by default
   - Allows manual selection per attribute/predicate

3. **Enhanced Display**:
   - Shows count of attributes and conditions separately
   - Section title: "Attributes & Conditions Requested"
   - Visual distinction between attributes and predicates

**Key Code Changes**:

```typescript
// Fetch format data for predicate conditions
const formatData = await agent.proofs.getFormatData(proofRecordId);
const requestedAttributes = formatData.request.anoncreds?.requested_attributes || {};
const requestedPredicates = formatData.request.anoncreds?.requested_predicates || {};

// Process predicates with conditions
if (predDef) {
    const condition = `${predDef.p_type || '>='} ${predDef.p_value || ''}`;
    const displayValue = predValue ? `${predValue} (${condition})` : condition;
    // Display with condition
}
```

**Navigation After Success**:
```typescript
navigation.dispatch(
    CommonActions.reset({
        index: 0,
        routes: [{
            name: 'DrawerNavigator',
            state: {
                routes: [{
                    name: 'MainTabs',
                    state: {
                        index: 3, // AllCredentialsListScreen tab
                        routes: [/* tab routes */],
                    },
                }],
            },
        }],
    })
);
```

**Impact**: Users can see exactly what conditions are being verified and have full control over credential selection.

---

### 4. ScanQRScreen.tsx

**File**: `src/screens/ScanQRScreen.tsx`

**Changes Made**:
- Removed unused `onSuccess` prop from `ZkpRequestModal`
- Fixed type issues with QR code value handling
- Maintained existing flow for detecting ZKP requests via `type=zkp-proof` parameter

**Impact**: Cleaner integration with updated modal component.

---

## User Flow

### Complete Flow Diagram

```
1. User scans QR code
   ↓
2. ScanQRScreen detects type=zkp-proof
   ↓
3. handleZkpInvitation() accepts invitation
   ↓
4. Polls for proof request in RequestReceived state
   ↓
5. ZkpRequestModal opens (notification)
   ├─→ "View Details" → Navigate to ProofRequestDetailsScreen
   └─→ "Decline" → Decline immediately
   ↓
6. ProofRequestDetailsScreen displays:
   - Verifier information
   - Requested attributes with values
   - Requested predicates with conditions (e.g., ">= 1000")
   - Credential selection UI (if multiple matches)
   ↓
7. User selects credentials and taps "Share"
   ↓
8. Proof accepted with selected credentials
   ↓
9. Success modal shown
   ↓
10. Navigate to Connections tab
```

### Key User Interactions

1. **Scanning**: QR code detection triggers invitation acceptance
2. **Notification**: Modal shows brief summary
3. **Details View**: Full breakdown of what's being requested
4. **Selection**: Choose which credentials to use (if multiple available)
5. **Sharing**: Accept with selected credentials
6. **Completion**: Navigate to Connections tab to see new connection

---

## Technical Details

### Predicate Condition Format

Predicates are displayed with their verification conditions:

**Request Format** (from format data):
```json
{
  "pred_0": {
    "name": "area_sqft",
    "p_type": ">=",
    "p_value": 1000
  }
}
```

**Display Format**:
- If credential value available: `"1500 (>= 1000)"`
- If no value: `">= 1000"`

### Credential Selection Logic

- Uses `getCredentialsForRequest()` to get all matching credentials
- Groups credentials by attribute/predicate name
- Auto-selects oldest credential (last in array) by default
- Allows manual override via badge selection UI

### Navigation Structure

The app uses nested navigators:
- **StackNavigator** (AppNavigator) → Contains screens like ProofRequestDetailsScreen
- **DrawerNavigator** → Contains TabNavigator
- **TabNavigator** → Contains tabs including AllCredentialsListScreen (Connections)

Navigation after success uses `CommonActions.reset()` to properly navigate to the Connections tab.

---

## Files Modified

1. `src/services/CredoEventListener.ts`
   - Disabled auto-accept in proof event listener

2. `src/features/zkp/components/ZkpRequestModal.tsx`
   - Simplified to notification modal
   - Added navigation to details screen

3. `src/screens/ProofRequestDetailsScreen.tsx`
   - Enhanced with format data fetching
   - Added predicate condition display
   - Implemented credential selection UI
   - Updated navigation to Connections tab

4. `src/screens/ScanQRScreen.tsx`
   - Removed unused props
   - Fixed type issues

---

## Benefits

1. **User Control**: Users decide when and which credentials to share
2. **Transparency**: Clear visibility into what conditions are being verified
3. **Better UX**: Dedicated details screen provides comprehensive information
4. **Consistency**: Unified flow from scan to connection
5. **Maintainability**: Clear separation of concerns between components

---

## Future Enhancements

Potential improvements for future iterations:

1. **Predicate Visualization**: Visual indicators for predicate conditions (e.g., progress bars for ranges)
2. **Credential Preview**: Show full credential details before selection
3. **Batch Selection**: Select multiple credentials at once
4. **Condition Explanations**: User-friendly explanations of what predicates mean
5. **History**: Track verification requests and their outcomes

---

## Testing Considerations

When testing the unified flow:

1. **Scan ZKP QR Code**: Verify modal appears correctly
2. **View Details**: Ensure all attributes and predicates display with conditions
3. **Credential Selection**: Test selection UI when multiple credentials match
4. **Predicate Display**: Verify conditions show correctly (e.g., ">= 1000")
5. **Navigation**: Confirm navigation to Connections tab after success
6. **Decline Flow**: Test immediate decline from notification modal

---

## Related Documentation

- `docs/zkp-implementation.md`: Original ZKP implementation details
- `docs/listing-features-implementation.md`: General feature implementation patterns

---

## Summary

The ZKP verification flow unification successfully transitions from an auto-accept system to a user-controlled manual selection process. Key improvements include:

- **Disabled auto-accept** in event listener
- **Simplified notification modal** for better UX
- **Enhanced details screen** with predicate condition display
- **Consistent navigation** to Connections tab after completion

This architecture provides users with full transparency and control over their credential sharing while maintaining a smooth user experience.
