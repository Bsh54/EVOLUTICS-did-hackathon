import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OnboardingScreen from '../screens/OnboardingScreen';
import EnterYourIdScreen from '../screens/EnterYourIdScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import EnterNameScreen from '../screens/EnterNameScreen';
import CreatePinScreen from '../screens/CreatePinScreen';
import UploadProfileImageScreen from '../screens/UploadProfileImageScreen';
import SetupWaitScreen from '../screens/SetupWaitScreen';
import SetupSuccessScreen from '../screens/SetupSuccessScreen';
import PassphraseScreen from '../screens/PassphraseScreen';
import ChooseLanguageScreen from '../screens/ChooseLanguageScreen';
import DrawerNavigator from './DrawerNavigator';
import VerifyPinScreen from '../screens/VerifyPinScreen';
import FaceScanScreen from '../screens/FaceScanScreen';
import { isWalletInitialized } from '../utils/localStorage';
import { useDispatch } from 'react-redux';
import { loadUserDataFromStorage } from '../store/slices/userSlice';
import CredentialDetailScreen from '../screens/CredentialDetailScreen';
import CredentialRequestDetailScreen from '../screens/CredentialRequestDetailScreen';
import AllCredentialsListScreen from '../screens/AllCredentialsListScreen';
import ConnectionDetailScreen from '../screens/ConnectionDetailScreen';
import ProofRequestDetailsScreen from '../screens/ProofRequestDetailsScreen';
import {
  BackupWalletScreen,
  RestoreWalletScreen,
  BackupManagementScreen,
} from '../features/wallet-backup';
import { STATUS_BAR_HEIGHT } from '../constants/layout';
import QRCodeScreen from '../screens/QRCodeScreen';
import WebViewScreen from '../screens/WebViewScreen';
import { useDeepLinkHandler } from '../features/deeplink';
import RequestModal from '../components/RequestModal';
import RequestCredentialModal from '../components/RequestCredentialModal';
import ProofRequestModal from '../components/ProofRequestModal';
import { ZkpRequestModal } from '../features/zkp';
import { fetchAppVersion } from '../services/app-version';
import MaintenanceScreen from '../screens/MaintenanceScreen';

// Re-export for easy access by screens
export { STATUS_BAR_HEIGHT };

