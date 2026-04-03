/**
 * Mock for React Native Vector Icons
 * 
 * Provides a mock implementation of vector icons for testing purposes.
 * Returns a simple Text component with the icon name for snapshot testing.
 */

import React from 'react';
import { Text } from 'react-native';

const iconMock = ({ name, ...props }) => {
    return React.createElement(Text, props, name);
};

export default iconMock;

// Mock all icon libraries
export const MaterialIcons = iconMock;
export const Ionicons = iconMock;
export const FontAwesome = iconMock;
export const FontAwesome5 = iconMock;
export const Feather = iconMock;
export const MaterialCommunityIcons = iconMock;
