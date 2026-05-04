# Status Bar and Navigation Bar Configuration

This document describes how status bar and navigation bar colors are configured in the application.

## Overview

The application uses a purple primary color (`#5B18B8`) for the status bar and navigation bar to maintain brand consistency. The status bar displays white icons/text (`light-content`) on the purple background for optimal visibility.

## Configuration Files

### 1. React Native Configuration

#### App.tsx (Root Level)
The root `App.tsx` file sets the initial status bar configuration:

```typescript
import { StatusBar, Platform } from 'react-native';

// In useEffect:
if (Platform.OS === 'android') {
  StatusBar.setBackgroundColor('#5B18B8', true);
  StatusBar.setBarStyle('light-content');
  StatusBar.setTranslucent(false);
} else {
  // iOS
  StatusBar.setBarStyle('light-content');
}

// In return:
<StatusBar
  barStyle="light-content"
  backgroundColor="#5B18B8"
  translucent={false}
  animated={true}
/>
```

**Purpose:** Sets the status bar color immediately on app start, ensuring consistent appearance from launch.

#### AppNavigator.tsx (Navigation Level)
The `AppNavigator.tsx` file maintains status bar configuration throughout navigation:

```typescript
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

return (
  <>
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#5B18B8"
        translucent={false}
        animated={true}
      />
      <NavigationContainer>
        {/* ... */}
      </NavigationContainer>
    </SafeAreaView>
  </>
);
```

**Purpose:** Ensures status bar configuration persists across all screens and navigation transitions.

### 2. Color Constants

**File:** `src/constants/colors.ts`

Predefined status bar color configurations:

```typescript
export const STATUS_BAR_COLORS = {
  light: {
    backgroundColor: '#FFFFFF',
    barStyle: 'dark-content' as const, // dark text/icons on light background
  },
  dark: {
    backgroundColor: '#1F2937',
    barStyle: 'light-content' as const, // light text/icons on dark background
  },
  purple: {
    backgroundColor: '#5B18B8',
    barStyle: 'light-content' as const,
  },
  transparent: {
    backgroundColor: 'transparent',
    barStyle: 'dark-content' as const,
  },
};

export const COLORS = {
  primary: '#5B18B8',
  secondary: '#9CA3AF',
  background: '#F9FAFB',
  white: '#FFFFFF',
  black: '#1F2937',
  gray: '#6B7280',
};
```

**Note:** While constants are defined, the current implementation uses direct hex values (`#5B18B8`) for clarity and to ensure the purple color is applied correctly.

### 3. Android Native Configuration

**File:** `android/app/src/main/res/values/styles.xml`

```xml
<style name="AppTheme" parent="Theme.AppCompat.DayNight.NoActionBar">
    <!-- Status bar configuration -->
    <item name="android:statusBarColor">#5B18B8</item>
    <item name="android:windowLightStatusBar">false</item>
    <item name="android:windowDrawsSystemBarBackgrounds">true</item>
    <!-- Navigation bar configuration (Android 8.0+) -->
    <item name="android:navigationBarColor">#5B18B8</item>
    <item name="android:windowLightNavigationBar">false</item>
</style>
```

**Purpose:** Sets the native Android status bar and navigation bar colors at the system level.

**Important:** Changes to `styles.xml` require rebuilding the Android app:
```bash
npm run android
# or
npx react-native run-android
```

## Current Configuration

- **Status Bar Color:** `#5B18B8` (Purple)
- **Status Bar Style:** `light-content` (White icons/text)
- **Navigation Bar Color (Android):** `#5B18B8` (Purple)
- **Translucent:** `false` (Solid background, not transparent)
- **Animated:** `true` (Smooth color transitions)

## Per-Screen Customization

For screens that need different status bar colors, use the `useStatusBar` hook:

**File:** `src/hooks/useStatusBar.ts`

