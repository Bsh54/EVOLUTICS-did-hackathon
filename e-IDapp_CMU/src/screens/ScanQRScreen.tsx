import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, AppState, TouchableOpacity } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import RequestModal from '../components/RequestModal';
import RequestCredentialModal from '../components/RequestCredentialModal';
import ProofRequestModal from '../components/ProofRequestModal';
import { ZkpRequestModal } from '../features/zkp';
import { MainStackParamList } from '../navigation/DrawerNavigator';
import { credoAgentService } from '../services/agent';
import { getInvitationDetails } from '../utils/invitationDecoder';
import { extractQueryParam } from '../utils/coreInvitationDecoder';
import { saveTemplateData } from '../utils/templateStorage';
import { ProofState } from '@credo-ts/core';

const { width: screenWidth } = Dimensions.get('window');

type ScanQRScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Scan QR'>;

const ScanQRScreen: React.FC = () => {
  const navigation = useNavigation<ScanQRScreenNavigationProp>();
  const isFocused = useIsFocused();
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  const [modalVisible, setModalVisible] = useState(false);
  const [scannedUrl, setScannedUrl] = useState<string | undefined>(undefined);
  const [invitationLabel, setInvitationLabel] = useState<string | null>(null);
  const [isCredentialRequest, setIsCredentialRequest] = useState(false);
  const [isProofRequest, setIsProofRequest] = useState(false);
  const [isZkpRequest, setIsZkpRequest] = useState(false);
  const [zkpProofRecordId, setZkpProofRecordId] = useState<string | null>(null);
  const [hasRequested, setHasRequested] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // App state management for camera lifecycle
  const appState = useRef(AppState.currentState);
  const [isAppStateActive, setIsAppStateActive] = useState(appState.current === 'active');

  // Scanning control refs
  const isProcessing = useRef(false);
  const lastScanned = useRef<{ value: string; time: number } | null>(null);
  const cameraInitTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const previousState = appState.current;
      appState.current = nextAppState;
      setIsAppStateActive(nextAppState === 'active');

      // Reset camera ready state when app becomes active again
      if (previousState !== 'active' && nextAppState === 'active') {
        console.log('📱 App became active, reinitializing camera...');
        setIsCameraReady(false);
        // Small delay to ensure proper reinitialization
        setTimeout(() => setIsCameraReady(true), 100);
      }
    });

    return () => {
      subscription.remove();
      if (cameraInitTimeout.current) {
        clearTimeout(cameraInitTimeout.current);
      }
    };
  }, []);

  // Initialize camera when screen is focused and device is available
  useEffect(() => {
    if (isFocused && device && hasPermission && isAppStateActive) {
      console.log('📷 Initializing camera...');
      setIsCameraReady(false);

      // Clear any existing timeout
      if (cameraInitTimeout.current) {
        clearTimeout(cameraInitTimeout.current);
      }

      // Small delay to ensure proper initialization
      cameraInitTimeout.current = setTimeout(() => {
        setIsCameraReady(true);
        console.log('✅ Camera ready');
      }, 300);
    } else {
      setIsCameraReady(false);
    }

    return () => {
      if (cameraInitTimeout.current) {
        clearTimeout(cameraInitTimeout.current);
      }
    };
  }, [isFocused, device, hasPermission, isAppStateActive]);

  // Determine if camera should be active
  // Active when: Screen is focused AND App is active AND Modal is closed AND Camera is ready
  const isCameraActive = isFocused && isAppStateActive && !modalVisible && isCameraReady && device != null;

  // Helper to get agent instance
  // Use service directly to avoid dependency on CredoAgentProvider context
  const getAgent = (): any => {
    if (credoAgentService.isAgentInitialized()) {
      return credoAgentService.getAgent();
    }
    return null;
  };

  const handleNavigateToHome = () => {
    navigation.navigate('Home');
  };

  const handleNavigateToConnections = () => {
    // Navigate to AllCredentialsList screen (ConnectionsFullList) in the parent Stack navigator
    (navigation as any).navigate('AllCredentialsList' as never);
  };

  const handleZkpInvitation = async (invitationUrl: string) => {
    const agent = getAgent();

    if (!agent) {
      console.error('Agent not initialized, cannot handle ZKP invitation');
      return;
    }

    // Helper function to check for existing proof requests
    const checkForProofRequest = async (): Promise<boolean> => {
      try {
        const allProofs = await agent.proofs.getAll();
        const requestReceived = allProofs.filter(
          (p: any) => p.state === ProofState.RequestReceived
        );

        if (requestReceived.length > 0) {
          // Use the most recent proof request
          const latestProof = requestReceived.sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];

          console.log('📋 Found proof request:', latestProof.id);
          setZkpProofRecordId(latestProof.id);
          setModalVisible(true);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error checking for proof requests:', error);
        return false;
      }
    };

    try {
      console.log('📥 Processing ZKP invitation...');
      console.log('🔗 Invitation URL:', invitationUrl);

      // Accept the invitation (this may create a connection and trigger proof request)
      const { connectionRecord } = await agent.oob.receiveInvitationFromUrl(invitationUrl, {
        // autoAcceptConnection: true,
        // autoAcceptInvitation: true,
      });

      // Log connection record if created
      if (connectionRecord) {
        console.log('🔗 Connection Record:', JSON.stringify({
          id: connectionRecord.id,
          state: connectionRecord.state,
          theirLabel: connectionRecord.theirLabel,
          theirDid: connectionRecord.theirDid,
          createdAt: connectionRecord.createdAt,
          updatedAt: connectionRecord.updatedAt,
        }, null, 2));
      }

      console.log('✅ Invitation accepted, waiting for proof request...');

      // Poll for proof records in RequestReceived state
      // In a real implementation, you'd use event listeners, but polling works for now
      let attempts = 0;
      const maxAttempts = 20;
      const pollInterval = setInterval(async () => {
        attempts++;
        const found = await checkForProofRequest();

        if (found || attempts >= maxAttempts) {
          clearInterval(pollInterval);
          if (!found) {
            console.warn('⚠️ Proof request not found after polling');
          }
        }
      }, 500);
    } catch (error: any) {
      // Check if this is a duplicate invitation error
      const errorMessage = error?.message || '';
      const isDuplicateInvitation = errorMessage.includes('has already been received') ||
        errorMessage.includes('already been received');

      if (isDuplicateInvitation) {
        console.log('ℹ️ Invitation already received, checking for existing proof request...');

        // Try to get the existing OOB record
        try {
          // Extract invitation ID from error message or URL
          const invitationIdMatch = errorMessage.match(/invitation\s+([a-f0-9-]+)/i);
          if (invitationIdMatch) {
            const invitationId = invitationIdMatch[1];
            console.log('🔍 Looking for OOB record with invitation ID:', invitationId);
          }
        } catch (oobError) {
          console.error('❌ Error fetching OOB records:', oobError);
        }

        // Check if there's already a proof request associated with this invitation
        const found = await checkForProofRequest();

        if (found) {
          console.log('✅ Found existing proof request for duplicate invitation');
          // Proof request found and modal will be shown
          return;
        } else {
          console.warn('⚠️ Duplicate invitation but no proof request found yet. The invitation may still be processing.');
          // Optionally show a message to the user or wait a bit longer
          // For now, we'll just log and return
        }
      } else {
        // Some other error occurred
        console.error('❌ Error handling ZKP invitation:', error);
      }
    }
  };

  // Create code scanner for QR codes
  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: async (codes) => {
      // Block if we are already processing a code or if modal is visible
      if (isProcessing.current || modalVisible) return;

      if (codes?.length) {
        const value = codes[0]?.value ?? '';
        if (value) {
          const now = Date.now();

          // Debounce: prevent rescanning the same code within 3 seconds
          if (lastScanned.current &&
            lastScanned.current.value === value &&
            (now - lastScanned.current.time < 3000)) {
            return;
          }

          // Lock processing
          isProcessing.current = true;
          lastScanned.current = { value, time: now };

          try {
            // Step 1: Log raw QR code data after scanning
            if (typeof value === 'object' && value !== null) {
              console.log('📱 [QR SCAN] Raw QR Code Data:', JSON.stringify((value as any)["requests~attach"]?.[0]?.data?.base64 as string, null, 2));
            }

            setScannedUrl(value);

            // Optimized parsing: Get all details in one go
            const details = await getInvitationDetails(value);
            console.log('📊 [PROCESS] Invitation Details:', details);

            setInvitationLabel(details.label);

            // Use type parameter from URL to determine which modal to open
            if (details.type) {
              const typeParam = details.type.toLowerCase();
              switch (typeParam) {
                case 'offer':
                  setIsCredentialRequest(true);
                  setIsProofRequest(false);
                  setIsZkpRequest(false);
                  break;
                case 'proof':
                  setIsCredentialRequest(false);
                  setIsProofRequest(true);
                  setIsZkpRequest(false);
                  break;
                case 'connection':
                  setIsCredentialRequest(false);
                  setIsProofRequest(false);
                  setIsZkpRequest(false);
                  break;
                case 'zkp-proof':
                  setIsCredentialRequest(false);
                  setIsProofRequest(false);
                  setIsZkpRequest(true);
                  // For ZKP, we need to accept the invitation first and wait for proof record
                  await handleZkpInvitation(value);
                  break;
              }
            } else {
              // Fallback to decoded invitation structure if no type parameter
              setIsCredentialRequest(details.isCredentialOffer);
              setIsProofRequest(details.isProofRequest);
              setIsZkpRequest(details.isZkpRequest);
              if (details.isZkpRequest) {
                await handleZkpInvitation(value);
              }
            }

            // Save template data for credential offers (works for BOTH type param and fallback detection)
            const isOffer = details.type?.toLowerCase() === 'offer' || details.isCredentialOffer;
            if (isOffer) {
              try {
                // Extract documentKey from original scanned URL or resolved full URL
                const documentKey = extractQueryParam(value, 'documentKey') || extractQueryParam(details.fullUrl, 'documentKey');
                console.log('📄 [SCAN] documentKey extracted:', documentKey, 'from fullUrl:', details.fullUrl);

                if (documentKey && details.decodedInvitation) {
                  // Extract attributes from the decoded invitation
                  let offerAttributes: Array<{ name: string; value: string }> = [];
                  const requestsAttach = details.decodedInvitation['requests~attach'];
                  if (requestsAttach && Array.isArray(requestsAttach) && requestsAttach.length > 0) {
                    const attachment = requestsAttach[0];
                    let credentialPreview = null;
                    if (attachment?.data?.base64) {
                      try {
                        const base64Module = require('react-native-base64');
                        const decodedData = base64Module.decode(attachment.data.base64);
                        const parsedData = JSON.parse(decodedData);
                        credentialPreview = parsedData.credential_preview;
                      } catch (decodeError) {
                        console.log('Error decoding base64 attachment for template:', decodeError);
                      }
                    }
                    if (!credentialPreview) {
                      credentialPreview =
                        attachment?.data?.json?.credential_preview ||
                        attachment?.data?.credential_preview ||
                        attachment?.credential_preview;
                    }
                    if (credentialPreview?.attributes) {
                      offerAttributes = credentialPreview.attributes.map((attr: any) => ({
                        name: attr.name || '',
                        value: attr.value || '',
                      }));
                    }
                  }

                  // Use the invitation @id as credential identifier for template storage
                  const credId = details.decodedInvitation['@id'] || `offer-${Date.now()}`;
                  await saveTemplateData(credId, documentKey, offerAttributes);
                  console.log('📄 [SCAN] Saved template data - documentKey:', documentKey, 'credId:', credId, 'attributes:', offerAttributes.length);
                } else {
                  console.log('📄 [SCAN] No documentKey found or no decoded invitation, skipping template save');
                }
              } catch (templateError) {
                console.warn('⚠️ [SCAN] Failed to save template data:', templateError);
              }
            }

            setModalVisible(true);
          } catch (error) {
            console.error('Error processing scanned QR:', error);
            // On error, reset last scanned so user can try again immediately if needed? 
            // Or keep debounce to prevent error spam. Keeping debounce is usually better.
          } finally {
            // Release lock after a short delay to ensure state updates have propagated
            setTimeout(() => {
              isProcessing.current = false;
            }, 500);
          }
        }
      }
    },
  });

  // Reset processing lock when modal closes and reinitialize camera
  useEffect(() => {
    if (!modalVisible) {
      // Small cooldown to prevent immediate rescanning when modal closes
      setTimeout(() => {
        isProcessing.current = false;
      }, 500);

      // Reinitialize camera when modal closes to prevent black screen
      if (isFocused && device && hasPermission && isAppStateActive) {
        console.log('🔄 Modal closed, reinitializing camera...');
        setIsCameraReady(false);
        setTimeout(() => {
          setIsCameraReady(true);
          console.log('✅ Camera reinitialized after modal close');
        }, 200);
      }
    }
  }, [modalVisible, isFocused, device, hasPermission, isAppStateActive]);


  // Request camera permission once when page loads
  useEffect(() => {
    const ensurePermission = async () => {
      if (!hasPermission && !hasRequested) {
        setHasRequested(true);
        await requestPermission();
      }
    };
    ensurePermission();
  }, [hasPermission, hasRequested, requestPermission]);

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera permission required</Text>
        <Text style={styles.permissionText}>
          Please grant camera access in system settings and then reopen this screen.
        </Text>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>No back camera available</Text>
        <Text style={styles.permissionText}>Your device does not provide a back camera.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Scan QR Code</Text>
          <Text style={styles.subtitle}>Point your camera at a QR code and capture it</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={handleNavigateToHome}>
          <MaterialIcons name="close" size={32} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.scannerWrapper}>
        <View style={styles.cameraContainer}>
          <Camera
            style={styles.camera}
            device={device}
            isActive={isCameraActive}
            codeScanner={codeScanner}
          />
          <View style={styles.focusFrame} />
          {!isCameraReady && !modalVisible && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>Initializing camera...</Text>
            </View>
          )}
          {modalVisible && <View style={styles.blurOverlay} />}
        </View>
      </View>

      <TouchableOpacity style={styles.galleryButton}>
        <Text style={styles.galleryText}>Upload From Gallery</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.captureButtonOuter}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      </View>

      {/* Show RequestCredentialModal if type=offer or it has requests~attach */}
      {isCredentialRequest ? (
        <RequestCredentialModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setInvitationLabel(null);
            setIsCredentialRequest(false);
          }}
          invitationUrl={scannedUrl}
          onNavigateToCredentials={handleNavigateToHome}
        />
      ) : isProofRequest ? (
        /* Show ProofRequestModal if type=proof or it has proof request */
        <ProofRequestModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setInvitationLabel(null);
            setIsProofRequest(false);
          }}
          verifierName={invitationLabel || 'Verifier'}
          onViewDetails={() => {
            setModalVisible(false);
            setIsProofRequest(false);
            (navigation as any).navigate('ProofRequestDetails', {
              verifierName: invitationLabel || 'Verifier',
              invitationUrl: scannedUrl,
            });
          }}
          onShare={() => {
            setModalVisible(false);
            setIsProofRequest(false);
            (navigation as any).navigate('ProofRequestDetails', {
              verifierName: invitationLabel || 'Verifier',
              invitationUrl: scannedUrl,
            });
          }}
        />
      ) : isZkpRequest && zkpProofRecordId ? (
        /* Show ZkpRequestModal if type=zkp */
        <ZkpRequestModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setInvitationLabel(null);
            setIsZkpRequest(false);
            setZkpProofRecordId(null);
          }}
          proofRecordId={zkpProofRecordId}
          verifierName={invitationLabel || 'Verifier'}
        />
      ) : (
        /* Show RequestModal for simple connection requests (type=connection) */
        <RequestModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setInvitationLabel(null);
            setIsCredentialRequest(false);
          }}
          invitationUrl={scannedUrl}
          invitationLabel={invitationLabel}
          onNavigateToCredentials={handleNavigateToConnections}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
  },
  closeButton: {
    padding: 4,
  },
  scannerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  cameraContainer: {
    width: screenWidth * 0.8,
    height: screenWidth * 1.0,
    backgroundColor: '#000',
    borderRadius: 30,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  focusFrame: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 6,
    borderColor: '#7030D0',
    borderRadius: 30,
  },
  galleryButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  galleryText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  footer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#7030D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D1D5DB', // light gray
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000000',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 24,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 10,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ScanQRScreen;