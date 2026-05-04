import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  PixelRatio,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { saveUserDataToStorage } from '../store/slices/userSlice';

const { width: screenWidth } = Dimensions.get('window');

// Reference dimensions
const guideWidth = 375;

const fontScale = Math.min(PixelRatio.getFontScale() * (screenWidth / guideWidth), 1.5);

interface SetupSuccessScreenProps {
  navigation?: any;
}

const SetupSuccessScreen: React.FC<SetupSuccessScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const userData = useSelector((state: RootState) => state.user);

  const handleAccept = () => {
    // Ensure data is saved to AsyncStorage
    dispatch(saveUserDataToStorage() as any);
    navigation?.navigate?.('Dashboard');
  };

  return (
    <View style={styles.container}>
      {/* Semi-transparent background overlay */}
      <View style={styles.overlay}>

        {/* Popup/Modal Content - Simple gray background as shown in image */}
        <View style={styles.popup}>
          <View style={styles.contentContainer}>
            {/* Notification Text */}
            <Text style={styles.notificationText}>
              User gets a popup/notification about incoming PolyID credential {`{${userData.name}, ${userData.email}, ${userData.polyIdUrl}, and other attributes}`}
            </Text>

            {/* Accept Button - Simple white button as shown in image */}
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAccept}
            >
              <Text style={styles.acceptButtonText}>
                Accept
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popup: {
    backgroundColor: '#d9d9d9', // Light gray background as shown in image
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    minHeight: 230, // Increased height for a taller popup
    justifyContent: 'center', // Center content vertically
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  notificationText: {
    color: '#000000',
    textAlign: 'center',
    fontSize: 18 * fontScale,
    fontWeight: '400',
    marginBottom: 24,
    lineHeight: 24 * fontScale,
  },
  acceptButton: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 50, // Fully rounded corners as shown in image
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    color: '#000000',
    fontSize: 16 * fontScale,
    fontWeight: '500',
  },
});

export default SetupSuccessScreen;