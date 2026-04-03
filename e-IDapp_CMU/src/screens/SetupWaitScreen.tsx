import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  PixelRatio,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { initializeAgent } from '../store/slices/credoSlice';
import { completeUserSetup } from '../store/slices/userSlice';
import { clearDatabase } from '../db';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Reference dimensions based on iPhone SE (375x667) for baseline compatibility
const guideWidth = 375;
const guideHeight = 667;

// Uniform scaling factor for layout elements (caps at 1.2 to prevent excessive growth on large tablets)
const layoutScale = Math.min(Math.min(screenWidth / guideWidth, screenHeight / guideHeight), 1.2);

// Font scaling uses PixelRatio for density-aware adjustment (accounts for accessibility and device density)
const fontScale = Math.min(PixelRatio.getFontScale() * (screenWidth / guideWidth), 1.5); // Cap to avoid overly large fonts

interface SetupWaitScreenProps {
  navigation?: any;
  route?: { params?: { invitationUrl?: string } };
}

const SetupWaitScreen: React.FC<SetupWaitScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [ , setCurrentStep ] = useState(0);
  const [ stepText, setStepText ] = useState('Initializing your wallet...');
  const userData = useSelector((state: RootState) => state.user);

  // Simulate setup progress with real wallet creation
  useEffect(() => {
    const setupWallet = async () => {
      try {
        // Remove Old Data
        try {
          await clearDatabase();
          console.log('Database cleared successfully');
        } catch (error) {
          console.error('Failed to clear database:', error);
        }
        // Step 1: Initialize
        setCurrentStep(0);
        setStepText('Initializing your wallet...');
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Step 2: Creating wallet
        setCurrentStep(1);
        setStepText('Creating secure storage...');
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Step 3: Setting up Basic Wallet
        setCurrentStep(2);
        setStepText('Setting up basic wallet...');

        // Initialize agent with name and PIN
        try {
          const initResult = await dispatch(initializeAgent({
            label: userData.name,
            pin: userData.pin,
            endpoints: []
          })).unwrap();
          console.log('SetupWaitScreen: initializeAgent result', initResult);
        } catch (error) {
          console.log('SetupWaitScreen: initializeAgent error', error);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 4: Finalizing
        setCurrentStep(3);
        setStepText('Finalizing your wallet...');

        // Complete user setup and save to localStorage
        dispatch(completeUserSetup());
        console.log('SetupWaitScreen: user setup completed with', { name: userData.name, pin: userData.pin });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Navigate to SetupSuccessScreen after setup is complete
        navigation?.navigate?.('DrawerNavigator');
      } catch (error) {
        console.error('Error during wallet setup:', error);
        setStepText('Error setting up wallet. Please try again.');
      }
    };

    setupWallet();
  }, [ dispatch, navigation, userData.name, userData.pin ]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Centered Illustration */}
        <View style={[ styles.illustrationContainer, {
          marginBottom: 30 * layoutScale,
        } ]}>
          <Image
            source={require('../assets/images/computer.png')}
            style={[ styles.illustrationImage, {
              width: Math.min(screenWidth * 0.6, 240 * layoutScale),
              height: Math.min(screenHeight * 0.3, 180 * layoutScale),
            } ]}
            resizeMode="contain"
          />
        </View>

        {/* Centered Content Section */}
        <View style={[ styles.textSection, {
          paddingHorizontal: 32 * layoutScale,
        } ]}>
          <Text style={[ styles.title, {
            fontSize: 24 * fontScale,
            lineHeight: 28 * fontScale,
            marginBottom: 12 * layoutScale,
            fontWeight: 'bold',
          } ]}>
            Setting up your wallet
          </Text>

          <Text style={[ styles.subtitle, {
            fontSize: 18 * fontScale,
            lineHeight: 22 * fontScale,
            fontWeight: '400',
            marginBottom: 24 * layoutScale,
          } ]}>
            {stepText}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationImage: {
    // Dynamic sizing handled in component
  },
  textSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#1F2937',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  subtitle: {
    color: 'black',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  loadingIndicator: {
    marginBottom: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '60%',
  },
  progressStep: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  progressStepActive: {
    backgroundColor: '#7C3AED',
  },
  progressStepInactive: {
    backgroundColor: '#D1D5DB',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SetupWaitScreen;