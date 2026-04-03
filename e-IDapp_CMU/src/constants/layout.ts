import { Platform, StatusBar } from 'react-native';

// Get status bar height - centralized for all screens
export const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;
