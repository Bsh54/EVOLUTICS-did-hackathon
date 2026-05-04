import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PixelRatio,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');
const guideWidth = 375;
const layoutScale = Math.min(screenWidth / guideWidth, 1.2);
const iconScale = Math.min(PixelRatio.get() * (screenWidth / guideWidth), 1.2);

const FloatingQRButton: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFEA60', '#FEAA05']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Scan QR')}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="qr-code-scanner"
            size={28 * iconScale}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30 * layoutScale,
    alignSelf: 'center',
    zIndex: 999,
  },
  gradientBorder: {
    borderRadius: 35 * layoutScale,
    padding: 4 * layoutScale,
    shadowColor: '#FEAA05',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  button: {
    backgroundColor: '#5B18B8',
    width: 60 * layoutScale,
    height: 60 * layoutScale,
    borderRadius: 30 * layoutScale,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FloatingQRButton;

