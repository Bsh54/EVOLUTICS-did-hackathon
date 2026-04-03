import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, PixelRatio } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { CredentialsFullList } from '../features/credential-connection';

const { width: screenWidth } = Dimensions.get('window');
const guideWidth = 375;
const guideHeight = 667;
const layoutScale = Math.min(Math.min(screenWidth / guideWidth, Dimensions.get('window').height / guideHeight), 1.2);
const fontScale = Math.min(PixelRatio.getFontScale() * (screenWidth / guideWidth), 1.5);
const iconScale = Math.min(PixelRatio.get() * (screenWidth / guideWidth), 1.2);

type CredentialsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Credentials'>;

const CredentialsScreen = () => {
  const navigation = useNavigation<CredentialsScreenNavigationProp>();

  // Header component for CredentialsFullList
  const headerComponent = (
    <View style={[ styles.header, {
      paddingHorizontal: 16 * layoutScale,
      marginBottom: 20 * layoutScale,
    } ]}>
      <TouchableOpacity
        style={[ styles.headerButton, {
          width: 40 * layoutScale,
          height: 40 * layoutScale,
          borderRadius: 20 * layoutScale,
        } ]}
        onPress={() => navigation.goBack()}
      >
        <MaterialIcons name="arrow-back" size={20 * iconScale} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={[ styles.headerTitle, {
        fontSize: 18 * fontScale,
        lineHeight: 24 * fontScale,
      } ]}>
        View Credential List
      </Text>
      <TouchableOpacity
        style={[ styles.headerButton, {
          width: 40 * layoutScale,
          height: 40 * layoutScale,
          borderRadius: 20 * layoutScale,
        } ]}
      >
        <MaterialIcons name="more-vert" size={20 * iconScale} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <CredentialsFullList
      navigation={navigation}
      headerComponent={headerComponent}
    />
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Poppins',
    textAlign: 'center',
  },
});

export default CredentialsScreen;