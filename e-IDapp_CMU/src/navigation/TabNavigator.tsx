import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DashboardScreen from '../screens/DashboardScreen';
import CredentialsScreen from '../screens/CredentialsScreen';
import AllCredentialsListScreen from '../screens/AllCredentialsListScreen';
import ScanQRScreen from '../screens/ScanQRScreen';
import { useAgentInitialization } from '../hooks/useAgentInitialization';
import ProofRequestListScreen from '../screens/ProofRequestListScreen';

export type TabParamList = {
  Home: undefined;
  Credentials: undefined;
  'Scan QR': undefined;
  AllCredentialsListScreen: undefined;
  ProofRequestList: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();



const TransactionsScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Transactions Screen</Text>
  </View>
);

const CustomTabBarButton = ({ children, onPress }: { children: React.ReactNode; onPress: () => void }) => (
  <TouchableOpacity
    style={styles.customTabButton}
    onPress={onPress}
  >
    <View style={styles.customTabButtonInner}>
      {children}
    </View>
    <Text style={[ styles.tabBarLabel, { color: '#5b18b8' } ]}>Scan QR</Text>
  </TouchableOpacity>
);

const TabNavigator: React.FC = () => {
  // Ensure agent is initialized globally at TabNavigator level
  useAgentInitialization();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Credentials':
              iconName = 'credit-card';
              break;
            case 'Scan QR':
              iconName = 'qr-code-scanner';
              break;
            case 'AllCredentialsListScreen':
              iconName = 'people';
              break;
            case 'ProofRequestList':
              iconName = 'swap-horiz';
              break;
            default:
              iconName = 'home';
          }

          return <MaterialIcons name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: '#5b18b8',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Credentials"
        component={CredentialsScreen}
        options={{
          tabBarLabel: 'Credentials',
        }}
      />
      <Tab.Screen
        name="Scan QR"
        component={ScanQRScreen}
        options={{
          tabBarButton: (props: any) => (
            <CustomTabBarButton {...props} onPress={props.onPress ?? (() => { })}>
              <MaterialIcons name="qr-code-scanner" size={28} color="#FFFFFF" />
            </CustomTabBarButton>
          ),
        }}
      />
      <Tab.Screen
        name="AllCredentialsListScreen"
        component={AllCredentialsListScreen}
        options={{
          tabBarLabel: 'Connections',
        }}
      />
      <Tab.Screen
        name="ProofRequestList"
        component={ProofRequestListScreen}
        options={{
          tabBarLabel: 'Proof Request',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Poppins',
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    paddingBottom: 8,
    paddingTop: 8,
    height: 70,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'Poppins',
    marginTop: 4,
  },
  customTabButton: {
    top: -25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customTabButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#5b18b8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5b18b8',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // elevation: 8,
  },
});

export default TabNavigator;