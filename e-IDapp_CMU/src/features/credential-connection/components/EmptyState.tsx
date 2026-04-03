import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface EmptyStateProps {
  type: 'credentials' | 'connections';
  navigation: any;
  layoutScale: number;
  fontScale: number;
  iconScale: number;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  navigation,
  layoutScale,
  fontScale,
  iconScale,
}) => {
  const isCredentials = type === 'credentials';

  const handlePress = () => {
    if (isCredentials) {
      navigation.navigate('Credentials');
    } else {
      navigation.navigate('AllCredentialsListScreen');
    }
  };

  return (
    <View style={[styles.emptyState, {
      padding: 40 * layoutScale,
      borderRadius: 16 * layoutScale,
    }]}>
      <MaterialIcons
        name={isCredentials ? 'description' : 'people'}
        size={64 * iconScale}
        color="#9CA3AF"
      />
      <Text style={[styles.emptyStateText, {
        fontSize: 18 * fontScale,
        marginTop: 16 * layoutScale,
      }]}>
        {isCredentials ? 'No credentials yet' : 'No connections yet'}
      </Text>
      <Text style={[styles.emptyStateSubtext, {
        fontSize: 14 * fontScale,
        marginTop: 8 * layoutScale,
      }]}>
        {isCredentials
          ? 'Your credentials will appear here once you receive them'
          : 'Your connections will appear here once established'}
      </Text>
      <TouchableOpacity
        style={[styles.emptyStateButton, {
          marginTop: 20 * layoutScale,
          paddingVertical: 12 * layoutScale,
          paddingHorizontal: 24 * layoutScale,
          borderRadius: 8 * layoutScale,
        }]}
        onPress={handlePress}
      >
        <Text style={[styles.emptyStateButtonText, {
          fontSize: 14 * fontScale,
        }]}>
          {isCredentials ? 'View All Credentials' : 'View All Connections'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyStateText: {
    color: '#1F2937',
    fontFamily: 'Poppins',
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    color: '#6B7280',
    fontFamily: 'Poppins',
    fontWeight: '400',
    textAlign: 'center',
  },
  emptyStateButton: {
    backgroundColor: '#7C3AED',
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
});

export default EmptyState;

