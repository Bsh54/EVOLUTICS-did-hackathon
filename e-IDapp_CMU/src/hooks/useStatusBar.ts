import React from 'react';
import { StatusBar, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { STATUS_BAR_COLORS } from '../constants/colors';

type StatusBarStyle = 'light-content' | 'dark-content' | 'default';

interface UseStatusBarOptions {
  barStyle?: StatusBarStyle;
  backgroundColor?: string;
  translucent?: boolean;
}

/**
 * Hook to customize StatusBar for individual screens
 * 
 * @example
 * // In a screen component:
 * useStatusBar({ barStyle: 'light-content', backgroundColor: '#5B18B8' });
 * 
 * // Or use predefined colors:
 * useStatusBar(STATUS_BAR_COLORS.purple);
 */
export const useStatusBar = (options: UseStatusBarOptions = {}) => {
  const {
    barStyle = STATUS_BAR_COLORS.light.barStyle,
    backgroundColor = STATUS_BAR_COLORS.light.backgroundColor,
    translucent = false,
  } = options;

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle(barStyle);
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(backgroundColor, true);
        StatusBar.setTranslucent(translucent);
      }
    }, [barStyle, backgroundColor, translucent])
  );
};

// Re-export for convenience
export { STATUS_BAR_COLORS };

