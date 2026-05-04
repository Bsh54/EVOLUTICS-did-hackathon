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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { RootState } from '../store';
import { setUserName } from '../store/slices/userSlice';

// Reference dimensions
const guideWidth = 375;
const guideHeight = 667;

interface EnterNameScreenProps {
  navigation?: any;
}

const EnterNameScreen: React.FC<EnterNameScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const userName = useSelector((state: RootState) => state.user.name);
  const firstName = useSelector((state: RootState) => state.user.firstName);
  const lastName = useSelector((state: RootState) => state.user.lastName);

  // Pre-fill name with API data if available
  const initialName = firstName && lastName
    ? `${firstName} ${lastName}`
    : userName;

  const [name, setName] = useState(initialName);

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

  const handleNext = () => {
    if (name.trim()) {
      dispatch(setUserName(name.trim()));
      navigation?.navigate?.('CreatePin');
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
          <Text style={styles.headerTitle}>Enter Name</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Name"
              placeholderTextColor="#B1B1B1"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>

          <Text style={styles.inputDescription}>
            Enter a name to personalize your wallet.
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
                  !name.trim() && styles.nextButtonDisabled,
                ]}
                onPress={handleNext}
                disabled={!name.trim()}
              >
                {({ pressed }) => (
                  <Text
                    style={[
                      styles.nextButtonText,
                      pressed && styles.nextButtonTextPressed,
                    ]}
                  >
                    Next
                  </Text>
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

export default EnterNameScreen;
