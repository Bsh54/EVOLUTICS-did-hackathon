import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface QuickActionButtonProps {
  icon: ImageSourcePropType | string;
  label: string;
  onPress: () => void;
  layoutScale: number;
  fontScale: number;
  isActive?: boolean;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon,
  label,
  onPress,
  layoutScale,
  fontScale,
  isActive = false,
}) => {
  const isImageIcon = typeof icon !== 'string';

  return (
    <TouchableOpacity
      style={[styles.container, { width: 80 * layoutScale }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer,
        {
          width: 52 * layoutScale,
          height: 52 * layoutScale,
          borderRadius: 26 * layoutScale,
          marginBottom: 6 * layoutScale,
          backgroundColor: isActive ? '#5B18B8' : '#FFFFFF',
          borderWidth: isActive ? 0 : 1,
          borderColor: '#F3F4F6',
        }
      ]}>
        {isImageIcon ? (
          <Image
            source={icon as ImageSourcePropType}
            style={{ 
              width: 32 * layoutScale, 
              height: 32 * layoutScale,
              tintColor: isActive ? '#FFFFFF' : undefined 
            }}
            resizeMode="contain"
          />
        ) : (
          <MaterialIcons
            name={icon as string}
            size={28 * layoutScale}
            color={isActive ? '#FFFFFF' : '#7C3AED'}
          />
        )}
      </View>
      <Text
        style={[
          styles.label, 
          { 
            fontSize: 11 * fontScale,
            color: isActive ? '#5B18B8' : '#1F2937',
            fontWeight: isActive ? '700' : '500',
          }
        ]}
        numberOfLines={2}
        textAlign="center"
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    color: '#1F2937',
    fontFamily: 'Poppins',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default QuickActionButton;

