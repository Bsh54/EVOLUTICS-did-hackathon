import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { agentService } from '../../agent/AgentService';

interface ZkpRequestModalProps {
    visible: boolean;
    onClose: () => void;
    proofRecordId: string;
    verifierName?: string;
}

const ZkpRequestModal: React.FC<ZkpRequestModalProps> = ({
    visible,
    onClose,
    proofRecordId,
    verifierName = 'Verifier',
}) => {
    const navigation = useNavigation<any>();

    const handleViewDetails = () => {
        onClose();
        navigation.navigate('ProofRequestDetails', {
            proofRecordId,
            verifierName,
        });
    };

    const handleDecline = async () => {
        const currentAgent = agentService.isAgentInitialized() ? agentService.getAgent() : null;
        if (!currentAgent) {
            console.error('Agent not available');
            return;
        }

        try {
            await currentAgent.proofs.declineRequest({ proofRecordId });
            console.log('✅ Proof request declined');
            onClose();
        } catch (error: any) {
            console.error('❌ Error declining proof request:', error);
        }
    };

    return (
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
                            <MaterialIcons name="verified-user" size={40} color="#5b18b8" />
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.popupCloseButton}>
                            <MaterialIcons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.title}>New Verification Request</Text>
                        <Text style={styles.subtitle}>
                            <Text style={styles.verifierName}>{verifierName}</Text> is requesting to verify some of your credentials.
                        </Text>
                        <Text style={styles.description}>
                            Tap "View Details" to see what information is being requested and select which credentials to share.
                        </Text>
                    </View>

                    <View style={styles.popupButtonsContainer}>
                        <TouchableOpacity
                            style={styles.declineButton}
                            onPress={handleDecline}
                        >
                            <Text style={styles.declineText}>Decline</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.acceptButton}
                            onPress={handleViewDetails}
                        >
                            <Text style={styles.acceptText}>View Details</Text>
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
        maxWidth: 375,
        maxHeight: '80%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    popupHeader: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        position: 'relative',
    },
    popupTitle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#F3E8FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    popupCloseButton: {
        position: 'absolute',
        right: 0,
        top: 0,
        padding: 4,
    },
    content: {
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 12,
    },
    verifierName: {
        fontWeight: '600',
        color: '#1F2937',
    },
    description: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    popupButtonsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    declineButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    declineText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    acceptButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        backgroundColor: '#7E22CE',
        alignItems: 'center',
    },
    acceptText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});

export default ZkpRequestModal;

