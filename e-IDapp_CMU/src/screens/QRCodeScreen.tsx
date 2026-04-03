import React from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar, TouchableOpacity, PixelRatio } from 'react-native';
// import QRCode from 'react-native-qrcode-svg';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import CustomQRCode from '../components/CustomQRCode';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const guideWidth = 375;
const guideHeight = 667;
const layoutScale = Math.min(Math.min(screenWidth / guideWidth, screenHeight / guideHeight), 1.2);
const fontScale = Math.min(PixelRatio.getFontScale() * (screenWidth / guideWidth), 1.5);
const iconScale = Math.min(PixelRatio.get() * (screenWidth / guideWidth), 1.2);

const QRCodeScreen = () => {
    const navigation = useNavigation<any>();

    // Handle navigation - works with both Stack and Drawer
    const handleBackPress = () => {
        if (navigation.openDrawer) {
            navigation.openDrawer();
        } else {
            navigation.goBack();
        }
    };

    // Get qrCodeData from Redux store (this contains COMPLETE data with faceImage)
    const qrCodeData = useSelector((state: RootState) => state.user.qrCodeData);

    // Use COMPLETE data for QR code (with faceImage)
    // CustomQRCode component will handle compression automatically
    const displayData = qrCodeData;

    if (qrCodeData) {
        try {
            const completeData = JSON.parse(qrCodeData);
            console.log("✅ Complete data in QR code:", {
                name: completeData.name,
                id: completeData.id,
                hasFaceImage: completeData.faceImage
            });
            console.log(`📊 Total QR data size: ${qrCodeData.length} bytes`);
        } catch (error) {
            console.error("Error parsing QR data:", error);
        }
    } else {
        console.log("⚠️ No QR data available");
    }

    return (
        <LinearGradient
            colors={['#6528c2ff', '#8650D8', '#CFB0FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            locations={[0, 0.5, 1]}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Header with Gradient Background Wrapper (similar to ConnectionsFullList) */}
            <LinearGradient
                colors={['#5B18B8', '#8650D8', '#CFB0FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                locations={[0, 0.5, 1]}
                style={[styles.headerGradient, {
                    paddingTop: 10 * layoutScale,
                    paddingBottom: 24 * layoutScale,
                    paddingHorizontal: 16 * layoutScale,
                }]}
            >
                <View style={[styles.header, { marginBottom: 20 * layoutScale }]}>
                    <TouchableOpacity
                        style={[styles.headerButton, {
                            width: 40 * layoutScale,
                            height: 40 * layoutScale,
                            borderRadius: 20 * layoutScale,
                        }]}
                        onPress={handleBackPress}
                    >
                        <MaterialIcons name="arrow-back" size={20 * iconScale} color="#FFFFFF" />
                    </TouchableOpacity>

                    <Text style={[styles.headerTitle, {
                        fontSize: 18 * fontScale,
                        lineHeight: 24 * fontScale,
                    }]}>
                        My Identity
                    </Text>

                    <TouchableOpacity
                        style={[styles.headerButton, {
                            width: 40 * layoutScale,
                            height: 40 * layoutScale,
                            borderRadius: 20 * layoutScale,
                            opacity: 0 // Hidden but keeps layout balanced
                        }]}
                        disabled={true}
                    >
                        <MaterialIcons name="more-vert" size={20 * iconScale} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <View style={styles.listWrapper}>
                <View style={styles.contentContainer}>
                    <View style={styles.card}>
                        <Text style={[styles.cardTitle, { fontSize: 18 * fontScale }]}>Identity QR Code</Text>
                        <View style={styles.qrWrapper}>
                            {displayData ? (
                                <CustomQRCode
                                    value={displayData}
                                    size={screenWidth * 0.65}
                                    color="#000000"
                                    backgroundColor="#FFFFFF"
                                />
                            ) : (
                                <View style={[styles.placeholder, { width: screenWidth * 0.65, height: screenWidth * 0.65 }]}>
                                    <Text style={[styles.placeholderText, { fontSize: 16 * fontScale }]}>No QR Data Available</Text>
                                    <Text style={[styles.subText, { fontSize: 12 * fontScale }]}>Complete Face Enrollment first.</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.infoText, { fontSize: 14 * fontScale }]}>
                            Scan to verify identity
                        </Text>
                    </View>
                </View>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerGradient: {
        // Matches ConnectionsFullList headerGradient style
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontFamily: 'Poppins',
        textAlign: 'center',
    },
    listWrapper: {
        flex: 1,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        backgroundColor: '#F5F3FF', // Matching ConnectionsFullList listWrapper
        paddingTop: 30,
        alignItems: 'center',
    },
    contentContainer: {
        width: '100%',
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    card: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    cardTitle: {
        color: '#333',
        marginBottom: 30,
        fontFamily: 'Poppins',
        fontWeight: '600',
    },
    qrWrapper: {
        padding: 10,
        backgroundColor: '#FFF',
        borderRadius: 10,
    },
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        borderRadius: 20,
    },
    placeholderText: {
        color: '#333',
        fontWeight: 'bold',
    },
    subText: {
        color: '#666',
        marginTop: 5,
    },
    infoText: {
        color: '#666',
        marginTop: 30,
        fontFamily: 'Poppins',
    },
});

export default QRCodeScreen;
