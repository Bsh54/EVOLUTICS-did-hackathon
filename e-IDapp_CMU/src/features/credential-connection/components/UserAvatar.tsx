import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface UserAvatarProps {
  profileImage?: string;
  initials: string;
  size: number;
  layoutScale: number;
  showEditButton?: boolean;
  onEditPress?: () => void;
  variant?: 'light' | 'dark';
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  profileImage,
  initials,
  size,
  layoutScale,
  showEditButton = false,
  onEditPress,
  variant = 'light',
}) => {
  const avatarSize = size * layoutScale;
  const isDark = variant === 'dark';

  return (
    <View style={[styles.container, { width: avatarSize, height: avatarSize }]}>
      <View style={[
        styles.avatarContainer,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#FFFFFF',
        }
      ]}>
        {profileImage ? (
          <Image
            source={{ uri: profileImage }}
            style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}
          />
        ) : (
          <Text style={[
            styles.initialsText,
            {
              fontSize: (avatarSize * 0.4),
              color: isDark ? '#FFFFFF' : '#1F2937',
            }
          ]}>
            {initials}
          </Text>
        )}
      </View>
      
      {showEditButton && (
        <TouchableOpacity
          style={[
            styles.editButton,
            {
              width: avatarSize * 0.35,
              height: avatarSize * 0.35,
              borderRadius: (avatarSize * 0.35) / 2,
              bottom: 0,
              right: 0,
            }
          ]}
          onPress={onEditPress}
        >
          <MaterialIcons name="edit" size={avatarSize * 0.2} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  initialsText: {
    fontFamily: 'Poppins',
    fontWeight: '700',
  },
  editButton: {
    position: 'absolute',
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

export default UserAvatar;

