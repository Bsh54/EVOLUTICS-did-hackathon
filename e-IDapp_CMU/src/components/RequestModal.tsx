import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  PixelRatio,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { acceptInvitation, declineConnection } from '../store/slices/credoSlice';
import { AppDispatch } from '../store';
import ErrorModal from './ErrorModal';
import LoadingModal from './LoadingModal';
import DeclineModal from './DeclineModal';
import { useAgentInitialization } from '../hooks/useAgentInitialization';
import { ConnectionPreview, ConnectionSuccessModal, useDataRefresh } from '../features/credential-connection';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const guideWidth = 375;
const guideHeight = 667;
const layoutScale = Math.min(Math.min(screenWidth / guideWidth, screenHeight / guideHeight), 1.2);
const fontScale = Math.min(PixelRatio.getFontScale() * (screenWidth / guideWidth), 1.5);
const iconScale = Math.min(PixelRatio.get() * (screenWidth / guideWidth), 1.2);

interface RequestModalProps {
  visible: boolean;
  onClose: () => void;
  invitationUrl?: string;
  invitationLabel?: string | null;
  connectionId?: string;
  onNavigateToCredentials: () => void;
}

const RequestModal: React.FC<RequestModalProps> = ({ visible, onClose, invitationUrl, invitationLabel, connectionId, onNavigateToCredentials }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { refreshData } = useDataRefresh();

  // Ensure agent is initialized
  useAgentInitialization();

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [establishedConnection, setEstablishedConnection] = useState<any>(null);

  const handleDecline = async () => {
    if (invitationUrl) {
      setShowLoadingModal(true);
      try {
        await dispatch(declineConnection(invitationUrl)).unwrap();
        setShowLoadingModal(false);
        onClose();
        setShowDeclineModal(true);
      } catch (error) {
        console.log('RequestModal: declineConnection error', error);
        setShowLoadingModal(false);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to decline connection.');
        setShowErrorModal(true);
      }
    } else {
      // If no connection ID, just close
      onClose();
      setShowDeclineModal(true);
    }
  };

  const handleAccept = async () => {
    const urlToUse: any = invitationUrl;

    onClose(); // Close the request modal first
    setShowLoadingModal(true); // Show loading modal

    try {
      console.log('URL: ', urlToUse);

      // RequestModal is for regular connections, not credential offers
      // Don't add pending credential here - only RequestCredentialModal should do that

      const result = await dispatch(acceptInvitation(urlToUse)).unwrap();
      console.log('RequestModal: acceptInvitation result', result);

      // Store the connection for display in success modal
      setEstablishedConnection(result);

      // Data will auto-refresh via event listeners (pending will be removed when credential completes)
      setShowLoadingModal(false); // Hide loading modal
      setShowSuccessModal(true); // Show success modal
    } catch (error) {
      console.log('RequestModal: acceptInvitation error', error);
      setShowLoadingModal(false); // Hide loading modal
      setErrorMessage(error instanceof Error ? error.message : 'Failed to accept invitation. Please try again.');
      setShowErrorModal(true); // Show error modal
    }
  };

  // Use the decoded label or fallback to "New Connection"
  const displayLabel = invitationLabel || 'New Connection';

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
              <Text style={styles.popupTitle}>New Connection Request</Text>
              <TouchableOpacity onPress={onClose} style={styles.popupCloseButton}>
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.timeContainer}>
              <MaterialIcons name="access-time" size={15} color="#6B7280" />
              <Text style={styles.popupTime}>Just now</Text>
            </View>

            <ConnectionPreview
              invitationLabel={invitationUrl ? displayLabel : undefined}
              layoutScale={layoutScale}
              fontScale={fontScale}
              iconScale={iconScale}
            />

            <View style={styles.popupButtonsContainer}>
              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={handleDecline}
              >
                <Text style={styles.viewDetailsText}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
                <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading Modal */}
      <LoadingModal
        visible={showLoadingModal}
      />

      {/* Success Modal */}
      <ConnectionSuccessModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setEstablishedConnection(null);
        }}
        connection={establishedConnection}
        onNavigateToConnections={onNavigateToCredentials}
      />

      {/* Error Modal */}
      <ErrorModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        onNavigateToCredentials={onNavigateToCredentials}
        errorMessage={errorMessage}
      />

      {/* Decline Modal */}
      <DeclineModal
        visible={showDeclineModal}
        onClose={() => setShowDeclineModal(false)}
        onNavigateToCredentials={() => {
          setShowDeclineModal(false);
          navigation.navigate('Home' as never);
        }}
        errorMessage="Request declined successfully."
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
  timeContainer: {
    flexDirection: 'row',
  },
});

export default RequestModal;