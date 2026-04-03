import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { STATUS_BAR_HEIGHT } from '../constants/layout';
import { CommonActions } from '@react-navigation/native';
import { clearStoredData } from '../utils/localStorage';
import { resetUser } from '../store/slices/userSlice';
import { resetBackupState } from '../store/slices/backupSlice';
import { credoAgentService } from '../services/agent';
import { UserAvatar } from '../features/credential-connection';
import { getInitials } from '../utils/userUtils';
import { fetchAppVersion } from '../services/app-version';

const { width: screenWidth } = Dimensions.get('window');

// Scaling factor for responsive layout
const guideWidth = 375;
const layoutScale = Math.min(screenWidth / guideWidth, 1.2);

interface DrawerMenuItem {
  id: string;
  title: string;
  icon: string;
  onPress: () => void;
  color?: string;
  isDestructive?: boolean;
}

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const userData = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const [appVersion, setAppVersion] = React.useState('1.0.0');

  React.useEffect(() => {
    const getVersion = async () => {
      try {
        const response = await fetchAppVersion('v1.01.0');
        if (response.statusCode === 200) {
          setAppVersion(response.data.mobileAppVersion);
        }
      } catch (error) {
        console.error('Error fetching version in drawer:', error);
      }
    };
    getVersion();
  }, []);

  const initials = getInitials(userData.name || 'John Deo');

  const drawerMenuItems: DrawerMenuItem[] = [
    {
      id: 'home',
      title: 'Home',
      icon: 'home',
      onPress: () => {
        props.navigation.closeDrawer();
        (props.navigation as any).navigate('MainStack', { screen: 'Home' });
      },
    },
    {
      id: 'my-credentials',
      title: 'My Credentials',
      icon: 'credit-card',
      onPress: () => {
        props.navigation.closeDrawer();
        (props.navigation as any).navigate('MainStack', { screen: 'Credentials' });
      },
    },
    {
      id: 'connections',
      title: 'Connections',
      icon: 'people',
      onPress: () => {
        props.navigation.closeDrawer();
        (props.navigation as any).navigate('MainStack', { screen: 'AllCredentialsListScreen' });
      },
    },
    {
      id: 'edit-profile',
      title: 'Edit Profile',
      icon: 'person',
      onPress: () => {
        props.navigation.closeDrawer();
        (props.navigation as any).navigate('UploadProfileImage', { mode: 'edit' });
      },
    },
    {
      id: 'backup',
      title: 'Backup & Restore',
      icon: 'backup',
      onPress: () => {
        props.navigation.closeDrawer();
        (props.navigation as any).navigate('MainStack', { screen: 'BackupManagement' });
      },
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings',
      onPress: () => {
        props.navigation.closeDrawer();
        Alert.alert('Settings', 'Settings screen coming soon!');
      },
    },
    {
      id: 'qr-code',
      title: 'My QR Code',
      icon: 'qr-code',
      onPress: () => {
        props.navigation.closeDrawer();
        (props.navigation as any).navigate('QRCode');
      },
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'support-agent',
      onPress: () => {
        props.navigation.closeDrawer();
        Alert.alert('Support', 'Support screen coming soon!');
      },
    },
    {
      id: 'delete-account',
      title: 'Delete Account',
      icon: 'delete',
      onPress: () => {
        handleDeleteAccount();
      },
    },
  ];

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This will permanently clear all your data and you will need to start over.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              props.navigation.closeDrawer();
              await credoAgentService.shutdown();
              await clearStoredData();
              dispatch(resetUser());
              dispatch(resetBackupState());
              props.navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'VerifyPin' }],
                })
              );
            } catch (error) {
              console.error('Delete account error:', error);
              Alert.alert('Error', 'Failed to delete account properly');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? This will clear your local wallet data. Make sure you have a backup!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              props.navigation.closeDrawer();
              await credoAgentService.shutdown();
              await clearStoredData();
              dispatch(resetUser());
              dispatch(resetBackupState());
              props.navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Onboarding' }],
                })
              );
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout properly');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Section with Gradient */}
      <LinearGradient
        colors={['#7C3AED', '#A855F7']}
        style={styles.headerSection}
      >
        <View style={styles.profileSection}>
          <UserAvatar
            profileImage={userData.profileImage}
            initials={initials}
            size={70}
            layoutScale={layoutScale}
            variant="dark"
            showEditButton={true}
            onEditPress={() => {
              props.navigation.closeDrawer();
              (props.navigation as any).navigate('UploadProfileImage', { mode: 'edit' });
            }}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{userData.name || 'John Deo'}</Text>
            <Text style={styles.userEmail}>{userData?.id}</Text>
          </View>
          <TouchableOpacity
            style={styles.viewProfileButton}
            onPress={() => Alert.alert('Profile', 'Profile details screen coming soon!')}
          >
            <Text style={styles.viewProfileText}>View Profile</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Menu Items */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.menuSection}>
          {drawerMenuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons
                  name={item.icon as any}
                  size={24}
                  color="#4B5563"
                  style={styles.menuIcon}
                />
                <Text style={styles.menuText}>{item.title}</Text>
              </View>
              <MaterialIcons
                name="keyboard-arrow-right"
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          ))}
        </View>
      </DrawerContentScrollView>

      {/* Footer Section */}
      <View style={styles.footerSection}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <MaterialIcons name="logout" size={24} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>Version {appVersion}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerSection: {
    paddingTop: STATUS_BAR_HEIGHT + 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileSection: {
    alignItems: 'flex-start',
  },
  profileInfo: {
    marginTop: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  userEmail: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  viewProfileButton: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  viewProfileText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  scrollViewContent: {
    paddingTop: 0,
  },
  menuSection: {
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    marginRight: 16,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    fontFamily: 'Poppins',
  },
  footerSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    width: '100%',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
    fontFamily: 'Poppins',
    marginLeft: 16,
  },
  versionText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'Poppins',
    marginTop: 4,
  },
});

export default CustomDrawerContent;
