import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { CredentialOfferPreview } from '../services/CredoAgentService';
import { credoAgentService } from '../services/agent';

interface AcceptCredentialModalProps {
  visible: boolean;
  credentialOffer?: CredentialOfferPreview | null;
  onAccept: () => void;
  onReject: () => void;
  loading?: boolean;
}

const AcceptCredentialModal: React.FC<AcceptCredentialModalProps> = ({
  visible,
  credentialOffer,
  onAccept,
  onReject,
  loading = false,
}) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [accepting, setAccepting] = useState(false);

  const handleAccept = async () => {
    if (!credentialOffer?.id) {
      Alert.alert('Error', 'No credential offer found');
      return;
    }

    try {
      setAccepting(true);
      console.log('Accepting credential offer:', credentialOffer.id);
      
      await credoAgentService.acceptCredentialOffer(credentialOffer.id);
      
      // Wait a bit for credential to be fully processed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Data will auto-refresh via event listeners
      Alert.alert(
        'Success',
        'Credential accepted successfully!',
        [{ text: 'OK', onPress: () => {
          onAccept();
          onReject(); // Close modal
          // Navigate to Credentials screen to see the new credential
          navigation.navigate('Credentials' as never);
        }}]
      );
    } catch (error) {
      console.error('Error accepting credential:', error);
      Alert.alert(
        'Error',
        `Failed to accept credential: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!credentialOffer?.id) {
      onReject();
      return;
    }

    Alert.alert(
      'Decline Credential',
      'Are you sure you want to decline this credential offer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await credoAgentService.declineCredentialOffer(credentialOffer.id);
              onReject();
            } catch (error) {
              console.error('Error declining credential:', error);
              onReject();
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onReject}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.popupContainer}>
          <View style={styles.popupHeader}>
            <Text style={styles.popupTitle}>New Credential Offer</Text>
            <TouchableOpacity onPress={onReject} style={styles.popupCloseButton}>
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

            <View style={styles.timeContainer}>
              <MaterialIcons name="access-time" size={15} color="#6B7280" />
              <Text style={styles.popupTime}>1hr ago</Text>
            </View>

          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.connectionInfo}>
              <Image
                source={require('../assets/images/user.png')}
                style={styles.profileImage}
              />
              <View style={styles.connectionTextContainer}>
                <Text style={styles.connectionName}>
                  {credentialOffer?.comment || 'Credential Issuer'}
                </Text>
                <Text style={styles.connectionMessage}>
                  Wants to send you a credential
                </Text>
              </View>
            </View>

            {credentialOffer?.attributes && credentialOffer.attributes.length > 0 && (
              <View style={styles.attributesContainer}>
                <Text style={styles.attributesTitle}>Attributes:</Text>
                {credentialOffer.attributes.map((attr, index) => (
                  <View key={index} style={styles.attributeRow}>
                    <Text style={styles.attributeName}>{attr.name}:</Text>
                    <Text style={styles.attributeValue}>{attr.value}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.popupButtonsContainer}>
            <TouchableOpacity 
              style={styles.viewDetailsButton} 
              onPress={() => {
                onReject();
                navigation.navigate('CredentialRequestDetail', { credentialOffer: credentialOffer });
              }}
            >
              <Text style={styles.viewDetailsText}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.acceptButton, (accepting || loading) && styles.acceptButtonDisabled]}
              onPress={handleAccept}
              disabled={accepting || loading}
            >
              <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
              <Text style={styles.acceptText}>
                {accepting || loading ? 'Accepting...' : 'Accept'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    width: '90%',
    minHeight: 273,
    maxWidth: 375,
    backgroundColor: '#FFFFFF',
    borderRadius: 13.39,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20.93 },
    shadowOpacity: 0.25,
    shadowRadius: 41.85,
    elevation: 10,
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  popupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7E22CE',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  popupCloseButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 5,
  },
  popupTime: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 10,
    left: 3,
    width: 60,
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  connectionTextContainer: {
    flex: 1,
    minWidth: 150,
  },
  connectionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  connectionMessage: {
    fontSize: 12,
    color: '#4B5563',
  },
  popupButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  viewDetailsButton: {
    flex: 1,
    minWidth: 130,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#5b18b8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5b18b8',
  },
  acceptButton: {
    flex: 1,
    minWidth: 130,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7E22CE',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  timeContainer: {
    flexDirection: 'row',
  },
  contentScroll: {
    maxHeight: 400,
  },
  attributesContainer: {
    marginTop: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  attributesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  attributeRow: {
    marginBottom: 8,
  },
  attributeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B18B8',
    marginBottom: 2,
  },
  attributeValue: {
    fontSize: 14,
    color: '#1F2937',
  },
  acceptButtonDisabled: {
    opacity: 0.6,
  },
});

export default AcceptCredentialModal;