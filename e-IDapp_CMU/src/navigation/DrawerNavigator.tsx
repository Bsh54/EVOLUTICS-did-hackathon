import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import CustomDrawerContent from '../components/CustomDrawerContent';
import DashboardScreen from '../screens/DashboardScreen';
import CredentialsScreen from '../screens/CredentialsScreen';
import ScanQRScreen from '../screens/ScanQRScreen';
import AllCredentialsListScreen from '../screens/AllCredentialsListScreen';
import ProofRequestListScreen from '../screens/ProofRequestListScreen';
import { BackupManagementScreen } from '../features/wallet-backup';
import QRCodeScreen from '../screens/QRCodeScreen';
import StudentIDScreen from '../screens/StudentIDScreen';
import NationalIDScreen from '../screens/NationalIDScreen';
import WebViewScreen from '../screens/WebViewScreen';

export type MainStackParamList = {
  Home: undefined;
  Credentials: undefined;
  'Scan QR': undefined;
  AllCredentialsListScreen: undefined;
  ProofRequestList: undefined;
  BackupManagement: undefined;
  QRCode: undefined;
  StudentID: undefined;
  NationalID: undefined;
  WebView: { url: string; title?: string; templateData?: Record<string, string> };
};

const Stack = createStackNavigator<MainStackParamList>();

const MainStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={DashboardScreen} />
      <Stack.Screen name="Credentials" component={CredentialsScreen} />
      <Stack.Screen name="Scan QR" component={ScanQRScreen} />
      <Stack.Screen name="AllCredentialsListScreen" component={AllCredentialsListScreen} />
      <Stack.Screen name="ProofRequestList" component={ProofRequestListScreen} />
      <Stack.Screen name="BackupManagement" component={BackupManagementScreen} />
      <Stack.Screen name="QRCode" component={QRCodeScreen} />
      <Stack.Screen name="StudentID" component={StudentIDScreen} />
      <Stack.Screen name="NationalID" component={NationalIDScreen} />
      <Stack.Screen name="WebView" component={WebViewScreen} />
    </Stack.Navigator>
  );
};

export type DrawerParamList = {
  MainStack: undefined;
  QRCode: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

const DrawerNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: 280,
        },
        swipeEnabled: true,
      }}
    >
      <Drawer.Screen
        name="MainStack"
        component={MainStackNavigator}
        options={{
          drawerLabel: 'Home',
        }}
      />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
