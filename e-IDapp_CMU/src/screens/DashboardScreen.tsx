import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  PixelRatio,
  TouchableOpacity,
  Alert,
  BackHandler,
  ScrollView,
  InteractionManager,
} from 'react-native';

import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootState } from '../store';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { MainStackParamList } from '../navigation/DrawerNavigator';
import { DrawerParamList } from '../navigation/DrawerNavigator';
import { useAgentInitialization } from '../hooks/useAgentInitialization';
import { AppDispatch } from '../store';
import { fetchConnections, fetchCredentials } from '../store/slices/credoSlice';
import {
  CredentialCard,
  StatsCard,
  SearchBar,
  UserAvatar,
  QuickActionButton,
  CategoryItem,
  useCredentials,
  useConnections,
  useConnectionMapping,
  ConnectionCardWithActions,
  CredentialCardShimmer,
  ConnectionCardShimmer,
} from '../features/credential-connection';
import { getInitials } from '../utils/userUtils';
import FloatingQRButton from '../components/FloatingQRButton';
import QuickNavigation from '../features/credential-connection/components/QuickNavigation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Reference dimensions
const guideWidth = 375;
const guideHeight = 667;

const layoutScale = Math.min(Math.min(screenWidth / guideWidth, screenHeight / guideHeight), 1.2);
const fontScale = Math.min(PixelRatio.getFontScale() * (screenWidth / guideWidth), 1.5);
const iconScale = Math.min(PixelRatio.get() * (screenWidth / guideWidth), 1.2);

interface DashboardScreenProps {
  navigation?: any;
}

type DashboardScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Home'> & DrawerNavigationProp<DrawerParamList>;

