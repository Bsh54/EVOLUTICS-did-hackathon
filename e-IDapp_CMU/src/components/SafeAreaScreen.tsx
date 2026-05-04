import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

interface SafeAreaScreenProps {
  children: React.ReactNode;
  edges?: Edge[];
  scrollable?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  showsVerticalScrollIndicator?: boolean;
}

/**
 * SafeAreaScreen - A reusable wrapper component that handles safe areas consistently
 * across all screens. Automatically respects device notches, status bars, and home indicators.
 * 
 * @param children - The content to render inside the safe area
 * @param edges - Which edges to apply safe area insets to (default: ['top', 'bottom'])
 * @param scrollable - Whether to wrap content in a ScrollView (default: false)
 * @param style - Style for the SafeAreaView container
 * @param contentContainerStyle - Style for ScrollView content container (only used if scrollable=true)
 * @param showsVerticalScrollIndicator - Whether to show vertical scroll indicator (default: false)
 */
const SafeAreaScreen: React.FC<SafeAreaScreenProps> = ({
  children,
  edges = ['top', 'bottom'],
  scrollable = false,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
}) => {
  if (scrollable) {
    return (
      <SafeAreaView edges={edges} style={[styles.container, style]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={edges} style={[styles.container, style]}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default SafeAreaScreen;

