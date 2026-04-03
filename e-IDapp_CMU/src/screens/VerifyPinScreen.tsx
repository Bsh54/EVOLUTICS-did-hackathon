import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { verifyPin, STORAGE_KEYS } from '../utils/localStorage';
import { getSecureItem } from '../utils/secureStorage';
import { initializeAgent } from '../store/slices/credoSlice';
import { AppDispatch, RootState } from '../store';
import { useAgentInitialization } from '../hooks/useAgentInitialization';
import { credoAgentService } from '../services/agent';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Reference dimensions based on iPhone SE (375x667) for baseline compatibility
const guideWidth = 375;
const guideHeight = 667;

// Uniform scaling factor for layout elements (caps at 1.2 to prevent excessive growth on large tablets)
const layoutScale = Math.min(
  Math.min(screenWidth / guideWidth, screenHeight / guideHeight),
  1.2,
);

// Font scaling uses PixelRatio for density-aware adjustment (accounts for accessibility and device density)
const fontScale = Math.min(
  PixelRatio.getFontScale() * (screenWidth / guideWidth),
  1.5,
); // Cap to avoid overly large fonts

// Icon scaling with PixelRatio for sharper vectors on high-density screens
const iconScale = Math.min(PixelRatio.get() * (screenWidth / guideWidth), 1.2);

interface VerifyPinScreenProps {
  navigation?: any;
}

