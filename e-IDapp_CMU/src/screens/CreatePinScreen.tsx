import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  PixelRatio,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { RootState } from '../store';
import { setUserPin } from '../store/slices/userSlice';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Reference dimensions based on iPhone SE (375x667) for baseline compatibility
const guideWidth = 375;
const guideHeight = 667;

// Uniform scaling factor for layout elements (caps at 1.2 to prevent excessive growth on large tablets)
const layoutScale = Math.min(Math.min(screenWidth / guideWidth, screenHeight / guideHeight), 1.2);

// Font scaling uses PixelRatio for density-aware adjustment (accounts for accessibility and device density)
const fontScale = Math.min(PixelRatio.getFontScale() * (screenWidth / guideWidth), 1.5); // Cap to avoid overly large fonts

// Icon scaling with PixelRatio for sharper vectors on high-density screens
const iconScale = Math.min(PixelRatio.get() * (screenWidth / guideWidth), 1.2);

interface CreatePinScreenProps {
  navigation?: any;
}

const CreatePinScreen: React.FC<CreatePinScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handlePinChange = (value: string, index: number) => {
    if (value.length > 1) return; // Only allow single digit

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleNext = () => {
    const pinString = pin.join('');
    if (pinString.length === 6) {
      dispatch(setUserPin(pinString)); // This will also save the PIN to AsyncStorage
      navigation?.navigate?.('Passphrase');
    }
  };

  const handleBack = () => {
    navigation?.goBack?.();
  };

  const WalletIllustration = () => (
    <View style={[styles.illustrationContainer, {
      marginTop: '5%',
      marginBottom: '5%',
    }]}>
      <Image
        source={require('../assets/images/vault.png')}
        style={[styles.illustrationImage, {
          width: '95%',
          height: undefined,
          aspectRatio: 1.6,
          maxWidth: 420,
        }]}
      />
    </View>
  );

  const isPinComplete = pin.every(digit => digit !== '');

  return (
    <View style={styles.container}>

      {/* Gradient background (top emphasis) */}
      <LinearGradient
        colors={["#5B18B8CC", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.6 }}
        style={[styles.gradient, { height: '58%' }]} // Percentage-based for all devices
      />

      {/* Foreground content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flexOne}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20 * layoutScale}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top section over gradient */}
          <View style={[styles.topSection, {
            paddingHorizontal: '6%',
            paddingTop: screenHeight * 0.01,
          }]}>
            <View style={[styles.header, { paddingTop: '2%' }]}>
              <TouchableOpacity
                style={[styles.backButton, {
                  padding: '2%',
                  borderRadius: 20,
                }]}
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="arrow-back"
                  size={24 * iconScale}
                  color="#fffdfdff" // Changed to black
                />
              </TouchableOpacity>
            </View>
            <WalletIllustration />

            <View style={[styles.inputSection, { marginBottom: 10 * layoutScale, marginTop: '10%' }]}>
              <Text style={[styles.headerTitle, {
                fontSize: screenWidth < 360 ? 24 : 28,
                lineHeight: screenWidth < 360 ? 36 : 48,
                letterSpacing: -0.35,
                marginLeft: '3%',
              }]}>Create PIN</Text>
              <View style={[styles.otpContainer, {
                marginTop: '5%',
                marginBottom: '5%',
                paddingHorizontal: '3%',
              }]}>
                {pin.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref: any) => (inputRefs.current[index] = ref)}
                    style={[
                      styles.otpInput, {
                        width: screenWidth < 360 ? '14%' : '15%',
                        height: undefined,
                        aspectRatio: 1,
                        borderRadius: 8,
                        fontSize: 18 * fontScale,
                      },
                      digit ? styles.otpInputFilled : null
                    ]}
                    value={digit}
                    onChangeText={(value) => handlePinChange(value, index)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                    keyboardType="numeric"
                    maxLength={1}
                    textAlign="center"
                    secureTextEntry
                    autoFocus={index === 0}
                  />
                ))}
              </View>
              <Text style={[styles.inputDescription, {
                fontSize: screenWidth < 360 ? 12 : 14,
                lineHeight: screenWidth < 360 ? 16 : 18,
                letterSpacing: -0.13,
                marginLeft: '3%',
              }]}>
                Create a secure PIN to protect your wallet.
              </Text>
              <TouchableOpacity style={[styles.resendContainer, { marginTop: '4%' }]} onPress={() => navigation?.navigate?.('RestoreWallet')}>
                <Text style={[styles.resendText, { fontSize: screenWidth < 360 ? 12 : 14, marginLeft: '3%', }]}>
                  Resend PIN.
                </Text>
              </TouchableOpacity>
            </View>

            {/* Set PIN button aligned to bottom-right */}
            <View style={styles.buttonWrapper}>
              <LinearGradient
                colors={['#FFEA60', '#FEAA05']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBorder}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.nextButton,
                    pressed && styles.nextButtonPressed,
                    !isPinComplete && styles.nextButtonDisabled,
                  ]}
                  onPress={handleNext}
                  disabled={!isPinComplete}
                >
                  {({ pressed }) => (
                    <Text
                      style={[
                        styles.nextButtonText,
                        pressed && styles.nextButtonTextPressed,
                      ]}
                    >
                      Set PIN
                    </Text>
                  )}
                </Pressable>
              </LinearGradient>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flexOne: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topSection: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Keep space-between for positioning
    paddingTop: 8,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Changed to white
  },
  headerTitle: {
    fontWeight: '500',
    color: '#8654ca',
    fontFamily: 'Alumni Sans',
    fontStyle: 'normal',
  },
  illustrationContainer: {
    alignItems: 'center',
  },
  illustrationImage: {},
  bottomSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    elevation: 2,
  },
  inputSection: {
    flex: 1,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    fontWeight: '600',
    color: '#2D3748',
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: '#7C3AED',
    backgroundColor: '#F8F4FF',
  },
  inputDescription: {
    color: '#000000',
    textAlign: 'left',
    fontFamily: 'Poppins',
    fontWeight: '400',
  },
  resendContainer: {
    alignItems: 'flex-start',
  },
  resendText: {
    color: '#7C3AED',
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  buttonWrapper: {
    marginTop: 10,
    alignSelf: 'flex-end',
    paddingBottom: 20,
  },
  gradientBorder: {
    borderRadius: 35,
    padding: 4, // 4px border width
  },
  nextButton: {
    backgroundColor: '#6D2CC8',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 40,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonPressed: {
    backgroundColor: '#8B4DD8',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  nextButtonTextPressed: {
    color: '#FEAA05',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CreatePinScreen;