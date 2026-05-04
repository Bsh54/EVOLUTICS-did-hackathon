import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { MappedConnection } from '../hooks/useConnectionMapping';

interface ConnectionCardWithActionsProps {
  item: MappedConnection;
  navigation: any;
  layoutScale: number;
  fontScale: number;
  iconScale: number;
  showActions?: boolean;
  onAccept?: () => void;
  onRemove?: () => void;
  onViewDetails?: () => void;
}

/**
 * Enhanced connection card with action buttons
 * Shows View Details, Accept, Remove buttons based on connection status
 * Used in AllCredentialsListScreen and other full-screen list views
 */
const ConnectionCardWithActions: React.FC<ConnectionCardWithActionsProps> = ({
  item,
  navigation,
  layoutScale,
  fontScale,
  iconScale,
  showActions = true,
  onAccept,
  onRemove,
  onViewDetails,
}) => {
  // Get credentials from Redux store
  const credentials = useSelector((state: RootState) => state.credo.credentials);

  // Calculate credential count for this connection
  const credentialCount = useMemo(() => {
    if (!item.connection || !credentials || credentials.length === 0) {
      return 0;
    }

    const connection = item.connection;
    return credentials.filter((cred: any) => {
      // Match by connectionId (direct match)
      if (cred.connectionId === connection.id) {
        return true;
      }
      // Match by outOfBandId (for credentials issued without connection)
      if (cred.outOfBandId && connection.outOfBandId && cred.outOfBandId === connection.outOfBandId) {
        return true;
      }
      return false;
    }).length;
  }, [credentials, item.connection?.id, item.connection?.outOfBandId]);

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails();
    } else {
      navigation.navigate('ConnectionDetail', { connection: item.connection || item });
    }
  };

  const handleAccept = () => {
    if (onAccept) {
      onAccept();
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.connectionCard, {
        marginHorizontal: 16 * layoutScale,
        marginBottom: 16 * layoutScale,
        borderRadius: 16 * layoutScale,
        padding: 20 * layoutScale,
      }]}
      onPress={handleViewDetails}
      activeOpacity={0.7}
    >
      <View style={styles.connectionHeader}>
        <View style={styles.avatarContainer}>
          <Image
            source={require('../../../assets/images/user.png')}
            style={[styles.avatar, {
              width: 50 * layoutScale,
              height: 50 * layoutScale,
              borderRadius: 25 * layoutScale,
            }]}
          />
          {item.isOnline && (
            <View style={[styles.onlineIndicator, {
              width: 14 * layoutScale,
              height: 14 * layoutScale,
              borderRadius: 7 * layoutScale,
              bottom: 2 * layoutScale,
              right: 2 * layoutScale,
            }]} />
          )}
        </View>
        <View style={styles.connectionInfo}>
          <View style={styles.connectionHeader}>
            <Text style={[styles.connectionTitle, {
              fontSize: 18 * fontScale,
              lineHeight: 24 * fontScale,
            }]}>
              {item.title}
            </Text>
            {item.state === 'completed' && (
              <View style={[styles.statusBadge, {
                backgroundColor: '#D1FAE5',
                paddingHorizontal: 8 * layoutScale,
                paddingVertical: 4 * layoutScale,
                borderRadius: 12 * layoutScale,
                marginLeft: 8 * layoutScale,
              }]}>
                <Text style={[styles.statusBadgeText, {
                  fontSize: 10 * fontScale,
                  color: '#065F46',
                }]}>
                  Completed
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.connectionSubtitle, {
            fontSize: 14 * fontScale,
            lineHeight: 20 * fontScale,
            marginTop: 4 * layoutScale,
          }]}>
            {item.subtitle}
          </Text>
          {item.date && (
            <Text style={[styles.connectionDate, {
              fontSize: 12 * fontScale,
              marginTop: 4 * layoutScale,
            }]}>
              {item.date}
            </Text>
          )}
          {credentialCount > 0 && (
            <View style={[styles.credentialCountBadge, {
              marginTop: 6 * layoutScale,
            }]}>
              <MaterialIcons name="description" size={12 * iconScale} color="#7C3AED" />
              <Text style={[styles.credentialCountText, {
                fontSize: 12 * fontScale,
                marginLeft: 4 * layoutScale,
              }]}>
                {credentialCount} {credentialCount === 1 ? 'credential' : 'credentials'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {showActions && item.status === 'new' && (
        <View style={[styles.actionButtons, {
          marginTop: 20 * layoutScale,
        }]}>
          <TouchableOpacity
            style={[styles.viewDetailsButton, {
              flex: 1,
              paddingVertical: 12 * layoutScale,
              borderRadius: 25 * layoutScale,
              marginRight: 8 * layoutScale,
            }]}
            onPress={handleViewDetails}
          >
            <Text style={[styles.viewDetailsText, {
              fontSize: 14 * fontScale,
            }]}>
              View Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.acceptButton, {
              flex: 1,
              paddingVertical: 12 * layoutScale,
              borderRadius: 25 * layoutScale,
              marginLeft: 8 * layoutScale,
            }]}
            onPress={handleAccept}
          >
            <MaterialIcons name="check-circle-outline" size={16 * iconScale} color="#FFFFFF" />
            <Text style={[styles.acceptButtonText, {
              fontSize: 14 * fontScale,
              marginLeft: 6 * layoutScale,
            }]}>
              Accept
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {showActions && item.status === 'accepted' && (
        <View style={[styles.actionButtons, {
          marginTop: 20 * layoutScale,
        }]}>
          <TouchableOpacity
            style={[styles.viewDetailsButton, {
              flex: 1,
              paddingVertical: 12 * layoutScale,
              borderRadius: 25 * layoutScale,
              marginRight: 8 * layoutScale,
            }]}
            onPress={handleViewDetails}
          >
            <Text style={[styles.viewDetailsText, {
              fontSize: 14 * fontScale,
            }]}>
              View Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.removeButton, {
              flex: 1,
              paddingVertical: 12 * layoutScale,
              borderRadius: 25 * layoutScale,
              marginLeft: 8 * layoutScale,
            }]}
            onPress={handleRemove}
          >
            <MaterialIcons name="remove-circle-outline" size={16 * iconScale} color="#FFFFFF" />
            <Text style={[styles.removeButtonText, {
              fontSize: 14 * fontScale,
              marginLeft: 6 * layoutScale,
            }]}>
              Remove
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  connectionCard: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    backgroundColor: '#F3F4F6',
  },
  onlineIndicator: {
    position: 'absolute',
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  connectionInfo: {
    flex: 1,
  },
  connectionTitle: {
    fontWeight: '700',
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
    color: '#9CA3AF',
    fontFamily: 'Poppins',
    fontWeight: '400',
  },
  statusBadge: {},
  statusBadgeText: {
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  viewDetailsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsText: {
    color: '#7C3AED',
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: '#5b18b8',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#5b18b8',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  removeButtonText: {
    color: '#FFFFFF',
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

export default ConnectionCardWithActions;

