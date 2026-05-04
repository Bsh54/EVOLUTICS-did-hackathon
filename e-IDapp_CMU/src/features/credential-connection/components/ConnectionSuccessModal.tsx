import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  PixelRatio,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Connection } from '../../../store/slices/credoSlice';

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

interface ConnectionSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  connection?: Connection;
  onNavigateToConnections: () => void;
  navigation?: any;
}

/**
 * Success modal that displays connection details after successful connection establishment
 * Uses ConnectionCard component for consistent display
 */
const ConnectionSuccessModal: React.FC<ConnectionSuccessModalProps> = ({
  visible,
  onClose,
  connection,
  onNavigateToConnections,
  navigation,
}) => {
  const handleDone = () => {
    onClose();
    onNavigateToConnections();
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
          width: Math.min(screenWidth * 0.9, 400 * layoutScale),
          maxHeight: screenHeight * 0.8,
          borderRadius: 24 * layoutScale,
          padding: 20 * layoutScale,
        }]}>
          {/* Success icon with gradient circles */}
          <View style={[styles.iconContainer, {
            width: 100 * layoutScale,
            height: 100 * layoutScale,
            marginBottom: 20 * layoutScale,
          }]}>
            {/* Outer circle */}
            <View style={[styles.outerCircle, {
              width: 100 * layoutScale,
              height: 100 * layoutScale,
              borderRadius: 50 * layoutScale,
            }]} />
            {/* Middle circle */}
            <View style={[styles.middleCircle, {
              width: 75 * layoutScale,
              height: 75 * layoutScale,
              borderRadius: 37.5 * layoutScale,
            }]} />
            {/* Inner circle with checkmark */}
            <View style={[styles.innerCircle, {
              width: 50 * layoutScale,
              height: 50 * layoutScale,
              borderRadius: 25 * layoutScale,
            }]}>
              <MaterialIcons
                name="check"
                size={28 * iconScale}
                color="#FFFFFF"
              />
            </View>
          </View>

          {/* Success text */}
          <Text style={[styles.successTitle, {
            fontSize: 28 * fontScale,
            lineHeight: 36 * fontScale,
            marginBottom: 12 * layoutScale,
          }]}>
            Connection Established!
          </Text>

          <Text style={[styles.successMessage, {
            fontSize: 14 * fontScale,
            lineHeight: 20 * fontScale,
            marginBottom: 20 * layoutScale,
          }]}>
            Your connection has been successfully established.
          </Text>

          {/* Done button */}
          <TouchableOpacity
            style={[styles.doneButton, {
              borderRadius: 25 * layoutScale,
              paddingVertical: 14 * layoutScale,
              marginTop: 20 * layoutScale,
            }]}
            onPress={handleDone}
          >
            <Text style={[styles.doneButtonText, {
              fontSize: 16 * fontScale,
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
    backgroundColor: '#10B981',
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
  connectionCardContainer: {
    width: '100%',
    marginVertical: 10,
  },
  connectionPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  connectionAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionInfo: {
    flex: 1,
  },
  connectionTitle: {
    fontWeight: 'bold',
    fontFamily: 'Poppins',
    color: '#1F2937',
  },
  connectionSubtitle: {
    color: '#6B7280',
    fontFamily: 'Poppins',
    fontWeight: '400',
  },
  doneButton: {
    backgroundColor: '#7C3AED',
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

export default ConnectionSuccessModal;

