# Selective Disclosure for Verification Requests - Research Document

## Overview

This document captures the current state of verification request handling and selective disclosure implementation in the Polyversity Wallet application. It serves as a foundation for implementing enhanced selective disclosure features similar to the ZKP implementation.

## Current Implementation Analysis

### 1. Verification Request Flow

#### Entry Points
- **QR Code Scanning** (`src/screens/ScanQRScreen.tsx`):
  - Detects `type=proof` for regular proof requests → Opens `ProofRequestModal`
  - Detects `type=zkp-proof` for ZKP requests → Opens `ZkpRequestModal`
  - Both eventually navigate to `ProofRequestDetailsScreen`

#### Components Involved

1. **ProofRequestModal** (`src/components/ProofRequestModal.tsx`):
   - Simple notification modal for regular proof requests
   - Provides "View Details" and "Share" buttons
   - Navigates to `ProofRequestDetailsScreen` with `invitationUrl`

2. **ZkpRequestModal** (`src/features/zkp/components/ZkpRequestModal.tsx`):
   - Notification modal for ZKP proof requests
   - Provides "View Details" and "Decline" buttons
   - Navigates to `ProofRequestDetailsScreen` with `proofRecordId`

3. **ProofRequestDetailsScreen** (`src/screens/ProofRequestDetailsScreen.tsx`):
   - **Unified screen** used for both ZKP and regular proof requests
   - Handles credential loading, selection, and acceptance
   - Currently shows only requested attributes/predicates (filtered via `getFormatData()`)

### 2. Current Selective Disclosure Implementation

#### Attribute Filtering
The `ProofRequestDetailsScreen` already implements filtering to show only requested attributes:

```typescript
// Line 68-70: Fetches format data
const formatData = await agent.proofs.getFormatData(routeProofRecordId);
const fetchedRequestedAttributes = (formatData.request as any).anoncreds?.requested_attributes || {};
const fetchedRequestedPredicates = (formatData.request as any).anoncreds?.requested_predicates || {};

// Lines 93-130: Only processes attributes that are in requested_attributes
Object.entries(anonCreds.attributes).forEach(([ attrName, creds ]: [ string, any ]) => {
    // Only processes attributes that match requested attributes
    const attrDef = fetchedRequestedAttributes[ attrName ];
    // ...
});
```

#### Credential Selection UI
- **Location**: Lines 526-550 in `ProofRequestDetailsScreen.tsx`
- **Implementation**: Horizontal scrollable badge selector
- **Behavior**: 
  - Shows when multiple credentials match for an attribute/predicate
  - Auto-selects oldest credential (last in array) by default
  - Allows manual selection via badge taps
  - Updates `selectedCredentials` state

#### Current Limitations
1. **No Toggle for Selective Disclosure**: 
   - Always shows only requested attributes
   - No option to view all credential attributes vs. only requested ones

2. **No Attribute-Level Disclosure Control**:
   - Cannot choose which specific attributes to reveal (all requested attributes are shown)
   - No "revealed: false" option for attributes (though ZKP implementation shows `revealed: true` in docs)

3. **No ZKP-Specific Selection Module**:
   - The credential selection UI is generic, not specifically designed for ZKP selective disclosure
   - No separate module for ZKP selection switching

### 3. ZKP Implementation Reference

#### ZKP Selection Pattern (from `docs/zkp-implementation.md`)
```typescript
const manualSelection = {
    attributes: {
        [attrName]: {
            credentialId: selectedCredentialId,
            revealed: true,  // Can be set to false for selective disclosure
        },
    },
    predicates: {
        [predName]: {
            credentialId: selectedCredentialId,
        },
    },
};
```

#### Key Differences
- ZKP allows `revealed: false` for attributes (not currently implemented in UI)
- ZKP has dedicated modal flow (`ZkpRequestModal` → `ProofRequestDetailsScreen`)
- Regular proof requests use `ProofRequestModal` → `ProofRequestDetailsScreen`

### 4. Data Flow

#### Current Flow for Regular Proof Requests
```
ScanQRScreen (type=proof)
  ↓
ProofRequestModal (notification)
  ↓
ProofRequestDetailsScreen
  ├─→ Fetches formatData (requested_attributes, requested_predicates)
  ├─→ Fetches all matching credentials (getCredentialsForRequest)
  ├─→ Filters to show only requested attributes
  ├─→ Displays credential selection UI (if multiple matches)
  └─→ Accepts with selected credentials
```

#### Current Flow for ZKP Requests
```
ScanQRScreen (type=zkp-proof)
  ↓
ZkpRequestModal (notification)
  ↓
ProofRequestDetailsScreen (same as above)
  └─→ Uses same filtering and selection logic
```

### 5. Key Files and Functions

