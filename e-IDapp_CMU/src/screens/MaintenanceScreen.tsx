import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    BackHandler,
    StatusBar,
    Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

interface MaintenanceScreenProps {
    onRetry: () => void;
}

const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ onRetry }) => {
    const handleExitApp = () => {
        BackHandler.exitApp();
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Background Shapes for Premium Look */}
            <View style={styles.backgroundShape1} />
            <View style={styles.backgroundShape2} />

            <View style={styles.contentContainer}>
                <LinearGradient
                    colors={['#FF5F6D', '#FFC371']}
                    style={styles.iconCircle}
                >
                    <MaterialIcons name="error-outline" size={60} color="#FFFFFF" />
                </LinearGradient>

                <Text style={styles.title}>System Inactive</Text>
                <Text style={styles.subtitle}>Version v1.01.0</Text>

                <View style={styles.messageBox}>
                    <Text style={styles.messageText}>
                        This application has been temporarily deactivated by the administrator for maintenance or security updates.
                    </Text>
                    <Text style={styles.subMessageText}>
                        Please contact support if you believe this is an error or try again later.
                    </Text>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleExitApp}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#1F2937', '#111827']}
                            style={styles.gradientButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <MaterialIcons name="exit-to-app" size={22} color="#FFFFFF" />
                            <Text style={styles.buttonText}>Exit Application</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={onRetry}
                        activeOpacity={0.6}
                    >
                        <MaterialIcons name="refresh" size={20} color="#4B5563" />
                        <Text style={styles.secondaryButtonText}>Check Again</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Text style={styles.footerVersion}>PolyID Holder • Powered by BBN</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backgroundShape1: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(255, 95, 109, 0.05)',
    },
    backgroundShape2: {
        position: 'absolute',
        bottom: -50,
        left: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255, 195, 113, 0.05)',
    },
    contentContainer: {
        width: '85%',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 30,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -80, // Offset for pop-out effect
        shadowColor: '#FF5F6D',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#111827',
        marginTop: 24,
        fontFamily: 'Poppins',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        fontWeight: '600',
        marginTop: 4,
        fontFamily: 'Poppins',
    },
    messageBox: {
        marginTop: 24,
        padding: 15,
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        width: '100%',
    },
    messageText: {
        fontSize: 15,
        color: '#4B5563',
        textAlign: 'center',
        lineHeight: 22,
        fontFamily: 'Poppins',
    },
    subMessageText: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 10,
        fontFamily: 'Poppins',
        fontStyle: 'italic',
    },
    buttonContainer: {
        width: '100%',
        marginTop: 30,
    },
    primaryButton: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 12,
    },
    gradientButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 10,
        fontFamily: 'Poppins',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    secondaryButtonText: {
        color: '#4B5563',
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 8,
        fontFamily: 'Poppins',
    },
    footerVersion: {
        position: 'absolute',
        bottom: 30,
        fontSize: 12,
        color: '#9CA3AF',
        fontFamily: 'Poppins',
    },
});

export default MaintenanceScreen;
