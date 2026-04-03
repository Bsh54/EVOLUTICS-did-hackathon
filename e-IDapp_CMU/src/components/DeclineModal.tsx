import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  PixelRatio,
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

interface DeclineModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToCredentials: () => void;
  errorMessage?: string;
}

const DeclineModal: React.FC<DeclineModalProps> = ({
  visible,
  onClose,
  onNavigateToCredentials,
  errorMessage = "Request declined successfully."
}) => {
  const handleTryAgain = () => {
    onClose();
    onNavigateToCredentials();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, {
          width: Math.min(screenWidth * 0.85, 350 * layoutScale),
          borderRadius: 24 * layoutScale,
          padding: 20 * layoutScale,
        }]}>
          {/* Error icon with gradient circles */}
          <View style={[styles.iconContainer, {
            width: 120 * layoutScale,
            height: 120 * layoutScale,
            marginBottom: 24 * layoutScale,
          }]}>
            {/* Outer circle */}
            <View style={[styles.outerCircle, {
              width: 120 * layoutScale,
              height: 120 * layoutScale,
              borderRadius: 60 * layoutScale,
            }]} />
            {/* Middle circle */}
            <View style={[styles.middleCircle, {
              width: 90 * layoutScale,
              height: 90 * layoutScale,
              borderRadius: 45 * layoutScale,
            }]} />
            {/* Inner circle with X mark */}
            <View style={[styles.innerCircle, {
              width: 60 * layoutScale,
              height: 60 * layoutScale,
              borderRadius: 30 * layoutScale,
            }]}>
              <MaterialIcons
                name="close"
                size={32 * iconScale}
                color="#FFFFFF"
              />
            </View>
          </View>

          {/* Error text */}
          <Text style={[styles.errorTitle, {
            fontSize: 32 * fontScale,
            lineHeight: 40 * fontScale,
            marginBottom: 16 * layoutScale,
          }]}>
            Declined
          </Text>

          <Text style={[styles.errorMessage, {
            fontSize: 16 * fontScale,
            lineHeight: 24 * fontScale,
            marginBottom: 32 * layoutScale,
          }]}>
            {errorMessage}
          </Text>

          {/* Try Again button */}
          <TouchableOpacity
            style={[styles.tryAgainButton, {
              borderRadius: 25 * layoutScale,
              paddingVertical: 16 * layoutScale,
            }]}
            onPress={handleTryAgain}
          >
            <Text style={[styles.tryAgainButtonText, {
              fontSize: 18 * fontScale,
            }]}>
              Done
            </Text>
          </TouchableOpacity>
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  outerCircle: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    position: 'absolute',
  },
  middleCircle: {
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
    position: 'absolute',
  },
  innerCircle: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  errorTitle: {
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  errorMessage: {
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Poppins',
    fontWeight: '400',
    paddingHorizontal: 10,
  },
  tryAgainButton: {
    backgroundColor: '#EF4444',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tryAgainButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
});

export default DeclineModal;