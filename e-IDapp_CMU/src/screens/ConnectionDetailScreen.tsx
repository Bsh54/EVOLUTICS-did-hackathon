import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  PixelRatio,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { RootStackParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');
const fontScale = Math.min(PixelRatio.getFontScale() * (width / 375), 1.5);
const layoutScale = Math.min(Math.min(width / 375, Dimensions.get('window').height / 667), 1.2);

type ConnectionDetailRouteProp = RouteProp<RootStackParamList, 'ConnectionDetail'>;

const ConnectionDetailScreen = ({ navigation }: { navigation: any }) => {
  const route = useRoute<ConnectionDetailRouteProp>();
  const { connection } = route.params;

  // Get credentials from Redux store
  const credentials = useSelector((state: RootState) => state.credo.credentials);

  const connectionDate = connection?.createdAt 
    ? new Date(connection.createdAt).toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Unknown';
  
  const isCompleted = connection?.state === 'completed';
  const displayName = connection?.theirLabel || 
                      connection?.outOfBandLabel || 
                      connection?.outOfBandInvitation?.label || 
                      'Unknown Connection';
  const connectionId = connection?.id || 'N/A';
  const theirDid = connection?.theirDid || 'N/A';
  
  // Extract out-of-band invitation data
  const oobInvitation = connection?.outOfBandInvitation;
  const handshakeProtocols = connection?.handshakeProtocols || oobInvitation?.handshake_protocols || [];
  const acceptProtocols = oobInvitation?.accept || [];
  const services = oobInvitation?.services || [];
  const serviceEndpoint = services[0]?.serviceEndpoint;
  const recipientKeys = services[0]?.recipientKeys || [];

  // Calculate credential count for this connection
  const credentialCount = useMemo(() => {
    if (!connection || !credentials || credentials.length === 0) {
      return 0;
    }

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
  }, [credentials, connection?.id, connection?.outOfBandId]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#7C3AED', '#A855F7']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Connection Details</Text>
          <TouchableOpacity style={styles.menuButton}>
            <MaterialIcons name="more-vert" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardContainer}>
          <View style={[styles.avatarContainer, {
            width: 100 * layoutScale,
            height: 100 * layoutScale,
            borderRadius: 50 * layoutScale,
            backgroundColor: isCompleted ? '#10B981' : '#F59E0B',
          }]}>
            <MaterialIcons
              name="person"
              size={50 * layoutScale}
              color="#FFFFFF"
            />
          </View>
          <Text style={[styles.connectionName, {
            fontSize: 24 * fontScale,
            marginTop: 16 * layoutScale,
          }]}>
            {displayName}
          </Text>
          <View style={[styles.statusBadge, {
            marginTop: 8 * layoutScale,
            backgroundColor: isCompleted ? '#D1FAE5' : '#FEF3C7',
          }]}>
            <Text style={[styles.statusText, {
              fontSize: 14 * fontScale,
              color: isCompleted ? '#065F46' : '#92400E',
            }]}>
              {isCompleted ? 'Active' : connection?.state || 'Pending'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="info" size={20} color="#7C3AED" />
            <Text style={[styles.sectionTitle, {
              fontSize: 18 * fontScale,
              marginLeft: 8 * layoutScale,
            }]}>
              Connection Information
            </Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, {
                fontSize: 14 * fontScale,
              }]}>Connection ID</Text>
              <Text style={[styles.infoValue, {
                fontSize: 14 * fontScale,
              }]} numberOfLines={1} ellipsizeMode="middle">
                {connectionId}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, {
                fontSize: 14 * fontScale,
              }]}>Their DID</Text>
              <Text style={[styles.infoValue, {
                fontSize: 14 * fontScale,
              }]} numberOfLines={1} ellipsizeMode="middle">
                {theirDid}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, {
                fontSize: 14 * fontScale,
              }]}>Status</Text>
              <Text style={[styles.infoValue, {
                fontSize: 14 * fontScale,
                color: isCompleted ? '#10B981' : '#F59E0B',
                fontWeight: 'bold',
                textTransform: 'capitalize',
              }]}>
                {connection?.state || 'Unknown'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, {
                fontSize: 14 * fontScale,
              }]}>Created</Text>
              <Text style={[styles.infoValue, {
                fontSize: 14 * fontScale,
              }]}>
                {connectionDate}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, {
                fontSize: 14 * fontScale,
              }]}>Credentials</Text>
              <Text style={[styles.infoValue, {
                fontSize: 14 * fontScale,
                color: '#7C3AED',
                fontWeight: 'bold',
              }]}>
                {credentialCount} {credentialCount === 1 ? 'credential' : 'credentials'}
              </Text>
            </View>
          </View>
        </View>

        {/* Out-of-Band Invitation Details */}
        {oobInvitation && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="link" size={20} color="#7C3AED" />
              <Text style={[styles.sectionTitle, {
                fontSize: 18 * fontScale,
                marginLeft: 8 * layoutScale,
              }]}>
                Invitation Details
              </Text>
            </View>

            <View style={styles.infoCard}>
              {oobInvitation.label && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, {
                      fontSize: 14 * fontScale,
                    }]}>Invitation Label</Text>
                    <Text style={[styles.infoValue, {
                      fontSize: 14 * fontScale,
                    }]} numberOfLines={2}>
                      {oobInvitation.label}
                    </Text>
                  </View>
                  <View style={styles.divider} />
                </>
              )}

              {oobInvitation.goal && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, {
                      fontSize: 14 * fontScale,
                    }]}>Goal</Text>
                    <Text style={[styles.infoValue, {
                      fontSize: 14 * fontScale,
                    }]} numberOfLines={2}>
                      {oobInvitation.goal}
                    </Text>
                  </View>
                  <View style={styles.divider} />
                </>
              )}

              {serviceEndpoint && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, {
                      fontSize: 14 * fontScale,
                    }]}>Service Endpoint</Text>
                    <Text style={[styles.infoValue, {
                      fontSize: 12 * fontScale,
                    }]} numberOfLines={2} ellipsizeMode="middle">
                      {serviceEndpoint}
                    </Text>
                  </View>
                  <View style={styles.divider} />
                </>
              )}

              {handshakeProtocols.length > 0 && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, {
                      fontSize: 14 * fontScale,
                    }]}>Handshake Protocols</Text>
                    <View style={styles.protocolContainer}>
                      {handshakeProtocols.map((protocol: string, index: number) => (
                        <View key={index} style={styles.protocolChip}>
                          <Text style={[styles.protocolText, {
                            fontSize: 11 * fontScale,
                          }]}>
                            {protocol.split('/').pop() || protocol}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={styles.divider} />
                </>
              )}

              {acceptProtocols.length > 0 && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, {
                      fontSize: 14 * fontScale,
                    }]}>Accepted Protocols</Text>
                    <View style={styles.protocolContainer}>
                      {acceptProtocols.map((protocol: string, index: number) => (
                        <View key={index} style={[styles.protocolChip, {
                          backgroundColor: '#E0E7FF',
                        }]}>
                          <Text style={[styles.protocolText, {
                            fontSize: 11 * fontScale,
                            color: '#4338CA',
                          }]}>
                            {protocol}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Credential Attributes from Out-of-Band */}
        {connection?.credentialAttributesFromOOB && connection.credentialAttributesFromOOB.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="description" size={20} color="#7C3AED" />
              <Text style={[styles.sectionTitle, {
                fontSize: 18 * fontScale,
                marginLeft: 8 * layoutScale,
              }]}>
                Credential Preview
              </Text>
            </View>

            <View style={styles.infoCard}>
              {connection.credentialAttributesFromOOB.map((attr: any, index: number) => (
                <View key={index}>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, {
                      fontSize: 14 * fontScale,
                    }]}>{attr.name}</Text>
                    <Text style={[styles.infoValue, {
                      fontSize: 14 * fontScale,
                    }]} numberOfLines={2}>
                      {attr.value}
                    </Text>
                  </View>
                  {index < connection.credentialAttributesFromOOB.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {connection?.updatedAt && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="update" size={20} color="#7C3AED" />
              <Text style={[styles.sectionTitle, {
                fontSize: 18 * fontScale,
                marginLeft: 8 * layoutScale,
              }]}>
                Last Updated
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={[styles.infoValue, {
                fontSize: 14 * fontScale,
              }]}>
                {new Date(connection.updatedAt).toLocaleDateString('en-GB', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerGradient: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 40 * layoutScale,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16 * layoutScale,
    paddingTop: 10 * layoutScale,
  },
  headerTitle: {
    fontSize: 18 * fontScale,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Poppins',
  },
  backButton: {
    padding: 8 * layoutScale,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20 * layoutScale,
  },
  menuButton: {
    padding: 8 * layoutScale,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20 * layoutScale,
  },
  cardContainer: {
    alignItems: 'center',
    marginTop: 20 * layoutScale,
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  connectionName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'Poppins',
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 16 * layoutScale,
    paddingVertical: 6 * layoutScale,
    borderRadius: 20 * layoutScale,
  },
  statusText: {
    fontFamily: 'Poppins',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  scrollContainer: {
    flex: 1,
    paddingTop: 20 * layoutScale,
  },
  section: {
    marginBottom: 24 * layoutScale,
    paddingHorizontal: 20 * layoutScale,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12 * layoutScale,
  },
  sectionTitle: {
    color: '#1F2937',
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16 * layoutScale,
    padding: 20 * layoutScale,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12 * layoutScale,
  },
  infoLabel: {
    color: '#6B7280',
    fontFamily: 'Poppins',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    color: '#1F2937',
    fontFamily: 'Poppins',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4 * layoutScale,
  },
  protocolContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 2,
    justifyContent: 'flex-end',
  },
  protocolChip: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8 * layoutScale,
    paddingVertical: 4 * layoutScale,
    borderRadius: 8 * layoutScale,
    marginLeft: 4 * layoutScale,
    marginBottom: 4 * layoutScale,
  },
  protocolText: {
    color: '#1E40AF',
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
});

export default ConnectionDetailScreen;

