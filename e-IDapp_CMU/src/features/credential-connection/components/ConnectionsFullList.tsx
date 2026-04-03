import React, { useState, useMemo, useEffect } from 'react';
import { View, FlatList, StyleSheet, InteractionManager } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';

import { useConnections } from '../hooks/useConnections';
import { useConnectionMapping } from '../hooks/useConnectionMapping';
import SearchBar from './SearchBar';
import StatusTabs from './StatusTabs';
import ConnectionCardWithActions from './ConnectionCardWithActions';
import ConnectionCardShimmer from './ConnectionCardShimmer';
import EmptyState from './EmptyState';
import { Dimensions, PixelRatio } from 'react-native';
import QuickNavigation from './QuickNavigation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const guideWidth = 375;
const guideHeight = 667;
const layoutScale = Math.min(Math.min(screenWidth / guideWidth, screenHeight / guideHeight), 1.2);
const fontScale = Math.min(PixelRatio.getFontScale() * (screenWidth / guideWidth), 1.5);
const iconScale = Math.min(PixelRatio.get() * (screenWidth / guideWidth), 1.2);

interface ConnectionsFullListProps {
  navigation: any;
  headerComponent?: React.ReactNode;
  includeMediators?: boolean;
}

/**
 * Full-screen connections list component with search and status filtering
 * Can replace AllCredentialsListScreen
 */
const ConnectionsFullList: React.FC<ConnectionsFullListProps> = ({
  navigation,
  headerComponent,
  includeMediators = false,
}) => {
  const connections = useConnections(includeMediators);
  const mappedConnections = useConnectionMapping(connections);
  const connectionsLoading = useSelector((state: RootState) => state.credo.connectionsLoading);

  const [ searchQuery, setSearchQuery ] = useState('');
  const [ activeCategory, setActiveCategory ] = useState('Agent Connection');
  const [ isReady, setIsReady ] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
    return () => task.cancel();
  }, []);

  // Filter by connection type (Agent vs Mediator) and search
  const filteredData = useMemo(() => {
    let typeFiltered = mappedConnections;

    // Filter by connection type
    if (activeCategory === 'Agent Connection') {
      typeFiltered = mappedConnections.filter((item) => !item.isMediator);
    } else if (activeCategory === 'Mediator Connection') {
      typeFiltered = mappedConnections.filter((item) => item.isMediator);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      return typeFiltered.filter((item) =>
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return typeFiltered;
  }, [ mappedConnections, searchQuery, activeCategory ]);

  const renderConnectionItem = ({ item }: { item: any }) => (
    <ConnectionCardWithActions
      item={item}
      navigation={navigation}
      layoutScale={layoutScale}
      fontScale={fontScale}
      iconScale={iconScale}
    />
  );

  const statusTabs = [
    { id: 'Agent Connection', label: 'Agent Connection' },
    { id: 'Mediator Connection', label: 'Mediator Connection' },
  ];

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
          placeholder="Search Connection"
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

      {/* Connections list */}
      <View style={styles.listWrapper}>
        {/* Status tabs */}
        <StatusTabs
          activeTab={activeCategory}
          onTabChange={setActiveCategory}
          tabs={statusTabs}
          layoutScale={layoutScale}
          fontScale={fontScale}
        />

        {!isReady || connectionsLoading ? (
          // Show shimmer loaders while loading
          <View style={[ styles.listContainer, {
            paddingTop: 16 * layoutScale,
            paddingBottom: 20 * layoutScale,
          } ]}>
            {[ 1, 2, 3, 4, 5 ].map((index) => (
              <ConnectionCardShimmer key={index} marginHorizontal={16} />
            ))}
          </View>
        ) : filteredData.length > 0 ? (
          <FlatList
            data={filteredData}
            renderItem={renderConnectionItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[ styles.listContainer, {
              paddingTop: 16 * layoutScale,
              paddingBottom: 20 * layoutScale,
            } ]}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <EmptyState
            type="connections"
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
});

export default ConnectionsFullList;

