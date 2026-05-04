import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { CredentialDisplayItem } from '../hooks/useCredentials';

interface CredentialCardProps {
  item: CredentialDisplayItem;
  navigation: any;
  layoutScale: number;
  fontScale: number;
  iconScale: number;
}

const CredentialCard: React.FC<CredentialCardProps> = ({
  item,
  navigation,
  layoutScale,
  fontScale,
  iconScale,
}) => {
  return (
    <TouchableOpacity
      style={[styles.credentialItem, {
        marginBottom: 12 * layoutScale,
        marginHorizontal: 0,
        borderRadius: 16 * layoutScale,
        padding: 16 * layoutScale,
      }]}
      onPress={() => {
        // Navigate to CredentialDetail screen with the credential data
        navigation.navigate('CredentialDetail', { credential: item.credential || item });
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.credentialIcon, {
        width: 48 * layoutScale,
        height: 48 * layoutScale,
        borderRadius: 12 * layoutScale,
        backgroundColor: item.iconBg,
        marginRight: 16 * layoutScale,
      }]}>
        <MaterialIcons
          name={item.iconName as any}
          size={24 * iconScale}
          color="#FFFFFF"
        />
      </View>
      <View style={styles.credentialInfo}>
        <View style={styles.credentialHeader}>
          <Text
            style={[styles.credentialTitle, {
              fontSize: 16 * fontScale,
              lineHeight: 22 * fontScale,
            }, item.title === 'Unknown Issuer' && styles.unknownIssuer]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.title === 'Unknown Issuer' ? "Unknown Issuer" : item.title}
          </Text>
          {(item.credential?.state === 'offer-received' || item.credential?.state === 'processing' || item.credential?.isPending) && (
            <View style={[styles.statusBadge, {
              backgroundColor: item.credential?.state === 'processing' || item.credential?.isPending ? '#DBEAFE' : '#FEF3C7',
              paddingHorizontal: 8 * layoutScale,
              paddingVertical: 4 * layoutScale,
              borderRadius: 12 * layoutScale,
              marginLeft: 8 * layoutScale,
            }]}>
              <Text style={[styles.statusBadgeText, {
                fontSize: 10 * fontScale,
                color: item.credential?.state === 'processing' || item.credential?.isPending ? '#1E40AF' : '#92400E',
              }]}>
                {item.credential?.state === 'processing' || item.credential?.isPending ? 'Processing' : 'Pending'}
              </Text>
            </View>
          )}
        </View>
        {/* Only show subtitle if it's different from title and not "Unknown Issuer" */}
        {item.id && (
          <Text
            style={[styles.credentialSubtitle, {
              fontSize: 13 * fontScale,
              lineHeight: 18 * fontScale,
              marginTop: 4 * layoutScale,
            }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.id}
          </Text>
        )}
        {item.date && (
          <Text style={[styles.credentialDate, {
            fontSize: 12 * fontScale,
            marginTop: 4 * layoutScale,
          }]}>
            {item.date}
          </Text>
        )}
      </View>
      <View style={styles.credentialRight}>
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
  credentialItem: {
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
  credentialIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  credentialInfo: {
    flex: 1,
  },
  credentialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  credentialTitle: {
    fontWeight: 'bold',
    fontFamily: 'Poppins',
    color: '#1F2937',
  },
  unknownIssuer: {
    // color: '#9CA3AF',
    fontStyle: 'italic',
  },
  credentialSubtitle: {
    color: '#6B7280',
    fontFamily: 'Poppins',
    fontWeight: '400',
  },
  credentialRight: {
    alignItems: 'flex-end',
  },
  credentialDate: {
    color: '#7C3AED',
    fontFamily: 'Poppins',
    fontWeight: '400',
  },
  statusBadge: {},
  statusBadgeText: {
    fontFamily: 'Poppins',
    fontWeight: '600',
  },
});

export default CredentialCard;
