import React, { useState, useMemo, useEffect } from 'react';
import { View, FlatList, StyleSheet, InteractionManager } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { useCredentials, CredentialDisplayItem } from '../hooks/useCredentials';
import SearchBar from './SearchBar';
import CredentialCard from './CredentialCard';
import CredentialCardShimmer from './CredentialCardShimmer';
import EmptyState from './EmptyState';
import { Dimensions, PixelRatio } from 'react-native';
import QuickNavigation from './QuickNavigation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const guideWidth = 375;
const guideHeight = 667;
const layoutScale = Math.min(Math.min(screenWidth / guideWidth, screenHeight / guideHeight), 1.2);
const fontScale = Math.min(PixelRatio.getFontScale() * (screenWidth / guideWidth), 1.5);
const iconScale = Math.min(PixelRatio.get() * (screenWidth / guideWidth), 1.2);

interface CredentialsFullListProps {
  navigation: any;
  headerComponent?: React.ReactNode;
}

/**
 * Full-screen credentials list component with search
 * Can replace CredentialsScreen
 */
const CredentialsFullList: React.FC<CredentialsFullListProps> = ({
  navigation,
  headerComponent,
}) => {
  const allCredentials = useCredentials(1000); // Get all credentials
  const credentialsLoading = useSelector((state: RootState) => state.credo.credentialsLoading);

  const [ searchQuery, setSearchQuery ] = useState('');
  const [ isReady, setIsReady ] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
    return () => task.cancel();
  }, []);


  // Filter by search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return allCredentials;
    }

    return allCredentials.filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [ allCredentials, searchQuery ]);

  const renderCredentialItem = ({ item }: { item: CredentialDisplayItem }) => (
    <View style={[ styles.credentialItem, {
      marginHorizontal: 16 * layoutScale,
      marginBottom: 12 * layoutScale,
    } ]}>
      <CredentialCard
        item={item}
        navigation={navigation}
        layoutScale={layoutScale}
        fontScale={fontScale}
        iconScale={iconScale}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Absolute positioned gradient for smooth blend */}
      <LinearGradient
        colors={[ '#7C3AED', '#A855F7', '#E9D5FF', '#F9FAFB' ]}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.absoluteGradient}
      />

      {/* Header with gradient background */}
      {headerComponent && (
        <View style={[ styles.headerContainer, {
          paddingTop: 40 * layoutScale,
          paddingBottom: 10 * layoutScale,
        } ]}>
          {headerComponent}
        </View>
      )}

      {/* Search bar */}
      <View style={styles.searchWrapper}>
        <SearchBar
          placeholder="Search Credentials"
          value={searchQuery}
          onChangeText={setSearchQuery}
          layoutScale={layoutScale}
          fontScale={fontScale}
          iconScale={iconScale}
          marginHorizontal={16}
          marginBottom={0}
        />
      </View>

      {/* Quick Navigation Row */}
      <QuickNavigation layoutScale={layoutScale} fontScale={fontScale} />

      {/* Credentials list */}
      <View style={styles.listWrapper}>
        {!isReady || credentialsLoading ? (
          // Show shimmer loaders while loading or transition in progress
          <View style={[ styles.listContainer, {
            paddingTop: 16 * layoutScale,
            paddingBottom: 20 * layoutScale,
          } ]}>
            {[ 1, 2, 3, 4, 5 ].map((index) => (
              <View key={index} style={[ styles.credentialItem, {
                marginHorizontal: 16 * layoutScale,
                marginBottom: 12 * layoutScale,
              } ]}>
                <CredentialCardShimmer />
              </View>
            ))}
          </View>
        ) : filteredData.length > 0 ? (
          <FlatList
            data={filteredData}
            renderItem={renderCredentialItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[ styles.listContainer, {
              paddingTop: 16 * layoutScale,
              paddingBottom: 20 * layoutScale,
            } ]}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <EmptyState
            type="credentials"
            navigation={navigation}
            layoutScale={layoutScale}
            fontScale={fontScale}
            iconScale={iconScale}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  absoluteGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.45,
  },
  headerContainer: {
    paddingHorizontal: 16,
  },
  searchWrapper: {
    paddingTop: 10,
    marginBottom: 10,
  },
  listWrapper: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  listContainer: {},
  credentialItem: {},
});

export default CredentialsFullList;

