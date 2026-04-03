import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface CategoryItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  layoutScale: number;
  fontScale: number;
  iconScale: number;
  color?: string;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  icon,
  label,
  onPress,
  layoutScale,
  fontScale,
  iconScale,
  color = '#7C3AED',
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, { width: 75 * layoutScale }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer,
        {
          width: 56 * layoutScale,
          height: 56 * layoutScale,
          borderRadius: 16 * layoutScale,
          backgroundColor: `${color}15`, // 15% opacity
          marginBottom: 8 * layoutScale,
        }
      ]}>
        <MaterialIcons
          name={icon as any}
          size={28 * iconScale}
          color={color}
        />
      </View>
      <Text
        style={[styles.label, { fontSize: 12 * fontScale }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: '#4B5563',
    fontFamily: 'Poppins',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default CategoryItem;