const VerifyPinScreen: React.FC<VerifyPinScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const userData = useSelector((state: RootState) => state.user);
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // Ensure agent is initialized when this screen loads
  useAgentInitialization();

  const handlePinChange = (value: string, index: number) => {
    if (value.length > 1) return; // Only allow single digit

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError('');

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

  const startShakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNext = async () => {
    const pinString = pin.join('');
    if (pinString.length === 6) {
      setIsVerifying(true);
      try {
        const isValid = await verifyPin(pinString);

        if (isValid) {
          // Initialize the agent after successful PIN verification
          console.log('PIN verified successfully, initializing agent...');
          try {
            const initResult = await dispatch(initializeAgent({
              label: userData.name || 'PolyID Holder',
              pin: pinString,
              endpoints: []
            })).unwrap();
            console.log('Agent initialized successfully after PIN verification:', initResult);

            // Verify agent is actually initialized before navigating
            const agentInitialized = credoAgentService.isAgentInitialized();
            if (!agentInitialized) {
              console.warn('Agent service reports not initialized, retrying...');
              // Small delay and check again
              await new Promise(resolve => setTimeout(resolve, 500));
              const retryCheck = credoAgentService.isAgentInitialized();
              if (!retryCheck) {
                console.error('Agent still not initialized after PIN verification');
              }
            }
          } catch (agentError) {
            console.error('Error initializing agent:', agentError);
            // Continue to DrawerNavigator even if agent init fails
            // useAgentInitialization hook will retry
          }

          navigation?.navigate?.('DrawerNavigator');
        } else {
          setError('Incorrect PIN. Please try again.');
          startShakeAnimation();
          // Clear PIN inputs
          setPin(['', '', '', '', '', '']);
          // Focus on first input
          inputRefs.current[0]?.focus();
        }
      } catch (error) {
        console.error('PIN verification error:', error);
        setError('Error verifying PIN. Please try again.');
        startShakeAnimation();
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const handleBiometricAuth = () => {
    navigation?.navigate?.('FaceScan', { mode: 'verify' });
  };

  const WalletIllustration = () => (
    <View
      style={[
        styles.illustrationContainer,
        {
          marginTop: 20 * layoutScale,
          marginBottom: 20 * layoutScale,
        },
      ]}
    >
      <Image
        source={require('../assets/images/vault.png')}
        style={[
          styles.illustrationImage,
          {
            width: Math.min(screenWidth * 0.9, 420 * layoutScale),
            height: Math.min(screenHeight * 0.32, 260 * layoutScale),
          },
        ]}
      />
    </View>
  );

  const isPinComplete = pin.every(digit => digit !== '');

  return (
    <View style={styles.container}>
      {/* Gradient background (top emphasis) */}
      <LinearGradient
        colors={['#5B18B8CC', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.6 }}
        style={[styles.gradient, { height: screenHeight * 0.58 }]} // Percentage-based for all devices
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
          <View
            style={[
              styles.topSection,
              {
                paddingHorizontal: 24 * layoutScale,
                paddingTop: 10 * layoutScale,
              },
            ]}
          >
            <View style={[styles.header, { paddingTop: 8 * layoutScale }]}>
              <Text
                style={[
                  styles.headerTitle,
                  {
                    fontSize: 28 * fontScale,
                    lineHeight: 48 * fontScale,
                    letterSpacing: -0.352 * fontScale,
                  },
                ]}
              >
                Enter PIN
              </Text>
            </View>
            <WalletIllustration />
          </View>

          {/* Bottom sheet */}
          <View
            style={[
              styles.bottomSheet,
              {
                marginTop: 10 * layoutScale,
                borderTopLeftRadius: 28 * layoutScale,
                borderTopRightRadius: 28 * layoutScale,
                paddingHorizontal: 20 * layoutScale,
                paddingTop: 24 * layoutScale,
                paddingBottom:
                  Platform.OS === 'ios' ? 40 * layoutScale : 28 * layoutScale,
                shadowOffset: { width: 0, height: -4 * layoutScale },
                shadowRadius: 12 * layoutScale,
              },
            ]}
          >
            <View
              style={[styles.inputSection, { marginBottom: 10 * layoutScale }]}
            >
              <Animated.View
                style={[
                  styles.otpContainer,
                  {
                    marginBottom: 20 * layoutScale,
                    paddingHorizontal: 10 * layoutScale,
                    transform: [{ translateX: shakeAnimation }],
                  },
                ]}
              >
                {pin.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref: any) => (inputRefs.current[index] = ref)}
                    style={[
                      styles.otpInput,
                      {
                        width: 45 * layoutScale,
                        height: 45 * layoutScale,
                        borderRadius: 8 * layoutScale,
                        fontSize: 18 * fontScale,
                      },
                      digit ? styles.otpInputFilled : null,
                      error ? styles.otpInputError : null,
                    ]}
                    value={digit}
                    onChangeText={value => handlePinChange(value, index)}
                    onKeyPress={({ nativeEvent }) =>
                      handleKeyPress(nativeEvent.key, index)
                    }
                    keyboardType="numeric"
                    maxLength={1}
                    textAlign="center"
                    secureTextEntry
                    autoFocus={index === 0}
                    editable={!isVerifying}
                  />
                ))}
              </Animated.View>

              {error ? (
                <View style={{ alignItems: 'flex-start' }}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity
                    style={[
                      {
                        marginTop: 20 * layoutScale,
                        paddingLeft: 10 * layoutScale,
                      },
                    ]}
                    onPress={() => navigation.navigate('Onboarding')}
                  >
                    <Text style={styles.createWalletButtonText}>
                      Create new wallet
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      {
                        marginTop: 10 * layoutScale,
                        paddingLeft: 10 * layoutScale,
                      },
                    ]}
                    onPress={() => navigation.navigate('RestoreWallet')}
                  >
                    <Text style={styles.createWalletButtonText}>
                      Restore Wallet
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ alignItems: 'flex-start' }}>
                  <Text
                    style={[
                      styles.inputDescription,
                      {
                        fontSize: 14 * fontScale,
                        lineHeight: 18 * fontScale,
                        letterSpacing: -0.132 * fontScale,
                        paddingLeft: 10 * layoutScale,
                      },
                    ]}
                  >
                    Enter your PIN to verify your identity.
                  </Text>

                  <TouchableOpacity
                    style={[
                      {
                        marginTop: 5 * layoutScale,
                        paddingTop: 10 * layoutScale,
                        paddingLeft: 10 * layoutScale,
                      },
                    ]}
                    onPress={() => navigation.navigate('Onboarding')}
                  >
                    <Text style={styles.createWalletButtonText}>
                      Create new wallet
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      {
                        marginTop: 5 * layoutScale,
                        paddingLeft: 10 * layoutScale,
                      },
                    ]}
                    onPress={() => navigation.navigate('RestoreWallet')}
                  >
                    <Text style={styles.createWalletButtonText}>
                      Restore Wallet
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Verify PIN button aligned to bottom-right */}
            <View style={[styles.buttonRow, { paddingTop: 20 * layoutScale, justifyContent: 'flex-end' }]}>
              {/* <TouchableOpacity
                onPress={handleBiometricAuth}
                style={[
                  styles.biometricButton,
                  {
                    marginRight: 'auto', // Push valid button to right
                    padding: 10 * layoutScale,
                  }
                ]}
              >
                <MaterialIcons
                  name="face"
                  size={32 * iconScale}
                  color="#5B18B8"
                />
                <Text style={[styles.biometricText, { fontSize: 12 * fontScale }]}>Face ID</Text>
              </TouchableOpacity> */}

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
                    (!isPinComplete || isVerifying) && styles.nextButtonDisabled,
                  ]}
                  onPress={handleNext}
                  disabled={!isPinComplete || isVerifying}
                >
                  {({ pressed }) => (
                    <View style={styles.buttonContent}>
                      {isVerifying ? (
                        <ActivityIndicator size="small" color={pressed ? '#FEAA05' : '#FFFFFF'} />
                      ) : (
                        <>
                          <Text
                            style={[
                              styles.nextButtonText,
                              pressed && styles.nextButtonTextPressed,
                            ]}
                          >
                            Verify PIN
                          </Text>
                          <MaterialIcons
                            name="arrow-forward"
                            size={18 * iconScale}
                            color={pressed ? '#FEAA05' : '#FFFFFF'}
                            style={{ marginLeft: 8 }}
                          />
                        </>
                      )}
                    </View>
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
    justifyContent: 'center', // Center the title
    paddingTop: 8,
  },
  headerTitle: {
    fontWeight: '500',
    color: '#FFFFFF',
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
  otpInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputDescription: {
    color: '#A0A0A0',
    textAlign: 'left',
    fontFamily: 'Poppins',
    fontWeight: '400',
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'left',
    fontFamily: 'Poppins',
    fontWeight: '400',
    fontSize: 14,
    paddingLeft: 10 * layoutScale,
  },
  resendContainer: {
    alignItems: 'flex-start',
  },
  resendText: {
    color: '#7C3AED',
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  buttonRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  biometricButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricText: {
    marginTop: 4,
    color: '#5B18B8',
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: '#6D2CC8',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 28,
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
    fontSize: 16,
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
  gradientBorder: {
    borderRadius: 35,
    padding: 4,
  },
  createWalletButtonText: {
    color: '#7C3AED',
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default VerifyPinScreen;
