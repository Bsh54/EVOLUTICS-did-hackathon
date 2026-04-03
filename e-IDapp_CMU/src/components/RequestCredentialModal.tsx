import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  PixelRatio,
  Image,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { acceptInvitation, addPendingCredential, updatePendingCredential } from '../store/slices/credoSlice';
import { AppDispatch } from '../store';
import ErrorModal from './ErrorModal';
import LoadingModal from './LoadingModal';
import SuccessCredentialModal from './SuccessCredentialModal';
import { useAgentInitialization } from '../hooks/useAgentInitialization';
import { CredentialPreview } from '../features/credential-connection';
import { extractLabelFromInvitation } from '../utils/invitationDecoder';
import { parseInvitationUrl } from '../utils/invitationDecoder';
import base64 from 'react-native-base64';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const guideWidth = 375;
const guideHeight = 667;
const layoutScale = Math.min(Math.min(screenWidth / guideWidth, screenHeight / guideHeight), 1.2);
const fontScale = Math.min(PixelRatio.getFontScale() * (screenWidth / guideWidth), 1.5);
const iconScale = Math.min(PixelRatio.get() * (screenWidth / guideWidth), 1.2);

interface RequestCredentialModalProps {
  visible: boolean;
  onClose: () => void;
  invitationUrl?: string;
  credentialRecordId?: string;
  onNavigateToCredentials: () => void;
}

const RequestCredentialModal: React.FC<RequestCredentialModalProps> = ({ visible, onClose, invitationUrl, credentialRecordId, onNavigateToCredentials }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();

  // Ensure agent is initialized
  useAgentInitialization();

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [_establishedConnection, setEstablishedConnection] = useState<any>(null);
  const [invitationLabel, setInvitationLabel] = useState<string | null>(null);

  // Extract label when invitation URL changes
  useEffect(() => {
    const extractLabel = async () => {
      if (invitationUrl) {
        const label = await extractLabelFromInvitation(invitationUrl);
        setInvitationLabel(label);
      }
    };
    extractLabel();
  }, [invitationUrl]);

  // Use the decoded label or fallback to "Credential Request"
  const displayLabel = invitationLabel || 'Credential Request';

  const handleViewDetails = async () => {
    if (invitationUrl) {
      setShowLoadingModal(true);
      try {
        // Parse the invitation to extract credential offer data
        const decodedInvitation = await parseInvitationUrl(invitationUrl);

        console.log('Decoded invitation:', JSON.stringify(decodedInvitation, null, 2));

        // Extract credential attributes from the invitation
        let attributes: Array<{ name: string; value: string }> = [];

        // Check if invitation has requests~attach (credential offer)
        if (decodedInvitation?.['requests~attach']) {
          const attachments = decodedInvitation['requests~attach'];
          console.log('Found requests~attach:', JSON.stringify(attachments, null, 2));

          if (Array.isArray(attachments) && attachments.length > 0) {
            const attachment = attachments[0];

            // The credential preview might be base64-encoded in the attachment data
            let credentialPreview = null;

            // Try to decode base64 data if it exists
            if (attachment?.data?.base64) {
              try {
                const decodedData = base64.decode(attachment.data.base64);
                const parsedData = JSON.parse(decodedData);
                console.log('Decoded attachment data:', JSON.stringify(parsedData, null, 2));
                credentialPreview = parsedData.credential_preview;
              } catch (decodeError) {
                console.log('Error decoding base64 attachment:', decodeError);
              }
            }

            // Fallback to other possible paths
            if (!credentialPreview) {
              credentialPreview =
                attachment?.data?.json?.credential_preview ||
                attachment?.data?.credential_preview ||
                attachment?.credential_preview;
            }

            if (credentialPreview?.attributes) {
              attributes = credentialPreview.attributes.map((attr: any) => ({
                name: attr.name || attr['mime-type'] || '',
                value: attr.value || '',
              }));
            }
          }
        }

        console.log('Extracted attributes:', attributes);

        setShowLoadingModal(false);
        onClose();

        // Navigate with credential offer data
        navigation.navigate('CredentialRequestDetail' as never, {
          credentialOffer: {
            id: decodedInvitation?.['@id'] || 'unknown',
            comment: displayLabel,
            attributes: attributes,
            invitationUrl: invitationUrl,
          },
        } as never);

      } catch (error) {
        console.log('RequestCredentialModal: handleViewDetails error', error);
        setShowLoadingModal(false);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load credential details.');
        setShowErrorModal(true);
      }
    } else {
      // If no invitation URL, just close
      onClose();
      navigation.navigate('Home' as never);
    }
  };

  const handleAccept = async () => {
    const urlToUse: any = invitationUrl;

    // Don't close the modal immediately to keep state
    setShowLoadingModal(true); // Show loading modal

    try {

      const decodedInvitation = await parseInvitationUrl(urlToUse);
      const invitationId = decodedInvitation?.['@id'] || `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Add pending credential immediately for optimistic update
      dispatch(addPendingCredential({
        id: invitationId,
        label: displayLabel,
        invitationUrl: urlToUse,
      }));

      const result = await dispatch(acceptInvitation(urlToUse)).unwrap();
      console.log('RequestCredentialModal: acceptInvitation result', result);

      // Update pending credential with connectionId for better matching
      if (result?.connection?.id) {
        dispatch(updatePendingCredential({
          id: invitationId,
          connectionId: result.connection.id,
        }));
      }

      // Store the connection for display in success modal
      setEstablishedConnection(result);

      // Data will auto-refresh via event listeners (pending will be removed when credential completes)
      setShowLoadingModal(false); // Hide loading modal
      setShowSuccessModal(true); // Show success modal
    } catch (error) {
      console.log('RequestCredentialModal: acceptInvitation error', error);
      setShowLoadingModal(false); // Hide loading modal
      setErrorMessage(error instanceof Error ? error.message : 'Failed to accept invitation. Please try again.');
      setShowErrorModal(true); // Show error modal
    }
  };

  return (
    <>
      <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.popupContainer}>
            <View style={styles.popupHeader}>
              <View style={styles.popupTitle}>
                <Image source={require('../assets/images/diploma.png')} style={styles.popupTitleImage} />
              </View>
              <TouchableOpacity onPress={onClose} style={styles.popupCloseButton}>
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <CredentialPreview
              invitationLabel={invitationUrl ? displayLabel : undefined}
              layoutScale={layoutScale}
              fontScale={fontScale}
              iconScale={iconScale}
            />

            <View style={styles.popupButtonsContainer}>
              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={handleViewDetails}
              >
                <Text style={styles.viewDetailsText}>View Details</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
                <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading Modal  */}
      <LoadingModal
        visible={showLoadingModal}
      />

      {/* Success Modal  */}
      <SuccessCredentialModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setEstablishedConnection(null);
          onClose(); // Close parent modal
        }}
        onNavigateToCredentials={onNavigateToCredentials}
      />

      {/* Error Modal  */}
      <ErrorModal
        visible={showErrorModal}
        onClose={() => {
          setShowErrorModal(false);
          onClose(); // Close parent modal
        }}
        onNavigateToCredentials={onNavigateToCredentials}
        errorMessage={errorMessage}
      />
    </>
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  popupTitle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  popupTitleImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  popupCloseButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 5,
  },
  popupButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
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
});

export default RequestCredentialModal;