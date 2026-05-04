# Patching Native Modules

This document describes the patching strategy used in this project to fix compatibility issues with native React Native modules.

## Overview

When upgrading React Native or when native modules have compatibility issues, we use [`patch-package`](https://github.com/ds300/patch-package) to create and apply patches to `node_modules` packages. This allows us to:

- Fix compatibility issues without waiting for upstream fixes
- Maintain patches across `yarn install` operations
- Version control patches alongside the codebase
- Share fixes with the team automatically

## Setup

### Installation

```bash
yarn add -D patch-package postinstall-postinstall
```

### Postinstall Script

The `postinstall` script in `package.json` automatically applies all patches after `yarn install`:

```json
{
  "scripts": {
    "postinstall": "patch-package"
  }
}
```

## Current Patches

### 1. @hyperledger/anoncreds-react-native (v0.3.3)

**File:** `patches/@hyperledger+anoncreds-react-native+0.3.3.patch`

**Problem:** Multiple compatibility issues with React Native 0.76+:
1. Struct initialization order issue in C++ code causing compilation errors
2. C++ standard mismatch (CMakeLists.txt uses C++20, build.gradle uses C++14)
3. Missing React Native version in Gradle dependency

**Solution:** Fixed struct initialization order, aligned C++ standard to C++17, and added React Native version to dependency.

**Changes:**
1. **cpp/turboModuleUtility.cpp:**
   - Fixed `FfiCredentialProve` struct initialization order
   - Ensures `is_predicate` field is initialized before `referent` field

2. **CMakeLists.txt:**
   - Changed `CMAKE_CXX_STANDARD` from `20` to `17` to match React Native requirements

3. **build.gradle:**
   - Added `REACT_NATIVE_FULL_VERSION` variable definition
   - Changed C++ flags from `-std=c++1y` to `-std=c++17`
   - Fixed React Native dependency to use `${REACT_NATIVE_FULL_VERSION}` variable

**Why This Works:**
- C++ struct initialization must match the order of declaration
- React Native 0.76+ requires C++17 minimum (not C++14 or C++20)
- Gradle dependency needs explicit version for proper resolution
- Aligning both CMakeLists.txt and build.gradle to C++17 ensures consistency

**Note:** This patch is for version 0.3.3. For version 0.2.4, see section 1a below.

---

### 1a. @hyperledger/anoncreds-react-native (v0.2.4)

**File:** `patches/@hyperledger+anoncreds-react-native+0.2.4.patch`

**Problem:** CMake target name mismatch causing Android build failures with React Native 0.81.4:
1. CMake target name mismatch (`reactnativejni` → `reactnative`)
2. C++ standard too old (C++14) for React Native 0.76+

**Solution:** Updated CMake target name and C++ standard to match React Native 0.81.4 requirements.

**Changes:**
1. **CMakeLists.txt:**
   - Changed `CMAKE_CXX_STANDARD` from `14` to `17`
   - Changed CMake target from `ReactAndroid::reactnativejni` to `ReactAndroid::reactnative`

2. **build.gradle:**
   - Changed C++ flags from `-std=c++1y` to `-std=c++17`

**Why This Works:**
- React Native 0.76+ requires C++17 minimum
- CMake target names changed in React Native's new architecture (`reactnativejni` → `reactnative`)
- This version (0.2.4) is required for compatibility with `@credo-ts/anoncreds@0.5.17` peer dependencies

**Error Message:**
```
CMake Error at CMakeLists.txt:30 (add_library): Target "anoncredsreactnative" links to target "ReactAndroid::reactnativejni" but the target was not found.
```

---

### 2. @hyperledger/aries-askar-react-native (v0.2.3)

**File:** `patches/@hyperledger+aries-askar-react-native+0.2.3.patch`

**Problem:** Multiple compatibility issues with React Native 0.76+:
1. C++ standard too old (C++14) for React Native 0.76+
2. CMake target name mismatch (`reactnativejni` → `reactnative`)
3. Missing React Native version in Gradle dependency

**Solution:** Updated C++ standard, CMake targets, and Gradle configuration.

**Changes:**
1. **CMakeLists.txt:**
   - Changed `CMAKE_CXX_STANDARD` from `14` to `17`
   - Changed CMake target from `ReactAndroid::reactnativejni` to `ReactAndroid::reactnative`

2. **build.gradle:**
   - Changed C++ flags from `-std=c++1y` to `-std=c++17`
   - Fixed React Native dependency to use `${REACT_NATIVE_FULL_VERSION}` variable

**Why This Works:**
- React Native 0.76+ requires C++17 minimum
- CMake target names changed in React Native's new architecture
- Gradle dependency needs explicit version for proper resolution

**Note:** If you encounter `Could not find ASKAR_LIB at:` errors, the native binaries may be missing. Run:
```bash
cd node_modules/@hyperledger/aries-askar-react-native && npm run install
```
This downloads the required native binaries from GitHub releases using `node-pre-gyp`.

---

### 3. @hyperledger/indy-vdr-react-native (v0.2.2)

**File:** `patches/@hyperledger+indy-vdr-react-native+0.2.2.patch`

**Problem:** Multiple compatibility issues with React Native 0.76+:
1. minSdkVersion mismatch (hardcoded 21 vs app's 24)
2. C++ standard too old (C++14) for React Native 0.76+
3. CMake target name mismatch (`reactnativejni` → `reactnative`)
4. Missing React Native version in Gradle dependency

**Solution:** Updated minSdkVersion to use root project value, C++ standard, CMake targets, and Gradle configuration.

**Changes:**
1. **CMakeLists.txt:**
   - Changed `CMAKE_CXX_STANDARD` from `14` to `17`
   - Changed CMake target from `ReactAndroid::reactnativejni` to `ReactAndroid::reactnative`

2. **build.gradle:**
   - Changed `minSdkVersion` from hardcoded `21` to `getExt('minSdkVersion')` to use root project value (24)
   - Changed C++ flags from `-std=c++1y` to `-std=c++17`
   - Fixed React Native dependency to use `${REACT_NATIVE_FULL_VERSION}` variable

**Why This Works:**
- React Native 0.76+ requires C++17 minimum
- CMake target names changed in React Native's new architecture
- Gradle dependency needs explicit version for proper resolution
- Using `getExt('minSdkVersion')` ensures the library uses the same minSdkVersion as the app, preventing build errors

**Error Message:**
```
[CXX1214] User has minSdkVersion 21 but library was built for 24 [//ReactAndroid/hermestooling]
```

**Note:** If you encounter `Could not find ANONCREDS_LIB at:` errors, the native binaries may be missing. Run:
```bash
cd node_modules/@hyperledger/anoncreds-react-native && node scripts/install.js
```
This downloads the required native binaries from GitHub releases.

---

### 4. react-native-svg (Historical Issue)

**Note:** This issue was encountered with React Native 0.76.6 and react-native-svg 15.14.0. With React Native 0.81.4 and react-native-svg 15.13.0, this patch may not be needed. Documented here for reference.

**Problem:** Yoga API change in React Native 0.76.6

**Error Message:**
```
error: no member named 'StyleSizeLength' in namespace 'facebook::yoga'; did you mean 'StyleLength'?
style.setDimension(yoga::Dimension::Width, yoga::StyleSizeLength::points(0));
Execution failed for task ':app:buildCMakeDebug[arm64-v8a]'
```

**Root Cause:**
- React Native 0.76.6 changed Yoga API: `StyleSizeLength` → `StyleLength`
- `react-native-svg@15.14.0` was using the deprecated `StyleSizeLength` API
- The library hadn't been updated for React Native 0.76.6 compatibility yet

**Solution (if needed):**
If you encounter this error, create a patch:

1. **Edit the file:**
   ```bash
   # Edit node_modules/react-native-svg/common/cpp/react/renderer/components/rnsvg/RNSVGLayoutableShadowNode.cpp
   ```
   
   Change lines 31-32:
   ```cpp
   // From:
   style.setDimension(yoga::Dimension::Width, yoga::StyleSizeLength::points(0));
   style.setDimension(yoga::Dimension::Height, yoga::StyleSizeLength::points(0));
   
   // To:
   style.setDimension(yoga::Dimension::Width, yoga::StyleLength::points(0));
   style.setDimension(yoga::Dimension::Height, yoga::StyleLength::points(0));
   ```

2. **Create the patch:**
   ```bash
   npx patch-package react-native-svg --use-yarn
   ```

3. **Commit the patch:**
   ```bash
   git add patches/react-native-svg+15.14.0.patch
   git commit -m "Add patch for react-native-svg RN 0.76.6 compatibility"
   ```

**Why This Works:**
- Patch-package applies the fix automatically after `yarn install`
- The patch file is version-controlled and persists across installs
- No manual `node_modules` modifications needed after initial setup

---

## Creating a New Patch

### Step-by-Step Process

1. **Identify the issue:**
   - Build fails with a specific error
   - Check if it's a compatibility issue with React Native version
   - Verify the issue is in a third-party package, not your code

2. **Make the fix in node_modules:**
   ```bash
   # Edit the problematic file directly
   # Example: node_modules/some-package/src/file.js
   ```

3. **Test the fix:**
   ```bash
   # Verify the build works
   cd android && ./gradlew app:assembleDebug
   ```

4. **Create the patch:**
   ```bash
   # From project root
   npx patch-package some-package --use-yarn
   ```

5. **Verify the patch file:**
   ```bash
   # Check that patches/some-package+X.Y.Z.patch was created
   ls patches/
   ```

6. **Test patch application:**
   ```bash
   # Remove node_modules and reinstall
   rm -rf node_modules
   yarn install
   
   # Verify patches were applied
   # Check the file you modified - it should have your changes
   ```

7. **Commit the patch:**
   ```bash
   git add patches/some-package+X.Y.Z.patch
   git commit -m "Add patch for some-package compatibility"
   ```

### Patch File Naming

Patch files follow this format:
```
patches/<package-name>+<version>.patch
```

For scoped packages:
```
patches/@scope+package-name+<version>.patch
```

Example: `patches/@hyperledger+anoncreds-react-native+0.3.3.patch`

---

## Updating Patches

When a package is updated, you may need to update or recreate patches:

1. **Check if patch still applies:**
   ```bash
   yarn install
   # If patch fails, you'll see an error
   ```

2. **If patch fails:**
   - The package may have been updated and the issue fixed
   - Or the file structure changed
   - Remove the old patch and create a new one if needed

3. **Update patch:**
   ```bash
   # Make changes to node_modules
   # Recreate the patch
   npx patch-package package-name --use-yarn
   ```

---

## Best Practices

1. **Document patches:** Always document why a patch is needed in this file
2. **Test thoroughly:** Test patches after every `yarn install`
3. **Version control:** Always commit patch files to git
4. **Keep patches minimal:** Only patch what's necessary
5. **Monitor upstream:** Check if upstream fixes are available
6. **Remove when fixed:** Delete patches when upstream fixes are released

---

## Troubleshooting

### Patch not applying

**Error:** `patch-package: error: Failed to apply patch`

**Solutions:**
1. Check if package version changed
2. Verify patch file is correct
3. Try recreating the patch
4. Check for whitespace/line ending issues

### Patch applied but build still fails

**Solutions:**
1. Clean build: `cd android && ./gradlew clean`
2. Remove node_modules and reinstall: `rm -rf node_modules && yarn install`
3. Verify patch was applied: Check the modified file in node_modules
4. **Missing native binaries:** Some packages download native binaries during installation. If you see "Could not find LIB at:" errors:
   - **anoncreds-react-native:**
     ```bash
     cd node_modules/@hyperledger/anoncreds-react-native && node scripts/install.js
     ```
   - **aries-askar-react-native:**
     ```bash
     cd node_modules/@hyperledger/aries-askar-react-native && npm run install
     ```
   - **indy-vdr-react-native:**
     ```bash
     cd node_modules/@hyperledger/indy-vdr-react-native && npm run install
     ```

### Multiple patches for same package

If you need multiple patches for different versions:
- Patch files are version-specific
- Each version gets its own patch file
- patch-package applies the correct patch based on installed version

---

## Related Documentation

- [patch-package GitHub](https://github.com/ds300/patch-package)
- [React Native Upgrade Helper](https://react-native-community.github.io/upgrade-helper/)
- [React Native New Architecture](https://reactnative.dev/docs/the-new-architecture/landing-page)

---

**Last Updated:** December 2024  
**React Native Version:** 0.81.4  
**Status:** ✅ All patches documented and working

---

## Summary

The project currently has **4 active patches** for Hyperledger packages:
1. `@hyperledger/anoncreds-react-native` (v0.3.3) - C++ struct initialization fix
2. `@hyperledger/anoncreds-react-native` (v0.2.4) - React Native 0.81.4 CMake target compatibility
3. `@hyperledger/aries-askar-react-native` (v0.2.3) - React Native 0.76+ compatibility
4. `@hyperledger/indy-vdr-react-native` (v0.2.2) - React Native 0.76+ compatibility + minSdkVersion fix

**Note:** The anoncreds-react-native package has two patches for different versions:
- v0.3.3 patch (historical, may not be in use)
- v0.2.4 patch (currently active, required for Credo-ts 0.5.17 compatibility)

All patches follow similar patterns and address React Native 0.76+ compatibility issues, particularly:
- C++17 requirement (upgraded from C++14)
- CMake target name changes (`reactnativejni` → `reactnative`)
- Gradle dependency version resolution

