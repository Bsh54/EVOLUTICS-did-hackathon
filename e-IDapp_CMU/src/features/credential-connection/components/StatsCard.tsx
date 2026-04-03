import React from 'react';
import { View, Text, StyleSheet, Image, ImageBackground, TouchableOpacity } from 'react-native';

export type StatsCardType = 'total' | 'active' | 'verification' | 'expired' | 'connections';

interface StatsCardProps {
  type: StatsCardType;
  count: number;
  layoutScale: number;
  fontScale: number;
  iconScale: number;
  width?: number;
  marginRight?: number;
  onPress?: () => void;
  isActive?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  type,
  count,
  layoutScale,
  fontScale,
  width,
  marginRight = 12,
  onPress,
  isActive = false,
}) => {
  const getCardData = () => {
    switch (type) {
      case 'total':
        return {
          label: 'Total Credentials',
          bgColor: isActive ? '#FFD700' : '#FEF3C7',
          image: require('../../../assets/images/dashboard/active-credentials.png'), // Fallback for missing total-credentials.png
          textColor: '#92400E',
        };
      case 'active':
        return {
          label: 'Active Credentials',
          bgColor: isActive ? '#34D399' : '#D1FAE5',
          image: require('../../../assets/images/dashboard/active-credentials.png'),
          textColor: '#065F46',
        };
      case 'verification':
        return {
          label: 'Verification',
          bgColor: isActive ? '#60A5FA' : '#DBEAFE',
          image: require('../../../assets/images/dashboard/verification.png'),
          textColor: '#1E40AF',
        };
      case 'expired':
        return {
          label: 'Expired',
          bgColor: isActive ? '#F87171' : '#FEE2E2',
          image: require('../../../assets/images/dashboard/expired.png'),
          textColor: '#991B1B',
        };
      case 'connections':
        return {
          label: 'Total Connections',
          bgColor: isActive ? '#818CF8' : '#E0E7FF',
          image: require('../../../assets/images/dashboard/active-credentials.png'), // Using active-credentials as fallback
          textColor: '#3730A3',
        };
      default:
        return {
          label: 'Total Credentials',
          bgColor: '#FEF3C7',
          image: require('../../../assets/images/dashboard/active-credentials.png'),
          textColor: '#92400E',
        };
    }
  };

  const data = getCardData();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.container,
        {
          width: width || 140 * layoutScale,
          marginRight: marginRight * layoutScale,
          backgroundColor: data.bgColor,
          borderRadius: 16 * layoutScale,
          padding: 12 * layoutScale,
          borderWidth: isActive ? 2 : 0,
          borderColor: isActive ? '#5B18B8' : 'transparent',
        }
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.label, { fontSize: 11 * fontScale, color: '#1F2937' }]}>
          {data.label}
        </Text>
        <Text style={[styles.count, { fontSize: 24 * fontScale, color: '#000000' }]}>
          {count}
        </Text>
      </View>
      <View style={styles.imageContainer}>
        <Image
          source={data.image}
          style={[styles.image, { width: 80 * layoutScale, height: 80 * layoutScale }]}
          resizeMode="contain"
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 100,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    zIndex: 1,
  },
  label: {
    fontFamily: 'Poppins',
    fontWeight: '500',
    marginBottom: 4,
  },
  count: {
    fontFamily: 'Poppins',
    fontWeight: '700',
  },
  imageContainer: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
  image: {
    opacity: 0.8,
  },
});

export default StatsCard;
