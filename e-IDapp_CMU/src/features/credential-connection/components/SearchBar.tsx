import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  layoutScale: number;
  fontScale: number;
  iconScale: number;
  marginHorizontal?: number;
  marginBottom?: number;
}

/**
 * Reusable search bar component for credential/connection search
 * Consistent styling across all screens
 */
const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search',
  value,
  onChangeText,
  layoutScale,
  fontScale,
  iconScale,
  marginHorizontal = 16,
  marginBottom = 20,
}) => {
  return (
    <View style={[styles.searchContainer, {
      marginHorizontal: marginHorizontal * layoutScale,
      borderRadius: 12 * layoutScale,
      paddingHorizontal: 16 * layoutScale,
      marginBottom: marginBottom * layoutScale,
    }]}>
      <MaterialIcons
        name="search"
        size={22 * iconScale}
        color="#9CA3AF"
        style={[styles.searchIcon, { marginRight: 12 * layoutScale }]}
      />
      <TextInput
        style={[styles.searchInput, {
          fontSize: 16 * fontScale,
          paddingVertical: 14 * layoutScale,
        }]}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins',
    color: '#1F2937',
  },
});

export default SearchBar;

