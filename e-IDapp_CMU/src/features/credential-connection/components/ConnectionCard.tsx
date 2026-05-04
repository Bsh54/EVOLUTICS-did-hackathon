import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { Connection } from '../../../store/slices/credoSlice';

interface ConnectionCardProps {
  item: Connection;
  navigation: any;
  layoutScale: number;
  fontScale: number;
  iconScale: number;
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({
  item,
  navigation,
  layoutScale,
  fontScale,
  iconScale,
}) => {
  // Get credentials from Redux store
  const credentials = useSelector((state: RootState) => state.credo.credentials);

  const connectionDate = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  const isCompleted = item.state === 'completed';
  // Use out-of-band invitation label if available, fallback to theirLabel
  let displayName = item.outOfBandInvitation?.label ||
    item.outOfBandLabel ||
    item.theirLabel ||
    'Unknown Connection';

  // Transform mediator-invite labels to be more user-friendly
  if (displayName.toLowerCase().startsWith('mediator-invite-')) {
    displayName = 'Mediator Connection';
  }

  // Extract service endpoint for subtitle if available
  const serviceEndpoint = item.outOfBandInvitation?.services?.[ 0 ]?.serviceEndpoint;
  const serviceType = item.outOfBandInvitation?.services?.[ 0 ]?.type;

  // Calculate credential count for this connection
  const credentialCount = useMemo(() => {
    if (!item || !credentials || credentials.length === 0) {
      return 0;
    }

    return credentials.filter((cred: any) => {
      // Match by connectionId (direct match)
      if (cred.connectionId === item.id) {
        return true;
      }
      // Match by outOfBandId (for credentials issued without connection)
      if (cred.outOfBandId && item.outOfBandId && cred.outOfBandId === item.outOfBandId) {
        return true;
      }
      return false;
    }).length;
  }, [credentials, item?.id, item?.outOfBandId]);

  return (
    <TouchableOpacity
      style={[ styles.connectionItem, {
        marginBottom: 12 * layoutScale,
        borderRadius: 16 * layoutScale,
        padding: 16 * layoutScale,
      } ]}
      onPress={() => {
        // Navigate to ConnectionDetail screen with the connection data
        navigation.navigate('ConnectionDetail', { connection: item });
      }}
      activeOpacity={0.7}
    >
      <View style={[ styles.connectionAvatar, {
        width: 48 * layoutScale,
        height: 48 * layoutScale,
        borderRadius: 24 * layoutScale,
        backgroundColor: isCompleted ? '#10B981' : '#F59E0B',
        marginRight: 16 * layoutScale,
      } ]}>
        <MaterialIcons
          name="person"
          size={24 * iconScale}
          color="#FFFFFF"
        />
      </View>
      <View style={styles.connectionInfo}>
        <View style={styles.connectionHeader}>
          <Text style={[ styles.connectionTitle, {
            fontSize: 16 * fontScale,
            lineHeight: 22 * fontScale,
          } ]} numberOfLines={1}>
            {displayName}
          </Text>
          {isCompleted && (
            <View style={[ styles.statusBadge, {
              backgroundColor: '#D1FAE5',
              paddingHorizontal: 8 * layoutScale,
              paddingVertical: 4 * layoutScale,
              borderRadius: 12 * layoutScale,
              marginLeft: 8 * layoutScale,
            } ]}>
              <Text style={[ styles.statusBadgeText, {
                fontSize: 10 * fontScale,
                color: '#065F46',
              } ]}>
                Active
              </Text>
            </View>
          )}
        </View>
        <Text style={[ styles.connectionSubtitle, {
          fontSize: 13 * fontScale,
          lineHeight: 18 * fontScale,
          marginTop: 4 * layoutScale,
        } ]} numberOfLines={1}>
          {serviceEndpoint
            ? `${serviceType || 'Service'}: ${serviceEndpoint.replace(/^https?:\/\//, '').split('/')[ 0 ]}`
            : item.state === 'completed'
              ? 'Connection established'
              : `Status: ${item.state}`}
        </Text>
        {connectionDate && (
          <Text style={[ styles.connectionDate, {
            fontSize: 12 * fontScale,
            marginTop: 4 * layoutScale,
          } ]}>
            {connectionDate}
          </Text>
        )}
        {credentialCount > 0 && (
          <View style={[ styles.credentialCountBadge, {
            marginTop: 6 * layoutScale,
          }]}>
            <MaterialIcons name="description" size={12 * iconScale} color="#7C3AED" />
            <Text style={[ styles.credentialCountText, {
              fontSize: 12 * fontScale,
              marginLeft: 4 * layoutScale,
            }]}>
              {credentialCount} {credentialCount === 1 ? 'credential' : 'credentials'}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.connectionRight}>
        <MaterialIcons
          name="keyboard-arrow-right"
          size={24 * iconScale}
          color="#9CA3AF"
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  connectionAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionInfo: {
    flex: 1,
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  connectionTitle: {
    fontWeight: 'bold',
    fontFamily: 'Poppins',
    color: '#1F2937',
    flex: 1,
  },
  connectionSubtitle: {
    color: '#6B7280',
    fontFamily: 'Poppins',
    fontWeight: '400',
  },
  connectionDate: {
    color: '#7C3AED',
    fontFamily: 'Poppins',
    fontWeight: '400',
  },
  connectionRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {},
  statusBadgeText: {
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  credentialCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  credentialCountText: {
    color: '#7C3AED',
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
});

export default ConnectionCard;

