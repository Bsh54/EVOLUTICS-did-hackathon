import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { useDispatch } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { setLanguage } from '../store/slices/userSlice';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Available languages
const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
];

interface ChooseLanguageScreenProps {
  navigation?: any;
}

const ChooseLanguageScreen: React.FC<ChooseLanguageScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const handleContinue = () => {
    dispatch(setLanguage(selectedLanguage));
    navigation?.navigate?.('UploadProfileImage');
  };

  const handleBack = () => {
    navigation?.goBack?.();
  };

  return (
    <View style={styles.container}>
      {/* Background gradient - positioned absolute */}
      <LinearGradient
        colors={["#8B5CCD", "#D6C5F6", "#FFFFFF"]}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.backgroundGradient}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Title Section */}
        <View style={styles.topInfo}>
          <Text style={styles.title}>Choose Your Preferred Language</Text>
          <Text style={styles.subtitle}>
            You can change your language anytime from Settings.
          </Text>
        </View>

        {/* Language Grid */}
        <View style={styles.languageGrid}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageItem,
                selectedLanguage === lang.code && styles.languageItemSelected,
              ]}
              onPress={() => setSelectedLanguage(lang.code)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.languageText,
                  selectedLanguage === lang.code && styles.languageTextSelected,
                ]}
              >
                {lang.nativeName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Section with Button */}
        <View style={styles.confirmationSection}>
          <View style={styles.buttonWrapper}>
            <LinearGradient
              colors={['#FFEA60', '#FEAA05']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBorder}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.continueButton,
                  pressed && styles.continueButtonPressed,
                ]}
                onPress={handleContinue}
              >
                {({ pressed }) => (
                  <Text
                    style={[
                      styles.continueButtonText,
                      pressed && styles.continueButtonTextPressed,
                    ]}
                  >
                    Continue
                  </Text>
                )}
              </Pressable>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.55,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topInfo: {
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontStyle: 'italic',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#5B18B8',
    lineHeight: 20,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  languageItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageItemSelected: {
    borderColor: '#6D2CC8',
    borderWidth: 2,
    backgroundColor: '#F8F4FF',
  },
  languageText: {
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#333333',
  },
  languageTextSelected: {
    color: '#6D2CC8',
    fontWeight: '600',
  },
  confirmationSection: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E8E8E8',
    paddingVertical: 28,
    paddingHorizontal: 24,
    marginTop: 'auto',
    marginHorizontal: -24,
  },
  buttonWrapper: {
    width: '100%',
  },
  gradientBorder: {
    borderRadius: 32,
    padding: 4,
  },
  continueButton: {
    backgroundColor: '#8B5CCD',
    borderRadius: 28,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonPressed: {
    backgroundColor: '#9B6DD8',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  continueButtonTextPressed: {
    color: '#FEAA05',
  },
});

export default ChooseLanguageScreen;