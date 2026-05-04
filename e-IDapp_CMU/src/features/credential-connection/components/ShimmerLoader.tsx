import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, PixelRatio } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const guideWidth = 375;
const layoutScale = Math.min(Math.min(screenWidth / guideWidth, Dimensions.get('window').height / 667), 1.2);

interface ShimmerLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

/**
 * Reusable shimmer loader component with animated gradient effect
 */
const ShimmerLoader: React.FC<ShimmerLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();

    return () => {
      shimmerAnimation.stop();
    };
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.shimmer,
        {
          width,
          height: height * layoutScale,
          borderRadius: borderRadius * layoutScale,
          opacity,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  shimmer: {
    backgroundColor: '#E5E7EB',
  },
});

export default ShimmerLoader;

