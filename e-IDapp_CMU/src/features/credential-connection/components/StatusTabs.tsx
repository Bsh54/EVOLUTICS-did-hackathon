import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Tab {
  id: string;
  label: string;
}

interface StatusTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Tab[];
  layoutScale: number;
  fontScale: number;
  marginHorizontal?: number;
  marginBottom?: number;
}

/**
 * Reusable status tabs component for filtering connections by status
 * Used in CredentialConnectionList and AllCredentialsListScreen
 */
const StatusTabs: React.FC<StatusTabsProps> = ({
  activeTab,
  onTabChange,
  tabs,
  layoutScale,
  fontScale,
  marginHorizontal = 16,
  marginBottom = 16,
}) => {
  return (
    <View style={[styles.statusTabsContainer, {
      marginHorizontal: marginHorizontal * layoutScale,
      borderRadius: 25 * layoutScale,
      padding: 4 * layoutScale,
      marginBottom: marginBottom * layoutScale,
    }]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.statusTab, {
            flex: 1,
            paddingVertical: 10 * layoutScale,
            borderRadius: 22 * layoutScale,
          }, activeTab === tab.id && styles.statusTabActive]}
          onPress={() => onTabChange(tab.id)}
        >
          <Text style={[styles.statusTabText, {
            fontSize: 13 * fontScale,
          }, activeTab === tab.id && styles.statusTabTextActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  statusTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e4d0ff',
  },
  statusTab: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  statusTabActive: {
    backgroundColor: '#FFFFFF',
  },
  statusTabText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Poppins',
    fontWeight: '500',
    textAlign: 'center',
  },
  statusTabTextActive: {
    color: '#7C3AED',
  },
});

export default StatusTabs;

