import React, { useState, useMemo } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useProofRequests, ProofRequestDisplayItem } from '../hooks/useProofRequests';
import { useVerificationHistory } from '../../verification-history';
import SearchBar from './SearchBar';
import ProofRequestCard from './ProofRequestCard';
import CredentialCardShimmer from './CredentialCardShimmer';
import { Dimensions, PixelRatio } from 'react-native';
import QuickNavigation from './QuickNavigation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const guideWidth = 375;
const guideHeight = 667;
const layoutScale = Math.min(Math.min(screenWidth / guideWidth, screenHeight / guideHeight), 1.2);
const fontScale = Math.min(PixelRatio.getFontScale() * (screenWidth / guideWidth), 1.5);
const iconScale = Math.min(PixelRatio.get() * (screenWidth / guideWidth), 1.2);

interface ProofRequestFullListProps {
  navigation: any;
  headerComponent?: React.ReactNode;
}

/**
 * Full-screen proof requests list component with search
 */
const ProofRequestFullList: React.FC<ProofRequestFullListProps> = ({
  navigation,
  headerComponent,
}) => {
  const { proofRequests, loading, error } = useProofRequests();
  const { verifications, loading: historyLoading, grantedCount, deniedCount } = useVerificationHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const completedCount = grantedCount + deniedCount;

  // Determine which data to show based on toggle
  const currentData = useMemo(() => {
    if (showHistory) {
      return verifications.map(v => ({
        id: v.id,
        title: v.verifierName,
        subtitle: v.credentialName,
        createdAt: v.createdAt.toISOString(),
        status: v.state === 'granted' ? 'completed' : 'declined',
        statusText: v.state === 'granted' ? 'Granted' : 'Denied',
        isCompleted: true,
        holderName: v.holderName,
        location: v.location,
        referenceId: v.referenceId,
      }));
    }
    return proofRequests;
  }, [showHistory, verifications, proofRequests]);

  const pendingCount = proofRequests.length;

  // Filter by search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return currentData;
    }

    return (currentData as any[]).filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (showHistory && (item as any).statusText?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [currentData, searchQuery, showHistory]);

  const handleProofRequestPress = (item: ProofRequestDisplayItem) => {
    // Navigate to ProofRequestDetails screen
    navigation.navigate('ProofRequestDetails', {
      proofRecordId: item.id,
      verifierName: item.subtitle,
    });
  };

  const renderProofRequestItem = ({ item }: { item: ProofRequestDisplayItem | any }) => (
    <View
      style={[
        styles.proofRequestItem,
        {
          marginHorizontal: 16 * layoutScale,
          marginBottom: 12 * layoutScale,
        },
      ]}
    >
      <ProofRequestCard
        item={item}
        onPress={showHistory && item.isCompleted ? undefined : handleProofRequestPress}
        layoutScale={layoutScale}
        fontScale={fontScale}
        iconScale={iconScale}
        isHistoryItem={showHistory}
        statusText={showHistory ? item.statusText : undefined}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { fontSize: 18 * fontScale }]}>
        {showHistory ? 'No Proof History' : 'No Pending Proof Requests'}
      </Text>
      <Text style={[styles.emptySubtitle, { fontSize: 14 * fontScale, marginTop: 8 * layoutScale }]}>
        {showHistory 
          ? 'You haven\'t received any proof requests yet' 
          : 'You don\'t have any pending proof requests at the moment'
        }
      </Text>
      {!showHistory && completedCount > 0 && (
        <Text 
          style={[styles.emptyHint, { fontSize: 14 * fontScale, marginTop: 12 * layoutScale }]}
          onPress={() => setShowHistory(true)}
        >
          View {completedCount} completed request{completedCount !== 1 ? 's' : ''} in history
        </Text>
      )}
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

      {/* Search bar and toggle */}
      <View style={styles.searchWrapper}>
        <SearchBar
          placeholder={showHistory ? "Search Proof History" : "Search Proof Requests"}
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
        
      <View style={styles.searchWrapper}>
        {/* Toggle between pending and history */}
        <View style={[styles.toggleContainer, { marginHorizontal: 16 * layoutScale, marginTop: 12 * layoutScale }]}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              !showHistory && styles.toggleButtonActive,
              { paddingVertical: 8 * layoutScale, paddingHorizontal: 16 * layoutScale }
            ]}
            onPress={() => setShowHistory(false)}
          >
            <Text style={[
              styles.toggleButtonText,
              !showHistory && styles.toggleButtonTextActive,
              { fontSize: 14 * fontScale }
            ]}>
              Pending ({pendingCount})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.toggleButton,
              showHistory && styles.toggleButtonActive,
              { paddingVertical: 8 * layoutScale, paddingHorizontal: 16 * layoutScale }
            ]}
            onPress={() => setShowHistory(true)}
          >
            <Text style={[
              styles.toggleButtonText,
              showHistory && styles.toggleButtonTextActive,
              { fontSize: 14 * fontScale }
            ]}>
              History ({completedCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Proof requests list */}
      <View style={styles.listWrapper}>
        {(() => {
          // If we have count data and current view has 0 items, show empty state
          const currentCount = showHistory ? completedCount : pendingCount;
          const hasCountData = currentCount !== undefined;
          const shouldShowEmpty = hasCountData && currentCount === 0;
          
          // Show loading shimmers only if we don't have count data yet
          const shouldShowLoading = loading && !hasCountData;

          if (shouldShowLoading) {
            return (
              <View
                style={[
                  styles.listContainer,
                  {
                    paddingTop: 16 * layoutScale,
                    paddingBottom: 20 * layoutScale,
                  },
                ]}
              >
                {[1, 2, 3].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.proofRequestItem,
                      {
                        marginHorizontal: 16 * layoutScale,
                        marginBottom: 12 * layoutScale,
                      },
                    ]}
                  >
                    <CredentialCardShimmer />
                  </View>
                ))}
              </View>
            );
          } else if (filteredData.length > 0) {
            return (
              <FlatList
                data={filteredData}
                renderItem={renderProofRequestItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                  styles.listContainer,
                  {
                    paddingTop: 16 * layoutScale,
                    paddingBottom: 20 * layoutScale,
                  },
                ]}
                showsVerticalScrollIndicator={false}
              />
            );
          } else {
            return renderEmptyState();
          }
        })()}
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#5B18B8',
  },
  toggleButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  emptyHint: {
    color: '#5B18B8',
    fontWeight: '600',
    textAlign: 'center',
    textDecorationLine: 'underline',
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
  proofRequestItem: {},
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: '#1F2937',
    fontWeight: '700',
    fontFamily: 'Poppins',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#6B7280',
    fontWeight: '400',
    fontFamily: 'Poppins',
    textAlign: 'center',
  },
});

export default ProofRequestFullList;