#### Core Files
1. **`src/screens/ProofRequestDetailsScreen.tsx`**:
   - Main screen for verification request details
   - Lines 68-70: Fetches format data
   - Lines 78-80: Fetches matching credentials
   - Lines 93-180: Processes and filters attributes/predicates
   - Lines 321-395: Handles credential acceptance with manual selection
   - Lines 526-550: Credential selection UI

2. **`src/services/CredoEventListener.ts`**:
   - Lines 207-216: Handles `ProofState.RequestReceived`
   - Logs format data but doesn't auto-accept (user-controlled)

3. **`src/utils/coreInvitationDecoder.ts`**:
   - Detects ZKP vs. regular proof requests
   - `isZkpRequest` flag based on `zkp_request~attach` or `type=zkp`

#### Key Functions
- `agent.proofs.getFormatData(proofRecordId)`: Gets requested attributes/predicates
- `agent.proofs.getCredentialsForRequest({ proofRecordId })`: Gets all matching credentials
- `agent.proofs.selectCredentialsForRequest({ proofRecordId })`: Auto-selects credentials
- `agent.proofs.acceptRequest({ proofRecordId, proofFormats })`: Accepts with selected credentials

### 6. Current State Summary

#### What Works
✅ Shows only requested attributes/predicates (filtered via format data)
✅ Credential selection UI for multiple matching credentials
✅ Unified screen for both ZKP and regular proof requests
✅ Manual credential selection per attribute/predicate
✅ Predicate condition display (e.g., ">= 1000")

#### What's Missing
❌ Toggle to switch between "requested only" vs. "all attributes" view
❌ Attribute-level reveal control (`revealed: true/false` per attribute)
❌ Dedicated ZKP selection switching module
❌ Visual distinction between ZKP and regular proof requests in details screen

### 7. Requirements Analysis

Based on user request:
1. **"Only show verification details that are being asked"**:
   - ✅ Already implemented (filtered via `getFormatData`)
   - ⚠️ May need verification/improvement
   - ⚠️ May need toggle to view all vs. requested only

2. **"ZKP selection switching module"**:
   - ❓ Unclear requirement - could mean:
     - A toggle/switch component for ZKP-specific selection
     - A module similar to ZKP that allows selective disclosure
     - A way to switch between different selection modes
     - A dedicated component for ZKP credential selection

### 8. Architecture Considerations

#### Similar to ZKP Implementation Pattern
The user wants something similar to:
- `docs/zkp-unification-summary.md`: Documents ZKP flow unification
- `docs/zkp-implementation.md`: Documents ZKP implementation details

#### Potential Implementation Approaches

**Approach 1: Toggle-Based Selective Disclosure**
- Add toggle in `ProofRequestDetailsScreen` to switch between:
  - "Requested Only" (current behavior)
  - "All Attributes" (show all credential attributes)
- Similar to how ZKP has selective disclosure options

**Approach 2: Attribute-Level Reveal Control**
- Add checkboxes/toggles per attribute to control `revealed: true/false`
- Only send attributes marked as `revealed: true` in proof acceptance
- More granular control over what's shared

**Approach 3: Dedicated ZKP Selection Module**
- Create `src/features/zkp/components/ZkpSelectionModule.tsx`
- Reusable component for ZKP-specific credential selection
- Can be used in `ProofRequestDetailsScreen` when request is ZKP

**Approach 4: Unified Selection Module**
- Create `src/features/verification/components/SelectionModule.tsx`
- Works for both ZKP and regular proof requests
- Handles selective disclosure for both types

### 9. Questions for Clarification

1. **"Only show verification details that are being asked"**:
   - Is this already working correctly, or are there cases where non-requested attributes are shown?
   - Do you want a toggle to switch between "requested only" and "all attributes" view?

2. **"ZKP selection switching module"**:
   - What exactly should this module do?
   - Should it be a toggle/switch component?
   - Should it allow switching between different selection modes?
   - Should it be specific to ZKP requests only, or work for all verification requests?

3. **Selective Disclosure**:
   - Do you want attribute-level control (choose which attributes to reveal)?
   - Or just credential-level selection (which credential to use)?
   - Should `revealed: false` be supported for attributes?

4. **Scope**:
   - Should this apply to both ZKP and regular proof requests?
   - Or only to ZKP requests?
   - Should there be visual distinction between ZKP and regular requests?

### 10. Related Documentation

- `docs/zkp-unification-summary.md`: ZKP flow unification
- `docs/zkp-implementation.md`: ZKP implementation details
- `docs/architecture-overview.md`: General architecture patterns

### 11. Next Steps

1. **Clarify Requirements**: Get answers to questions in section 9
2. **Design Solution**: Based on clarifications, design the selective disclosure module
3. **Implementation Plan**: Create detailed plan similar to ZKP documentation
4. **Implementation**: Build the feature following existing patterns

---

**Created**: January 2025  
**Status**: Research Complete - Awaiting Clarification
