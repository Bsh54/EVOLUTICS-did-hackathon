import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import QuickActionButton from './QuickActionButton';

interface QuickNavigationProps {
  layoutScale: number;
  fontScale: number;
}

const QuickNavigation: React.FC<QuickNavigationProps> = ({
  layoutScale,
  fontScale,
}) => {
  const navigation = useNavigation<any>();
  const route = useRoute();

  const navItems = [
    {
      id: 'Home',
      icon: 'home',
      label: 'Home',
      screen: 'Home',
    },
    {
      id: 'Credentials',
      icon: 'credit-card',
      label: 'Credentials',
      screen: 'Credentials',
    },
    {
      id: 'Connections',
      icon: 'people',
      label: 'Connections',
      screen: 'AllCredentialsListScreen',
    },
    {
      id: 'ProofRequests',
      icon: 'swap-horiz',
      label: 'Proof Requests',
      screen: 'ProofRequestList',
    },
  ];

  const currentRoute = route.name;

  return (
    <View style={styles.container}>
      <View style={styles.navWrapper}>
        {navItems.map((item) => (
          <QuickActionButton
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={currentRoute === item.screen}
            onPress={() => {
              if (currentRoute !== item.screen) {
                navigation.navigate(item.screen);
              }
            }}
            layoutScale={layoutScale}
            fontScale={fontScale}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
  },
  navWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-start',
    width: '100%',
  },
});

export default QuickNavigation;

