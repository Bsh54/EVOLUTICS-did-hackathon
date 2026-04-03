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

interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToCredentials: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ visible, onClose, onNavigateToCredentials }) => {
  const handleDone = () => {
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
          {/* Success icon with gradient circles */}
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
            {/* Inner circle with checkmark */}
            <View style={[styles.innerCircle, {
              width: 60 * layoutScale,
              height: 60 * layoutScale,
              borderRadius: 30 * layoutScale,
            }]}>
              <MaterialIcons 
                name="check" 
                size={32 * iconScale} 
                color="#FFFFFF" 
              />
            </View>
          </View>

          {/* Success text */}
          <Text style={[styles.successTitle, {
            fontSize: 32 * fontScale,
            lineHeight: 40 * fontScale,
            marginBottom: 16 * layoutScale,
          }]}>
            Success!
          </Text>

          <Text style={[styles.successMessage, {
            fontSize: 16 * fontScale,
            lineHeight: 24 * fontScale,
            marginBottom: 32 * layoutScale,
          }]}>
            Your credentials have been successfully added to your list.
          </Text>

          {/* Done button */}
          <TouchableOpacity 
            style={[styles.doneButton, {
              borderRadius: 25 * layoutScale,
              paddingVertical: 16 * layoutScale,
            }]}
            onPress={handleDone}
          >
            <Text style={[styles.doneButtonText, {
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
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    position: 'absolute',
  },
  middleCircle: {
    backgroundColor: 'rgba(16, 185, 129, 0.4)',
    position: 'absolute',
  },
  innerCircle: {
    backgroundColor: '#0E9A8D',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  successTitle: {
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  successMessage: {
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Poppins',
    fontWeight: '400',
    paddingHorizontal: 10,
  },
  doneButton: {
    backgroundColor: '#0E9A8D',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
});

export default SuccessModal;