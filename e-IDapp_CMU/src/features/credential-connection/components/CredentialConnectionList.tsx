import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { useCredentials } from '../hooks/useCredentials';
import { useConnections } from '../hooks/useConnections';
import CredentialCard from './CredentialCard';
import ConnectionCard from './ConnectionCard';
import CredentialCardShimmer from './CredentialCardShimmer';
import ConnectionCardShimmer from './ConnectionCardShimmer';
import EmptyState from './EmptyState';

interface CredentialConnectionListProps {
  navigation: any;
  layoutScale: number;
  fontScale: number;
  iconScale: number;
  credentialsLimit?: number;
  connectionsLimit?: number;
  includeMediators?: boolean;
  totalCredentialsCount?: number;
  totalConnectionsCount?: number;
}

const CredentialConnectionList: React.FC<CredentialConnectionListProps> = ({
  navigation,
  layoutScale,
  fontScale,
  iconScale,
  credentialsLimit = 3,
  connectionsLimit = 10,
  includeMediators = false,
  totalCredentialsCount,
  totalConnectionsCount,
}) => {
  const [ activeTab, setActiveTab ] = useState<'credentials' | 'connections'>('credentials');

  const recentCredentials = useCredentials(credentialsLimit);
  const recentConnections = useConnections(includeMediators);
  const credentialsLoading = useSelector((state: RootState) => state.credo.credentialsLoading);
  const connectionsLoading = useSelector((state: RootState) => state.credo.connectionsLoading);

  const renderCredentialItem = ({ item }: { item: any }) => (
    <CredentialCard
      item={item}
      navigation={navigation}
      layoutScale={layoutScale}
      fontScale={fontScale}
      iconScale={iconScale}
    />
  );

  const renderConnectionItem = ({ item }: { item: any }) => (
    <ConnectionCard
      item={item}
      navigation={navigation}
      layoutScale={layoutScale}
      fontScale={fontScale}
      iconScale={iconScale}
    />
  );

  return (
    <View style={[ styles.tabbedSection, {
      paddingHorizontal: 20 * layoutScale,
      marginBottom: 20 * layoutScale,
    } ]}>
      {/* Tab Header */}
      <View style={[ styles.tabHeader, {
        marginBottom: 20 * layoutScale,
      } ]}>
        <TouchableOpacity
          style={[ styles.tabButton, {
            flex: 1,
            paddingVertical: 12 * layoutScale,
            borderRadius: 12 * layoutScale,
            marginRight: 8 * layoutScale,
            backgroundColor: activeTab === 'credentials' ? '#7C3AED' : '#F3F4F6',
          } ]}
          onPress={() => setActiveTab('credentials')}
        >
          <MaterialIcons
            name="description"
            size={20 * iconScale}
            color={activeTab === 'credentials' ? '#FFFFFF' : '#6B7280'}
          />
          <Text style={[ styles.tabButtonText, {
            fontSize: 14 * fontScale,
            marginLeft: 8 * layoutScale,
            color: activeTab === 'credentials' ? '#FFFFFF' : '#6B7280',
            fontWeight: activeTab === 'credentials' ? '600' : '500',
          } ]}>
            Credentials ({totalCredentialsCount ?? recentCredentials.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[ styles.tabButton, {
            flex: 1,
            paddingVertical: 12 * layoutScale,
            borderRadius: 12 * layoutScale,
            marginLeft: 8 * layoutScale,
            backgroundColor: activeTab === 'connections' ? '#7C3AED' : '#F3F4F6',
          } ]}
          onPress={() => setActiveTab('connections')}
        >
          <MaterialIcons
            name="people"
            size={20 * iconScale}
            color={activeTab === 'connections' ? '#FFFFFF' : '#6B7280'}
          />
          <Text style={[ styles.tabButtonText, {
            fontSize: 14 * fontScale,
            marginLeft: 8 * layoutScale,
            color: activeTab === 'connections' ? '#FFFFFF' : '#6B7280',
            fontWeight: activeTab === 'connections' ? '600' : '500',
          } ]}>
            Connections ({totalConnectionsCount ?? recentConnections.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'credentials' ? (
        <View>
          {credentialsLoading ? (
            // Show shimmer loaders while loading
            <View>
              {[ 1, 2, 3 ].map((index) => (
                <CredentialCardShimmer key={index} />
              ))}
            </View>
          ) : recentCredentials.length > 0 ? (
            <>
              <FlatList
                data={recentCredentials}
                renderItem={renderCredentialItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={{
                  paddingHorizontal: 0,
                }}
                showsVerticalScrollIndicator={false}
              />
              {(totalCredentialsCount !== undefined && totalCredentialsCount > credentialsLimit) ||
                (totalCredentialsCount === undefined && recentCredentials.length >= credentialsLimit) ? (
                <TouchableOpacity
                  style={[ styles.viewMoreButton, {
                    marginTop: 16 * layoutScale,
                    paddingVertical: 12 * layoutScale,
                    borderRadius: 12 * layoutScale,
                  } ]}
                  onPress={() => navigation.navigate('Credentials' as never)}
                >
                  <Text style={[ styles.viewMoreText, {
                    fontSize: 14 * fontScale,
                    color: '#7C3AED',
                  } ]}>
                    View More
                  </Text>
                  <MaterialIcons
                    name="arrow-forward"
                    size={18 * iconScale}
                    color="#7C3AED"
                    style={{ marginLeft: 8 * layoutScale }}
                  />
                </TouchableOpacity>
              ) : null}
            </>
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
      ) : (
        <View>
          {connectionsLoading ? (
            // Show shimmer loaders while loading
            <View>
              {[ 1, 2, 3 ].map((index) => (
                <ConnectionCardShimmer key={index} />
              ))}
            </View>
          ) : recentConnections.length > 0 ? (
            <>
              <FlatList
                data={recentConnections.slice(0, connectionsLimit)}
                renderItem={renderConnectionItem}
                keyExtractor={(item: any) => item.id}
                scrollEnabled={false}
                contentContainerStyle={{
                  paddingHorizontal: 0,
                }}
                showsVerticalScrollIndicator={false}
              />
              {(totalConnectionsCount !== undefined && totalConnectionsCount > connectionsLimit) ||
                (totalConnectionsCount === undefined && recentConnections.length >= connectionsLimit) ? (
                <TouchableOpacity
                  style={[ styles.viewMoreButton, {
                    marginTop: 16 * layoutScale,
                    paddingVertical: 12 * layoutScale,
                    borderRadius: 12 * layoutScale,
                  } ]}
                  onPress={() => navigation.navigate('AllCredentialsList' as never)}
                >
                  <Text style={[ styles.viewMoreText, {
                    fontSize: 14 * fontScale,
                    color: '#7C3AED',
                  } ]}>
                    View More
                  </Text>
                  <MaterialIcons
                    name="arrow-forward"
                    size={18 * iconScale}
                    color="#7C3AED"
                    style={{ marginLeft: 8 * layoutScale }}
                  />
                </TouchableOpacity>
              ) : null}
            </>
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tabbedSection: {},
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonText: {
    fontFamily: 'Poppins',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  viewMoreText: {
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
});

export default CredentialConnectionList;

