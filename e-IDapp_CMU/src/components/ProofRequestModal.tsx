import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Dimensions,
    Image,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { width: screenWidth } = Dimensions.get('window');

interface ProofRequestModalProps {
    visible: boolean;
    onClose: () => void;
    onViewDetails: () => void;
    onShare: () => void;
    verifierName?: string;
}

const ProofRequestModal: React.FC<ProofRequestModalProps> = ({
    visible,
    onClose,
    onViewDetails,
    onShare,
    verifierName = 'Verifier'
}) => {
    console.log('ProofRequestModal', verifierName);
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
                            {/* Icon for Proof Request */}
                            <MaterialIcons name="verified-user" size={40} color="#5b18b8" />
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.popupCloseButton}>
                            <MaterialIcons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.title}>Proof Request</Text>
                        <Text style={styles.subtitle}>
                            <Text style={styles.verifierName}>{verifierName == "undefined" ? "Verifier" : verifierName}</Text> is requesting to verify some of your credentials.
                        </Text>
                    </View>

                    <View style={styles.popupButtonsContainer}>
                        <TouchableOpacity style={styles.viewDetailsButton} onPress={onViewDetails}>
                            <Text style={styles.viewDetailsText}>View Details</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.shareButton} onPress={onShare}>
                            <Text style={styles.shareText}>Share</Text>
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
        padding: 5,
    },
    content: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    verifierName: {
        fontWeight: 'bold',
        color: '#000',
    },
    popupButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    viewDetailsButton: {
        flex: 1,
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
    shareButton: {
        flex: 1,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#5b18b8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
});

export default ProofRequestModal;