const DashboardScreen: React.FC<DashboardScreenProps> = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const userData = useSelector((state: RootState) => state.user);
  const [selectedStatType, setSelectedStatType] = React.useState<'credentials' | 'connections'>('credentials');

  // Get total counts from Redux store
  const allCredentials = useSelector((state: RootState) => state.credo.credentials);
  const allConnections = useSelector((state: RootState) => state.credo.connections);
  const credentialsLoading = useSelector((state: RootState) => state.credo.credentialsLoading);
  const connectionsLoading = useSelector((state: RootState) => state.credo.connectionsLoading);

  // Use hook to get recent credentials
  const processedCredentials = useCredentials(5);
  const rawConnections = useConnections(false);
  const processedConnections = useConnectionMapping(rawConnections).slice(0, 5);

  // Ensure agent is initialized globally
  useAgentInitialization();

  // Fetch connections and credentials when component mounts
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      dispatch(fetchConnections());
      dispatch(fetchCredentials());
    });
    return () => task.cancel();
  }, [dispatch]);

  // Handle back button press to prevent app from quitting
  useEffect(() => {
    const backAction = () => {
      Alert.alert(
        'Hold on!',
        'Are you sure you want to exit the app?',
        [
          {
            text: 'Cancel',
            onPress: () => null,
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: () => BackHandler.exitApp(),
          },
        ],
        { cancelable: false }
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  const initials = getInitials(userData.name || 'John Deo');

  return (
    <View style={styles.container}>
      {/* Absolute positioned gradient for smooth blend */}
      <LinearGradient
        colors={['#7C3AED', '#A855F7', '#E9D5FF', '#F9FAFB']}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.absoluteGradient}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 * layoutScale }}
      >
        {/* Header Section */}
        <View style={[styles.headerSection, {
          paddingTop: 40 * layoutScale,
          paddingHorizontal: 20 * layoutScale,
          paddingBottom: 20 * layoutScale,
        }]}>
          {/* Header with Avatar and Notification */}
          <View style={[styles.topHeader, {
            marginBottom: 20 * layoutScale,
          }]}>
            <TouchableOpacity onPress={() => navigation.openDrawer()}>
              <UserAvatar
                profileImage={userData.profileImage}
                initials={initials}
                size={50}
                layoutScale={layoutScale}
                variant="dark"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.notificationButton, {
                width: 50 * layoutScale,
                height: 50 * layoutScale,
                borderRadius: 25 * layoutScale,
              }]}
            >
              <MaterialIcons
                name="notifications-none"
                size={28 * iconScale}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <SearchBar
            placeholder='Search for "Credentials"'
            value=""
            onChangeText={() => { }}
            layoutScale={layoutScale}
            fontScale={fontScale}
            iconScale={iconScale}
            marginHorizontal={0}
            marginBottom={30}
          />

          {/* Quick Navigation Row */}
          <QuickNavigation layoutScale={layoutScale} fontScale={fontScale} />
        </View>

        {/* Categories Section - Wrapped in a Card */}
        <View style={styles.categoriesCard}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: 20 * fontScale }]}>Categories</Text>
            <TouchableOpacity>
              <Text style={[styles.seeMoreText, { fontSize: 14 * fontScale }]}>View More</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollContent}
          >
            <CategoryItem
              icon="school"
              label="Education"
              onPress={() => navigation.navigate('StudentID')}
              layoutScale={layoutScale}
              fontScale={fontScale}
              iconScale={iconScale}
              color="#3B82F6"
            />
            <CategoryItem
              icon="local-hospital"
              label="Healthcare"
              onPress={() => navigation.navigate('NationalID')}
              layoutScale={layoutScale}
              fontScale={fontScale}
              iconScale={iconScale}
              color="#10B981"
            />
            <CategoryItem
              icon="account-balance"
              label="Template"
              onPress={() => navigation.navigate('AllCredentialsListScreen')}
              layoutScale={layoutScale}
              fontScale={fontScale}
              iconScale={iconScale}
              color="#F59E0B"
            />
            <CategoryItem
              icon="agriculture"
              label="Agriculture"
              onPress={() => { }}
              layoutScale={layoutScale}
              fontScale={fontScale}
              iconScale={iconScale}
              color="#8B5CF6"
            />
            <CategoryItem
              icon="memory"
              label="Technology"
              onPress={() => { }}
              layoutScale={layoutScale}
              fontScale={fontScale}
              iconScale={iconScale}
              color="#EF4444"
            />
          </ScrollView>
        </View>

        {/* Stats Section */}
        <View style={[styles.sectionContainer, { marginTop: 30 * layoutScale }]}>
          <Text style={[styles.sectionTitle, { fontSize: 20 * fontScale, marginBottom: 16 * layoutScale }]}>
            Stats
          </Text>
          <View style={styles.statsRow}>
            <StatsCard
              type="connections"
              count={allConnections.length}
              layoutScale={layoutScale}
              fontScale={fontScale}
              iconScale={iconScale}
              width={(screenWidth - 52) / 2}
              marginRight={12}
              isActive={selectedStatType === 'connections'}
              onPress={() => setSelectedStatType('connections')}
            />
            <StatsCard
              type="total"
              count={allCredentials.length}
              layoutScale={layoutScale}
              fontScale={fontScale}
              iconScale={iconScale}
              width={(screenWidth - 52) / 2}
              marginRight={0}
              isActive={selectedStatType === 'credentials'}
              onPress={() => setSelectedStatType('credentials')}
            />
          </View>
        </View>

        {/* Recent Section */}
        <View style={[styles.sectionContainer, { marginTop: 30 * layoutScale, marginBottom: 20 * layoutScale }]}>
          <Text style={[styles.sectionTitle, { fontSize: 20 * fontScale, marginBottom: 16 * layoutScale }]}>
            {selectedStatType === 'connections' ? 'Recent Connections' : 'Recent Credentials'}
          </Text>
          {selectedStatType === 'connections' ? (
            connectionsLoading ? (
              <View>
                {[1, 2, 3].map((i) => (
                  <ConnectionCardShimmer key={i} marginHorizontal={0} />
                ))}
              </View>
            ) : processedConnections.length > 0 ? (
              processedConnections.map((item) => (
                <ConnectionCardWithActions
                  key={item.id}
                  item={item}
                  navigation={navigation}
                  layoutScale={layoutScale}
                  fontScale={fontScale}
                  iconScale={iconScale}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No connections yet</Text>
              </View>
            )
          ) : (
            credentialsLoading ? (
              <View>
                {[1, 2, 3].map((i) => (
                  <CredentialCardShimmer key={i} />
                ))}
              </View>
            ) : processedCredentials.length > 0 ? (
              processedCredentials.map((item) => (
                <CredentialCard
                  key={item.id}
                  item={item}
                  navigation={navigation}
                  layoutScale={layoutScale}
                  fontScale={fontScale}
                  iconScale={iconScale}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No recent credentials</Text>
              </View>
            )
          )}
        </View>
      </ScrollView>
      <FloatingQRButton />
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
    height: screenHeight * 0.55,
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    // No hard cutoff background here, handled by absoluteGradient
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionsContainer: {
    paddingVertical: 10,
  },
  sectionContainer: {
    paddingHorizontal: 20,
  },
  categoriesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 10 * layoutScale,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#1F2937',
    fontFamily: 'Poppins',
    fontWeight: '700',
  },
  seeMoreText: {
    color: '#7C3AED',
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  categoriesScrollContent: {
    paddingBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsScrollContent: {
    paddingBottom: 10,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  emptyStateText: {
    color: '#6B7280',
    fontFamily: 'Poppins',
  },
});

export default DashboardScreen;
