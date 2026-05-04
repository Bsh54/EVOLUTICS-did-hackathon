import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { requestCameraPermission } from './src/utils/permissions';
import { AgentProvider } from './src/features/agent';
import WatermelonProvider from './src/db/DatabaseProvider';

const App: React.FC = () => {
  useEffect(() => {
    const requestCameraPermissionOnAppStart = async () => {
      try {
        await requestCameraPermission();
      } catch (error) {
        console.error('Error requesting camera permission:', error);
      }
    };

    requestCameraPermissionOnAppStart();

    // Set status bar color immediately on app start (Android)
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#5B18B8', true);
      StatusBar.setBarStyle('light-content');
      StatusBar.setTranslucent(false);
    } else {
      // iOS
      StatusBar.setBarStyle('light-content');
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#5B18B8"
        translucent={false}
        animated={true}
      />
      <Provider store={store}>
        <WatermelonProvider>
          <AgentProvider>
            <SafeAreaProvider>
              <AppNavigator />
            </SafeAreaProvider>
          </AgentProvider>
        </WatermelonProvider>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;