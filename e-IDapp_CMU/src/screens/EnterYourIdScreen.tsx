import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
  Platform,
  Image,
  PixelRatio,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { RootState } from '../store';
import { setUserName, setUserApiData } from '../store/slices/userSlice';
import { fetchUserById } from '../services/userApi';

// Reference dimensions
const guideWidth = 375;
const guideHeight = 667;

interface EnterYourIdScreenProps {
  navigation?: any;
}

const EnterYourIdScreen: React.FC<EnterYourIdScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const userName = useSelector((state: RootState) => state.user.name);
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Use dynamic window dimensions for responsive layout
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Calculate responsive scaling factors based on current screen dimensions
  const layoutScale = Math.min(
    Math.min(screenWidth / guideWidth, screenHeight / guideHeight),
    1.2,
  );
  const fontScale = Math.min(
    PixelRatio.getFontScale() * (screenWidth / guideWidth),
    1.5,
  );
  const iconScale = Math.min(PixelRatio.get() * (screenWidth / guideWidth), 1.2);


  const handleNext = async () => {
    if (userId.trim()) {
      setIsLoading(true);
      try {
        // Call API to fetch user data
        const userData = await fetchUserById(userId.trim());

        console.log('User data:', userData);

        // Store API data in Redux
        dispatch(setUserApiData({
          firstName: userData.firstName,
          lastName: userData.lastName,
          photo: userData.photo,
          uniqueIdentifier: userData.uniqueIdentifier,
        }));

        // Navigate to EnterNameScreen
        navigation?.navigate?.('EnterName');
      } catch (error: any) {
        console.error('Error fetching user data:', error);

        // Extract error message
        let errorMessage = 'Failed to fetch user data. Please try again.';

        if (error.message) {
          // Check for specific error messages
          if (error.message.includes('Holder not found')) {
            errorMessage = 'User ID not found. Please check the ID and try again.';
          } else if (error.message.includes('Network')) {
            errorMessage = 'Network error. Please check your internet connection.';
          } else {
            errorMessage = error.message;
          }
        }

        Alert.alert(
          'Error',
          errorMessage,
          [{ text: 'OK' }]
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8B5CCD', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.5 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.headerTitle}>Enter Unique ID</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Enter Unique ID"
              placeholderTextColor="#B1B1B1"
              value={userId}
              onChangeText={setUserId}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              editable={!isLoading}
            />
          </View>

          <Text style={styles.inputDescription}>
            Enter a unique ID to personalize your wallet.
          </Text>

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
                  (!userId.trim() || isLoading) && styles.nextButtonDisabled,
                ]}
                onPress={handleNext}
                disabled={!userId.trim() || isLoading}
              >
                {({ pressed }) => (
                  <>
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text
                        style={[
                          styles.nextButtonText,
                          pressed && styles.nextButtonTextPressed,
                        ]}
                      >
                        Next
                      </Text>
                    )}
                  </>
                )}
              </Pressable>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <Image
            source={require('../assets/images/robot-removebg-preview.png')}
            style={styles.illustrationImage}
            resizeMode="contain"
          />
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  content: {
    flex: 0.6,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
    marginBottom: 25,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
  },
  textInput: {
    color: '#2D3748',
    fontSize: 18,
    fontFamily: 'Poppins',
    paddingHorizontal: 20,
    height: 60,
  },
  inputDescription: {
    color: '#5B18B8',
    fontSize: 16,
    fontFamily: 'Poppins',
    marginTop: 15,
  },
  buttonWrapper: {
    marginTop: 30,
    alignSelf: 'flex-end',
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
  bottomSection: {
    flex: 0.4,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
  },
});

export default EnterYourIdScreen;
