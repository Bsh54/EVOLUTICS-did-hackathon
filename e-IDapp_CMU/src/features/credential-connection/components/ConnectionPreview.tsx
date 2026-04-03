import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Connection } from '../../../store/slices/credoSlice';

interface ConnectionPreviewProps {
  connection?: Connection;
  invitationLabel?: string;
  layoutScale: number;
  fontScale: number;
  iconScale: number;
}

/**
 * Component to preview connection details before accepting
 * Can display connection data or invitation label
 * Uses same styling as ConnectionCard for consistency
 */
const ConnectionPreview: React.FC<ConnectionPreviewProps> = ({
  connection,
  invitationLabel,
  layoutScale,
  fontScale,
  iconScale,
}) => {
  // Extract display name from connection or use invitation label
  const displayName = connection?.outOfBandInvitation?.label ||
    connection?.outOfBandLabel ||
    connection?.theirLabel ||
    invitationLabel ||
    'New Connection';

  // Extract service endpoint for subtitle if available
  const serviceEndpoint = connection?.outOfBandInvitation?.services?.[0]?.serviceEndpoint;
  const serviceType = connection?.outOfBandInvitation?.services?.[0]?.type;

  const isCompleted = connection?.state === 'completed';

  return (
    <View style={[styles.connectionPreview, {
      borderRadius: 12 * layoutScale,
      padding: 16 * layoutScale,
    }]}>
      <View style={styles.connectionInfo}>
        <View style={[styles.connectionAvatar, {
          width: 50 * layoutScale,
          height: 50 * layoutScale,
          borderRadius: 25 * layoutScale,
          marginRight: 12 * layoutScale,
        }]}>
          {isCompleted ? (
            <MaterialIcons
              name="person"
              size={24 * iconScale}
              color="#FFFFFF"
            />
          ) : (
            <Image
              source={require('../../../assets/images/user.png')}
              style={{
                width: 50 * layoutScale,
                height: 50 * layoutScale,
                borderRadius: 25 * layoutScale,
              }}
            />
          )}
        </View>
        <View style={styles.connectionTextContainer}>
          <Text style={[styles.connectionName, {
            fontSize: 18 * fontScale,
          }]}>
            {displayName}
          </Text>
          <Text style={[styles.connectionMessage, {
            fontSize: 12 * fontScale,
          }]}>
            {serviceEndpoint
              ? `${serviceType || 'Service'}: ${serviceEndpoint.replace(/^https?:\/\//, '').split('/')[0]}`
              : connection?.state === 'completed'
                ? 'Connection established'
                : 'Wants to send you a connection request'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  connectionPreview: {
    backgroundColor: '#F9FAFB',
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  connectionAvatar: {
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionTextContainer: {
    flex: 1,
    minWidth: 150,
  },
  connectionName: {
    fontWeight: 'bold',
    fontFamily: 'Poppins',
    color: '#1F2937',
    marginBottom: 4,
  },
  connectionMessage: {
    color: '#4B5563',
    fontFamily: 'Poppins',
  },
});

export default ConnectionPreview;

