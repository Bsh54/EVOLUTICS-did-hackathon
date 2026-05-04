import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = CARD_WIDTH * 1.6; // ID card aspect ratio

interface StudentIDCardProps {
    universityName?: string;
    universityLogo?: any; // Image source
    studentPhoto?: any; // Image source
    rollNo?: string;
    studentName?: string;
    parentName?: string;
    phone?: string;
    address?: string;
}

const StudentIDCard: React.FC<StudentIDCardProps> = ({
    universityName = 'UNIVERSITY NAME',
    universityLogo,
    studentPhoto,
    rollNo = '',
    studentName = '',
    parentName = '',
    phone = '',
    address = '',
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.card}>
                {/* Top Blue Section with Curved Design */}
                <View style={styles.topSection}>
                    <LinearGradient
                        colors={['#1e3a8a', '#2563eb']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.blueGradient}
                    >
                        {/* University Logo and Name */}
                        <View style={styles.headerRow}>
                            <View style={styles.logoContainer}>
                                {universityLogo ? (
                                    <Image source={universityLogo} style={styles.logo} resizeMode="contain" />
                                ) : (
                                    <Text style={styles.logoPlaceholder}>LOGO</Text>
                                )}
                            </View>
                            <Text style={styles.universityName}>{universityName}</Text>
                        </View>

                        {/* Decorative Curve - Top Right */}
                        <View style={styles.curveTopRight} />
                    </LinearGradient>

                    {/* Gold Accent Line */}
                    <View style={styles.goldAccent} />
                </View>

                {/* White Section with Student Photo */}
                <View style={styles.middleSection}>
                    <View style={styles.photoContainer}>
                        {studentPhoto ? (
                            <Image source={studentPhoto} style={styles.photo} resizeMode="cover" />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <View style={styles.avatarSilhouette}>
                                    <View style={styles.avatarHead} />
                                    <View style={styles.avatarBody} />
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Student Information Section */}
                <View style={styles.infoSection}>
                    <InfoRow label="Roll No" value={rollNo} />
                    <InfoRow label="Student" value={studentName} />
                    <InfoRow label="Parent" value={parentName} />
                    <InfoRow label="Phone" value={phone} />
                    <InfoRow label="Address" value={address} />
                </View>

                {/* Bottom Decorative Curve */}
                <View style={styles.bottomCurveContainer}>
                    <View style={styles.curveBottomRight} />
                    <LinearGradient
                        colors={['#d97706', '#1e3a8a']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.bottomGradient}
                    />
                </View>
            </View>
        </View>
    );
};

// Info Row Component
const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.colon}>:</Text>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    topSection: {
        position: 'relative',
    },
    blueGradient: {
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 40,
        position: 'relative',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    logoContainer: {
        width: 70,
        height: 70,
        backgroundColor: '#fff',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    logo: {
        width: 60,
        height: 60,
    },
    logoPlaceholder: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e3a8a',
        fontFamily: 'Poppins-Bold',
    },
    universityName: {
        flex: 1,
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        fontFamily: 'Poppins-Bold',
        letterSpacing: 1,
    },
    curveTopRight: {
        position: 'absolute',
        right: -50,
        top: 0,
        width: 200,
        height: 200,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 100,
    },
    goldAccent: {
        height: 8,
        backgroundColor: '#d97706',
        width: '40%',
    },
    middleSection: {
        alignItems: 'center',
        marginTop: -60,
        marginBottom: 20,
        zIndex: 10,
    },
    photoContainer: {
        width: 160,
        height: 160,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#f3f4f6',
        borderWidth: 4,
        borderColor: '#fff',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    photoPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#e5e7eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarSilhouette: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarHead: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#9ca3af',
        marginBottom: 5,
    },
    avatarBody: {
        width: 80,
        height: 60,
        backgroundColor: '#9ca3af',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
    },
    infoSection: {
        paddingHorizontal: 30,
        paddingTop: 10,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        fontFamily: 'Poppins-SemiBold',
        width: 90,
    },
    colon: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginHorizontal: 8,
    },
    infoValue: {
        flex: 1,
        fontSize: 15,
        color: '#374151',
        fontFamily: 'Poppins-Regular',
    },
    bottomCurveContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        left: 0,
        height: 150,
    },
    curveBottomRight: {
        position: 'absolute',
        right: -100,
        bottom: -100,
        width: 300,
        height: 300,
        backgroundColor: '#d97706',
        borderRadius: 150,
        opacity: 0.8,
    },
    bottomGradient: {
        position: 'absolute',
        right: -50,
        bottom: -50,
        width: 250,
        height: 250,
        borderRadius: 125,
        opacity: 0.6,
    },
});

export default StudentIDCard;
