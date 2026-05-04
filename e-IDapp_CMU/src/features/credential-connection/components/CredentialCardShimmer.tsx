import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerLoader from './ShimmerLoader';
import { Dimensions, PixelRatio } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const guideWidth = 375;
const layoutScale = Math.min(Math.min(screenWidth / guideWidth, Dimensions.get('window').height / 667), 1.2);

/**
 * Shimmer loader for credential card - matches CredentialCard layout
 */
const CredentialCardShimmer: React.FC = () => {
  return (
    <View style={[styles.card, {
      marginBottom: 12 * layoutScale,
      borderRadius: 16 * layoutScale,
      padding: 16 * layoutScale,
    }]}>
      <View style={styles.content}>
        {/* Icon shimmer */}
        <View style={[styles.icon, {
          width: 48 * layoutScale,
          height: 48 * layoutScale,
          borderRadius: 12 * layoutScale,
          marginRight: 16 * layoutScale,
        }]}>
          <ShimmerLoader width="100%" height={48} borderRadius={12} />
        </View>

        {/* Info shimmer */}
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <ShimmerLoader width={150} height={16} borderRadius={4} />
            <ShimmerLoader width={50} height={16} borderRadius={12} style={{ marginLeft: 8 * layoutScale }} />
          </View>
          <ShimmerLoader width={200} height={13} borderRadius={4} style={{ marginTop: 6 * layoutScale }} />
          <ShimmerLoader width={100} height={12} borderRadius={4} style={{ marginTop: 6 * layoutScale }} />
        </View>

        {/* Arrow shimmer */}
        <View style={styles.arrow}>
          <ShimmerLoader width={24} height={24} borderRadius={12} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    overflow: 'hidden',
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrow: {
    alignItems: 'flex-end',
  },
});

export default CredentialCardShimmer;

