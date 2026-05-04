# Build Configuration Guide

This document explains how to configure environment variables for building the e-ID Holder App, especially for production builds.

## Environment Variables

The app requires two environment variables that are injected at build time:

- **`GENESIS_URL`** - URL to fetch the BCovrin test network genesis transactions
- **`MEDIATOR_URL`** - URL to fetch the mediator invitation (OOB invitation endpoint)

## Development Setup

### 1. Create `.env` File

Create a `.env` file in the project root (copy from `.env.example` if available):

```bash
# .env
GENESIS_URL=https://your-genesis-url-here
MEDIATOR_URL=https://your-mediator-url-here
```

**Important**: The `.env` file is gitignored and should never be committed to version control.

### 2. Verify Configuration

The app will log warnings in development mode if environment variables are missing. Check the console output when starting the app.

You can also validate the configuration programmatically:

```typescript
import { validateEnvConfig, logEnvConfig } from './src/config/env';

// Log current configuration
logEnvConfig();

// Validate configuration
const validation = validateEnvConfig();
if (!validation.isValid) {
  console.error('Environment configuration errors:', validation.errors);
}
if (validation.warnings.length > 0) {
  console.warn('Environment configuration warnings:', validation.warnings);
}
```

## Production Builds

### Problem

In production builds, the `.env` file may not be available, causing environment variables to be `undefined`. This results in "network request failed" errors during wallet restore.

### Solution

The app now includes fallback mechanisms:

1. **Graceful Degradation**: Network requests are optional during restore
2. **Fallback Values**: Empty strings are used when environment variables are missing
3. **Better Error Handling**: Detailed logging helps identify configuration issues

### Building for Production

#### Option 1: Provide `.env` File During Build

Ensure the `.env` file is present in the project root when running the build command:

```bash
# For Android
yarn build:android

# The .env file must be present when Metro bundler runs
```

#### Option 2: Use CI/CD Environment Variables

If building in CI/CD, you can:

1. **Create `.env` file from secrets** before building:
   ```bash
   echo "GENESIS_URL=$GENESIS_URL" > .env
   echo "MEDIATOR_URL=$MEDIATOR_URL" >> .env
   ```

2. **Use build scripts** that inject environment variables:
   ```bash
   # Example build script
   #!/bin/bash
   cat > .env << EOF
   GENESIS_URL=${GENESIS_URL}
   MEDIATOR_URL=${MEDIATOR_URL}
   EOF
   yarn build:android
   ```

#### Option 3: Modify `src/config/env.ts`

For production builds where environment variables cannot be provided, you can hardcode fallback URLs in `src/config/env.ts`:

```typescript
const DEFAULT_GENESIS_URL = 'https://your-actual-genesis-url';
const DEFAULT_MEDIATOR_URL = 'https://your-actual-mediator-url';
```

**Warning**: Only do this if the URLs are not sensitive and can be committed to version control.

## Build Configuration Files

### Babel Configuration (`babel.config.js`)

The Babel configuration uses `react-native-dotenv` to inject environment variables:

```javascript
[
  'module:react-native-dotenv',
  {
    moduleName: '@env',
    path: '.env',
    allowUndefined: true,  // Don't fail if .env is missing
    safe: false,           // Allow missing .env file
  },
]
```

### Environment Config (`src/config/env.ts`)

This file provides:
- Centralized access to environment variables
- Fallback values when variables are undefined
- Validation and logging utilities

### Android Build (`android/app/build.gradle`)

The Android build configuration includes comments about environment variable injection. The actual injection happens during JavaScript bundling, not during native build.

## Troubleshooting

### "Network request failed" during restore

**Symptoms**: Wallet restore fails with "network request failed" error

**Causes**:
1. Environment variables are undefined in production build
2. `.env` file is missing during build
3. Network connectivity issues

**Solutions**:
1. Check if `.env` file exists in project root
2. Verify environment variables are set correctly
3. Check build logs for warnings about missing environment variables
4. Review `src/config/env.ts` for fallback values

### Environment variables are undefined

**Check**:
1. Is `.env` file present in project root?
2. Are variable names correct? (must be `GENESIS_URL` and `MEDIATOR_URL`)
3. Is `react-native-dotenv` properly configured in `babel.config.js`?
4. Did you restart Metro bundler after creating/modifying `.env`?

**Fix**:
1. Create `.env` file with required variables
2. Restart Metro bundler: `yarn start --reset-cache`
3. Rebuild the app

### Build succeeds but app fails at runtime

**Check**:
1. Are environment variables available in the bundled JavaScript?
2. Check console logs for environment configuration warnings
3. Verify network requests are not blocking critical operations

**Note**: The app is designed to work even if environment variables are missing, but some features (mediator connection, genesis transactions) may not be available.

## Best Practices

1. **Never commit `.env` file** - It's in `.gitignore` for a reason
2. **Use `.env.example`** - Document required variables without exposing values
3. **Validate in CI/CD** - Add checks to ensure environment variables are set
4. **Use secrets management** - For CI/CD, use proper secrets management (GitHub Secrets, etc.)
5. **Test production builds** - Always test production builds before deployment

## Related Files

- `babel.config.js` - Babel configuration for environment variable injection
- `src/config/env.ts` - Environment configuration with fallbacks
- `src/utils/genesis.ts` - Uses `getGenesisUrl()` from config
- `src/services/mediator/fetchMediatorInvitation.ts` - Uses `getMediatorUrl()` from config
- `.gitignore` - Ensures `.env` is not committed