export type RootStackParamList = {
  Onboarding: undefined;
  PrivacyPolicy: undefined;
  EnterYourId: undefined;
  EnterName: undefined;
  CreatePin: undefined;
  UploadProfileImage: undefined;
  SetupWait: undefined;
  SetupSuccess: undefined;
  DrawerNavigator: undefined;
  Connections: undefined;
  Credentials: undefined;
  AllCredentialsList: undefined;
  VerifyPin: undefined;
  CredentialDetail: { credential: any };
  CredentialRequestDetail: { credentialOffer: any };
  ConnectionDetail: { connection: any };
  ProofRequestDetails: { verifierName?: string; requestedDate?: string; attributes?: any[]; invitationUrl?: string; proofRecordId?: string };
  ProofRequestList: undefined;
  FaceScan: { mode: 'enroll' | 'verify' };
  Passphrase: undefined;
  ChooseLanguage: undefined;
  BackupWallet: undefined;
  RestoreWallet: undefined;
  BackupManagement: undefined;
  QRCode: undefined;
  WebView: { url: string; title?: string; templateData?: Record<string, string> };
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAppActive, setIsAppActive] = useState(true);
  const dispatch = useDispatch();
  const { pendingDeepLink, clearPendingDeepLink } = useDeepLinkHandler();

  const linking = {
    prefixes: ['polyid://', 'e-id://'],
    config: {
      screens: {
        DrawerNavigator: {
          path: 'invite',
          screens: {
            Home: 'home',
          },
        },
      },
    },
  };

  useEffect(() => {
    // Force status bar color on Android
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#5B18B8', true);
      StatusBar.setBarStyle('light-content');
      StatusBar.setTranslucent(false);
    }

    const checkWalletStatus = async () => {
      try {
        const walletInitialized = await isWalletInitialized();

        if (walletInitialized) {
          // Load user data from storage to Redux
          dispatch(loadUserDataFromStorage());
          setInitialRoute('VerifyPin');
        } else {
          setInitialRoute('Onboarding');
        }
      } catch (error) {
        console.error('Error checking wallet status:', error);
        setInitialRoute('Onboarding');
      } finally {
        setIsLoading(false);
      }
    };

    const checkAppStatus = async () => {
      try {
        const response = await fetchAppVersion('v1.01.0');
        if (response.statusCode === 200) {
          setIsAppActive(response.data.isActive);
        }
      } catch (error) {
        console.error('Error checking app status:', error);
        // Default to active if status check fails to avoid locking users out during dev
        setIsAppActive(true);
      }
    };

    const initialize = async () => {
      setIsLoading(true);
      // await checkAppStatus();
      await checkWalletStatus();
    };

    initialize();
  }, [dispatch]);

  if (isLoading || !initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (!isAppActive) {
    return (
      <MaintenanceScreen
        onRetry={async () => {
          setIsLoading(true);
          try {
            const response = await fetchAppVersion('v1.01.0');
            if (response.statusCode === 200) {
              setIsAppActive(response.data.isActive);
            }
          } finally {
            setIsLoading(false);
          }
        }}
      />
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
      <NavigationContainer linking={linking}>
        <StatusBar translucent backgroundColor="transparent" />
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <Stack.Screen name="EnterYourId" component={EnterYourIdScreen} />
          <Stack.Screen name="EnterName" component={EnterNameScreen} />
          <Stack.Screen name="CreatePin" component={CreatePinScreen} />
          <Stack.Screen name="Passphrase" component={PassphraseScreen} />
          <Stack.Screen name="ChooseLanguage" component={ChooseLanguageScreen} />
          <Stack.Screen name="FaceScan" component={FaceScanScreen} />
          <Stack.Screen name="UploadProfileImage" component={UploadProfileImageScreen} />
          <Stack.Screen name="SetupWait" component={SetupWaitScreen} />
          <Stack.Screen name="SetupSuccess" component={SetupSuccessScreen} />
          <Stack.Screen name="DrawerNavigator" component={DrawerNavigator} />
          <Stack.Screen name="VerifyPin" component={VerifyPinScreen} />
          <Stack.Screen name="AllCredentialsList" component={AllCredentialsListScreen} />
          <Stack.Screen name="CredentialDetail" component={CredentialDetailScreen} />
          <Stack.Screen name="CredentialRequestDetail" component={CredentialRequestDetailScreen} />
          <Stack.Screen name="ConnectionDetail" component={ConnectionDetailScreen} />
          <Stack.Screen name="ProofRequestDetails" component={ProofRequestDetailsScreen} />
          <Stack.Screen name="BackupWallet" component={BackupWalletScreen} />
          <Stack.Screen name="RestoreWallet" component={RestoreWalletScreen} />
          <Stack.Screen name="BackupManagement" component={BackupManagementScreen} />
          <Stack.Screen name="QRCode" component={QRCodeScreen} />
          <Stack.Screen name="WebView" component={WebViewScreen} />
        </Stack.Navigator>

        {/* Deep Link Modals - Moved inside NavigationContainer to provide navigation context */}
        {pendingDeepLink?.type === 'connection' && (
          <RequestModal
            visible={!!pendingDeepLink}
            onClose={clearPendingDeepLink}
            invitationUrl={pendingDeepLink.url}
            invitationLabel={pendingDeepLink.label}
            onNavigateToCredentials={clearPendingDeepLink}
          />
        )}
        {pendingDeepLink?.type === 'offer' && (
          <RequestCredentialModal
            visible={!!pendingDeepLink}
            onClose={clearPendingDeepLink}
            invitationUrl={pendingDeepLink.url}
            onNavigateToCredentials={clearPendingDeepLink}
          />
        )}
        {pendingDeepLink?.type === 'proof' && (
          <ProofRequestModal
            visible={!!pendingDeepLink}
            onClose={clearPendingDeepLink}
            verifierName={pendingDeepLink.label || 'Verifier'}
            onViewDetails={clearPendingDeepLink}
            onShare={clearPendingDeepLink}
          />
        )}
        {pendingDeepLink?.type === 'zkp-proof' && pendingDeepLink.zkpProofRecordId && (
          <ZkpRequestModal
            visible={!!pendingDeepLink}
            onClose={clearPendingDeepLink}
            proofRecordId={pendingDeepLink.zkpProofRecordId}
            verifierName={pendingDeepLink.label || 'Verifier'}
          />
        )}
      </NavigationContainer>
    </SafeAreaView>
  );
};

export default AppNavigator;