# Credentials & Connections Issues Tracking

## Active Issues

### Issue #8: Mediator Connections Not Properly Filtered in Connection Count

**Status:** Resolved (merged into Active for context)
**Date Reported:** 2025-12-29  
**Date Resolved:** 2025-12-29  
**Priority:** Medium

**Description:**
Mediator connections were not properly filtered out from the connection count displayed in the UI.

**Resolution:**
Created centralized mediator detection utility (`connectionUtils.ts`) and updated all filtering locations to use it.

---

## Solved Issues

### Issue #1: Incorrect Issuer Name When Issuing Credential Without Connection

**Status:** Solved  
**Date Resolved:** 2025-12-29  
**Priority:** Medium

**Description:**
Issuer name displayed as "Unknown Issuer" when credential issued without establishing a connection.

**Resolution:**
Extracted `outOfBandId` from metadata and implemented logic to fetch OOB records directly to extract the issuer label.

---

### Issue #2: Credential Count Not Updating in Connection View Until App Restart

**Status:** Solved  
**Date Resolved:** 2025-12-29  
**Priority:** Medium

**Description:**
Credential count in connection view did not update in real-time.

**Resolution:**
Added Redux selectors and `useMemo` hooks to connection components to subscribe to credential changes.