```typescript
import { useStatusBar, STATUS_BAR_COLORS } from '../hooks/useStatusBar';

const MyScreen = () => {
  // Use predefined purple theme
  useStatusBar(STATUS_BAR_COLORS.purple);
  
  // Or customize:
  useStatusBar({ 
    barStyle: 'light-content', 
    backgroundColor: '#5B18B8' 
  });
  
  return (/* ... */);
};
```

**How it works:**
- Uses `useFocusEffect` from React Navigation to apply status bar changes when screen is focused
- Automatically reverts when navigating away
- Works on both iOS and Android

## Safe Area Handling

The `SafeAreaView` component ensures content doesn't overlap with the status bar:

```typescript
<SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
  {/* Content */}
</SafeAreaView>
```

**Edges:**
- `'top'`: Adds padding for status bar area
- `'bottom'`: Adds padding for home indicator/navigation bar

**Important:** The safe area is enabled to prevent hamburger menu and notification icons from overlapping with the status bar.

## Troubleshooting

### Status Bar Still Shows White

**Problem:** Status bar appears white instead of purple.

**Solutions:**
1. **Rebuild Android app** (required for native changes):
   ```bash
   npm run android
   ```

2. **Check for screen-level overrides:**
   - Look for `useStatusBar` hooks in individual screens
   - Check if screens are setting StatusBar directly

3. **Verify Android styles.xml:**
   - Ensure `android:statusBarColor` is set to `#5B18B8`
   - Check that `android:windowDrawsSystemBarBackgrounds` is `true`

4. **Clear cache and rebuild:**
   ```bash
   cd android && ./gradlew clean
   npm run android
   ```

### Content Overlapping Status Bar

**Problem:** Hamburger menu or notification icons overlap with status bar.

**Solution:** Ensure `SafeAreaView` includes `'top'` in edges:
```typescript
<SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
```

### Status Bar Color Not Updating

**Problem:** Status bar color doesn't change when navigating between screens.

**Solutions:**
1. Check if screen is using `useStatusBar` hook correctly
2. Verify StatusBar component is rendered in AppNavigator
3. Ensure no other StatusBar components are overriding the color

## Changing the Status Bar Color

### Global Change

To change the status bar color globally:

1. **Update App.tsx:**
   ```typescript
   StatusBar.setBackgroundColor('#YOUR_COLOR', true);
   <StatusBar backgroundColor="#YOUR_COLOR" />
   ```

2. **Update AppNavigator.tsx:**
   ```typescript
   <StatusBar backgroundColor="#YOUR_COLOR" />
   ```

3. **Update Android styles.xml:**
   ```xml
   <item name="android:statusBarColor">#YOUR_COLOR</item>
   ```

4. **Update barStyle if needed:**
   - Light backgrounds: `barStyle="dark-content"` (dark icons)
   - Dark backgrounds: `barStyle="light-content"` (light icons)

5. **Rebuild Android app:**
   ```bash
   npm run android
   ```

### Per-Screen Change

Use the `useStatusBar` hook in individual screens:

```typescript
import { useStatusBar } from '../hooks/useStatusBar';

const MyScreen = () => {
  useStatusBar({ 
    barStyle: 'light-content',
    backgroundColor: '#YOUR_COLOR'
  });
  
  return (/* ... */);
};
```

## Best Practices

1. **Consistency:** Use the same color across App.tsx, AppNavigator.tsx, and styles.xml
2. **Safe Area:** Always use SafeAreaView with `'top'` edge to prevent overlap
3. **Bar Style:** Match bar style to background color (light-content for dark, dark-content for light)
4. **Testing:** Test on both iOS and Android after making changes
5. **Rebuild:** Always rebuild Android app after changing styles.xml

## Related Files

- `App.tsx` - Root status bar configuration
- `src/navigation/AppNavigator.tsx` - Navigation-level status bar
- `src/constants/colors.ts` - Color constants
- `src/hooks/useStatusBar.ts` - Per-screen status bar hook
- `android/app/src/main/res/values/styles.xml` - Android native configuration

---

**Last Updated:** December 2024  
**Status:** ✅ Configured with purple primary color (`#5B18B8`)

