# ZKP Issues Tracking

## Waiting for Backend

### Issue #3: Duplicate Fields Displayed in Select Disclosure for Multiple Schemas

**Status:** Waiting for Backend  
**Date Reported:** 2025-12-29  
**Priority:** High

**Description:**
When two different schemas contain the same field name and one credential is issued for each schema, during the Select Disclosure process, if the credDefId of one schema is used, fields from both schemas appear in the selection options. This causes all matching credentials to be displayed regardless of which schema was requested.

**Impact:**
- Incorrect and confusing disclosure options
- May lead to unintended data disclosure and privacy risks
- Users see credentials from multiple schemas when only one schema should be shown

**Root Cause:**
1. **Missing Restrictions in Proof Request**: The proof request sent by the verifier/backend does not include `restrictions` in the `requested_attributes` or `requested_predicates` objects
2. **No Schema Filtering**: Without restrictions, the holder app cannot determine which schema/cred_def_id the verifier is requesting
3. **Format Data Limitation**: The `getFormatData()` method from Credo-TS does not include restrictions in its response

**Frontend Implementation Completed:**
1. **Restriction Extraction Logic** added to extract `cred_def_id` from restrictions in proof requests.
2. **Credential Filtering Logic** added with three-tier filtering (Explicit restrictions, extracted IDs, fallback to schema-based grouping).
3. **Comprehensive Logging** added for debugging.

**Backend Implementation Required:**
The backend team needs to include `restrictions` in the proof request JSON.
