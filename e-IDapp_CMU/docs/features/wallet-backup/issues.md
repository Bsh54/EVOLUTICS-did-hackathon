# Wallet Backup & Restore Issues Tracking

## Active Issues

### Issue #7: Loading Button Unlocks Before Success Alert is Shown During Wallet Restore

**Status:** Active  
**Date Reported:** 2025-12-29  
**Priority:** Medium

**Description:**
During wallet restore, the loading button gets unlocked before the success alert is displayed. There's a gap between when the restore operation completes and when the success message is shown.

**Impact:**
- Poor user experience with button state not matching the actual operation status.
- Potential for user confusion or accidental duplicate restore operations.

**Proposed Solution:**
Keep the loading button disabled until the success alert is shown by maintaining a local loading state in the component.

---

## Solved Issues

### Issue #4: Wallet Restore Loads Old Wallet Instead of Restoring to New Wallet

**Status:** Solved  
**Date Resolved:** 2025-12-29  
**Priority:** High

**Description:**
When performing a wallet restore after creating a new wallet, the app navigated back to the old wallet instead of the newly restored one.

**Resolution:**
Resolved as part of Issue #6. Added proper wallet deletion, file restoration, and explicit data fetching.

---

### Issue #5: Database Error When Saving User Data After Face Enrollment

**Status:** Solved  
**Date Resolved:** 2025-12-29  
**Priority:** High

**Description:**
TypeError: Cannot read property 'type' of undefined at _setRaw in EncryptedStorage when saving user data.

**Resolution:**
Removed `qrCodeData` from User model to match DB schema. Stored face image path in `profileImage` field for persistence while keeping full QR data in Redux only.

---

### Issue #6: Wallet Initialization Race Condition and Missing Credentials After Restore

**Status:** Solved  
**Date Resolved:** 2025-12-29  
**Priority:** High

**Description:**
"Wallet has not been initialized yet" errors after restore because event listeners triggered fetches before the wallet was ready.

**Resolution:**
Added `isWalletReady()` check, retry logic with exponential backoff, and explicit post-restore data fetch.
