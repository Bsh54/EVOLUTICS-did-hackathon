import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Dimensions,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useDispatch } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Clipboard from '@react-native-clipboard/clipboard';
import { setPassphrase } from '../store/slices/userSlice';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Word list for generating random passphrase
const wordList = [
  'piano', 'apple', 'lion', 'eagle', 'tiger', 'dream', 'flute', 'river', 'flame',
  'roller', 'hunt', 'salt', 'ocean', 'forest', 'mountain', 'cloud', 'thunder',
  'silver', 'golden', 'crystal', 'shadow', 'spark', 'harmony', 'wisdom', 'brave',
  'gentle', 'swift', 'ancient', 'bright', 'calm', 'dance', 'echo', 'frost',
  'garden', 'harbor', 'island', 'jungle', 'knight', 'lantern', 'mirror', 'noble',
  'orbit', 'pearl', 'quest', 'riddle', 'sunset', 'temple', 'unity', 'voyage',
  'wonder', 'zenith', 'anchor', 'breeze', 'castle', 'dolphin', 'ember', 'falcon'
];

interface PassphraseScreenProps {
  navigation?: any;
}

const PassphraseScreen: React.FC<PassphraseScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const [showPassphrase, setShowPassphrase] = useState(false); // Hidden by default
  const [hasSaved, setHasSaved] = useState(false);

  // Generate random mnemonic once when component mounts
  const mnemonic = useMemo(() => {
    const shuffled = [...wordList].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 12);
  }, []);

  const handleCopy = () => {
    Clipboard.setString(mnemonic.join(' '));
    Alert.alert('Success', 'Passphrase copied to clipboard');
  };

  const handleContinue = () => {
    if (hasSaved) {
      dispatch(setPassphrase(mnemonic.join(' ')));
      navigation?.navigate?.('ChooseLanguage');
    } else {
      Alert.alert('Reminder', 'Please confirm that you have saved your passphrase.');
    }
  };

  const handleBack = () => {
    navigation?.goBack?.();
  };

  // Generate noise dots for texture effect
  const generateNoiseDots = () => {
    const dots = [];
    for (let i = 0; i < 150; i++) {
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const size = Math.random() * 1.5 + 0.5;
      const opacity = Math.random() * 0.3 + 0.1;
      dots.push(
        <View
          key={i}
          style={{
            position: 'absolute',
            left: `${left}%`,
            top: `${top}%`,
            width: size,
            height: size,
            borderRadius: size / 1,
            backgroundColor: `rgba(100, 100, 100, ${opacity})`,
          }}
        />
      );
    }
    return dots;
  };

  return (
    <View style={styles.container}>
      {/* Background gradient - positioned absolute */}
      <LinearGradient
        colors={["#8B5CCD", "#D6C5F6", "#FFFFFF"]}
        locations={[0, 0.5, 1]}
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
          <Text style={styles.title}>Save your passphrase</Text>
          <Text style={styles.subtitle}>
            This is your recovery passphrase. Store it safely.
          </Text>
        </View>

        {/* Words Card */}
        <View style={styles.cardContainer}>
          {/* Noise texture overlay */}
          <View style={styles.noiseOverlay} pointerEvents="none">
            {generateNoiseDots()}
          </View>

          {!showPassphrase ? (
            <View style={styles.hiddenCard}>
              <Text style={styles.hiddenTextTitle}>Write it Down</Text>
              <Text style={styles.hiddenTextDesc}>
                Make sure no one is watching this phrase gives full access to your app. Never share it with anyone.
              </Text>
              <TouchableOpacity style={styles.showButton} onPress={() => setShowPassphrase(true)}>
                <MaterialIcons name="visibility" size={20} color="#000000" />
                <Text style={styles.showButtonText}>Show</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.wordsGrid}>
                {mnemonic.map((word, index) => (
                  <View key={index} style={styles.wordItem}>
                    <Text style={styles.wordIndex}>{index + 1}.</Text>
                    <Text style={styles.wordText}>{word}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
                <MaterialIcons name="content-copy" size={18} color="#666666" />
                <Text style={styles.copyButtonText}>copy to clipboard</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Warning Box */}
        <View style={styles.warningBox}>
          <MaterialIcons name="warning" size={22} color="#FFFFFF" />
          <Text style={styles.warningText}>
            Never share your passphrase. If lost, you won't be able to recover your identity.
          </Text>
        </View>

        {/* Bottom Section with Checkbox and Button */}
        <View style={styles.confirmationSection}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setHasSaved(!hasSaved)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, hasSaved && styles.checkboxActive]}>
              {hasSaved && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
            </View>
            <Text style={styles.checkboxText}>
              I have saved my passphrase in a secure location
            </Text>
          </TouchableOpacity>

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
                  !hasSaved && styles.buttonDisabled,
                ]}
                onPress={handleContinue}
                disabled={!hasSaved}
              >
                {({ pressed }) => (
                  <View style={styles.buttonContent}>
                    <Text
                      style={[
                        styles.continueButtonText,
                        pressed && styles.continueButtonTextPressed,
                      ]}
                    >
                      Continue
                    </Text>
                    <MaterialIcons
                      name="arrow-forward"
                      size={20}
                      color={pressed ? '#FEAA05' : '#FFFFFF'}
                      style={{ marginLeft: 8 }}
                    />
                  </View>
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
    height: screenHeight * 0.65,
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
    marginBottom: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontStyle: 'italic',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#5B18B8',
    lineHeight: 20,
  },
  cardContainer: {
    backgroundColor: '#F5F3F7',
    borderRadius: 29,
    borderWidth: 1,
    borderColor: '#B7B5BA',
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 20,
    minHeight: 280,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  noiseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  hiddenCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiddenTextTitle: {
    fontSize: 20,
    fontFamily: 'Poppins',
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  hiddenTextDesc: {
    fontSize: 16,
    fontFamily: 'Poppins',
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
    marginBottom: 30,
    width: '80%',
  },
  showButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 'auto',
    borderRadius: 30,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  showButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  wordItem: {
    width: '31%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  wordIndex: {
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#A0A0A0',
    marginRight: 6,
  },
  wordText: {
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#000000',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingVertical: 14,
    backgroundColor: '#FAFAFA',
  },
  copyButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins',
    fontWeight: '500',
    color: '#333333',
    marginLeft: 8,
  },
  warningBox: {
    backgroundColor: '#FEAA05',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#FFFFFF',
    marginLeft: 12,
    lineHeight: 20,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D1D1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: '#6D2CC8',
    borderColor: '#6D2CC8',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#333333',
    lineHeight: 22,
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
    flexDirection: 'row',
  },
  continueButtonPressed: {
    backgroundColor: '#9B6DD8',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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

export default PassphraseScreen;