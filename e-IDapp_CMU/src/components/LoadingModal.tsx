import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  PixelRatio,
  Animated,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Reference dimensions based on iPhone SE (375x667) for baseline compatibility
const guideWidth = 375;
const guideHeight = 667;

// Uniform scaling factor for layout elements
const layoutScale = Math.min(Math.min(screenWidth / guideWidth, screenHeight / guideHeight), 1.2);

// Font scaling uses PixelRatio for density-aware adjustment
const fontScale = Math.min(PixelRatio.getFontScale() * (screenWidth / guideWidth), 1.5);

// Icon scaling with PixelRatio for sharper vectors on high-density screens
const iconScale = Math.min(PixelRatio.get() * (screenWidth / guideWidth), 1.2);

interface LoadingModalProps {
  visible: boolean;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ visible }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (visible) {
      // Reset animation value and start continuous rotation
      rotateAnim.setValue(0);
      
      const startRotation = () => {
        animationRef.current = Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          { iterations: -1 } // Infinite loop
        );
        animationRef.current.start();
      };
      
      startRotation();
    } else {
      // Stop animation when modal is hidden
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      rotateAnim.setValue(0);
    }

    // Cleanup function
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, [visible, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={() => {}} // Prevent closing during loading
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, {
          width: Math.min(screenWidth * 0.85, 350 * layoutScale),
          borderRadius: 24 * layoutScale,
          padding: 20 * layoutScale,
        }]}>
          {/* Loading icon */}
          <View style={[styles.iconContainer, {
            marginBottom: 32 * layoutScale,
          }]}>
            <Animated.View
              style={[
                styles.loadingIcon,
                {
                  transform: [{ rotate: spin }],
                },
              ]}
            >
              <MaterialIcons 
                name="refresh" 
                size={60 * iconScale} 
                color="#7C3AED" 
              />
            </Animated.View>
          </View>

          {/* Loading text */}
          <Text style={[styles.loadingText, {
            fontSize: 20 * fontScale,
            lineHeight: 28 * fontScale,
          }]}>
            Please wait...
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#1F2937',
    textAlign: 'center',
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
});

export default LoadingModal;