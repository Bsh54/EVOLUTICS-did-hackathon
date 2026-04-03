import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  useWindowDimensions,
  Platform,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import LinearGradient from 'react-native-linear-gradient';

type OnboardingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

const OnboardingScreen: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation<OnboardingScreenNavigationProp>();

  // Create styles with current dimensions
  const styles = React.useMemo(() => createStyles(width, height), [width, height]);

  const handleCreateWallet = () => {
    navigation.navigate('PrivacyPolicy');
  };

  const handleRestoreWallet = () => {
    // Implement restore wallet functionality
    navigation.navigate('RestoreWallet');
    console.log('Restore wallet');
  };

  return (
    <ImageBackground
      source={require('../assets/images/main_screen.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.content}>

        {/* Bottom Section - Positioned at bottom */}
        <View style={styles.bottomSection}>
          {/* Tagline */}
          <Text style={styles.taglineText}>One Wallet, Infinite Possibilities.</Text>

          {/* Create Wallet Button with gradient border */}
          <LinearGradient
            colors={['#FFEA60', '#FEAA05']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            <Pressable
              style={({ pressed }) => [
                styles.createButton,
                pressed && styles.createButtonPressed,
              ]}
              onPress={handleCreateWallet}
            >
              {({ pressed }) => (
                <Text
                  style={[
                    styles.createButtonText,
                    pressed && styles.createButtonTextPressed,
                  ]}
                >
                  Create Wallet
                </Text>
              )}
            </Pressable>
          </LinearGradient>

          {/* Restore Wallet Link */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestoreWallet}
          >
            <Text style={styles.restoreText}>Restore wallet</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const createStyles = (width: number, height: number) => StyleSheet.create({
  container: {
    flex: 1,
    maxHeight: height,
    maxWidth: width,
  },
  backgroundImage: {
    flex: 1,
    width: width,  // Full screen width
    height: height,  // Full screen height
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    justifyContent: 'flex-end',  // Push content to bottom
  },
  faceContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
  },
  faceImageContainer: {
    position: 'relative',
    width: 200,
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  faceImage: {
    width: '100%',
    height: '100%',
  },
  faceOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: 'white',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: 'white',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: 'white',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: 'white',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  qrCodeWrapper: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: Platform.OS === 'android' ? 5 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  qrImage: {
    width: 120,
    height: 120,
  },
  credentialsContainer: {
    marginBottom: 30,
  },
  credentialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  credentialCard: {
    backgroundColor: '#D6C5F6',
    borderRadius: 40,
    padding: 12,
    width: (width - 60) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: Platform.OS === 'android' ? 3 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  credentialIcon: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  credentialIconText: {
    fontSize: 14,
  },
  credentialInfo: {
    flex: 1,
  },
  credentialTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000000ff',
    marginBottom: 2,
  },
  credentialSubtitle: {
    fontSize: 9,
    color: '#000000ff',
    marginBottom: 2,
  },
  credentialDate: {
    fontSize: 9,
    color: '#000000ff',
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  taglineText: {
    color: 'black',
    fontSize: 21,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 21,  // 100% of font-size
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0,
  },
  gradientBorder: {
    borderRadius: 50,
    padding: 5,  // This creates the gradient border width
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#6D2CC8',
    borderRadius: 45,
    width: 230,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonPressed: {
    backgroundColor: '#8B4DD8',  // Lighter purple on press
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  createButtonTextPressed: {
    color: '#FEAA05',  // Gold color on press
  },
  restoreButton: {
    paddingVertical: 12,
  },
  restoreText: {
    color: 'black',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});

export default OnboardingScreen;