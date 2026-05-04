import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    StatusBar,
    Animated,
    Platform,
    Alert,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useCameraFormat } from 'react-native-vision-camera';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';
import { BiometrikAPI } from '../face_biometrix/BiometrikAPI';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { initializeAgent } from '../store/slices/credoSlice';
import { saveUserDataToStorage, setQrCodeData, setProfileImage } from '../store/slices/userSlice';
import { getSecureItem } from '../utils/secureStorage';
import { STORAGE_KEYS } from '../utils/localStorage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { RouteProp } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.7;

type FaceScanScreenNavigationProp = StackNavigationProp<RootStackParamList, 'FaceScan'>;
type FaceScanScreenRouteProp = RouteProp<RootStackParamList, 'FaceScan'>;

interface Props {
    navigation: FaceScanScreenNavigationProp;
    route: FaceScanScreenRouteProp;
}

const FaceScanScreen: React.FC<Props> = ({ navigation, route }) => {
    const { mode } = route.params;
    const { hasPermission, requestPermission } = useCameraPermission();
    const device = useCameraDevice('front');

    // Use low resolution for smaller base64 - 240x320 should give us ~15-20KB
    const format = useCameraFormat(device, [
        { photoResolution: { width: 240, height: 320 } },
        { videoResolution: { width: 240, height: 320 } }
    ]);

    const camera = useRef<Camera>(null);
    const insets = useSafeAreaInsets();
    const [isProcessing, setIsProcessing] = useState(false);
    const [captureStatus, setCaptureStatus] = useState<string>('Searching for face...');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    // Auto-capture timer ref
    const scanTimer = useRef<NodeJS.Timeout | null>(null);

    const userData = useSelector((state: RootState) => state.user);
    const dispatch = useDispatch<any>();

    useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission, requestPermission]);

    // Auto-Start Scanning Effect
    useEffect(() => {
        if (hasPermission && device && !isProcessing && !capturedImage) {
            startAutoScan();
        }
        return () => {
            if (scanTimer.current) clearTimeout(scanTimer.current);
        };
    }, [hasPermission, device, isProcessing, capturedImage]);

    const startAutoScan = () => {
        setCaptureStatus('Keep your face in the circle');
        if (scanTimer.current) clearTimeout(scanTimer.current);

        scanTimer.current = setTimeout(() => {
            captureAndProcess();
        }, 2500);
    };

    const captureAndProcess = async () => {
        if (!camera.current || isProcessing) return;

        try {
            setIsProcessing(true);
            setCaptureStatus('Scanning...');

            // Capture photo
            const photo = await camera.current.takePhoto({
                flash: 'off',
            });

            console.log("📸 Photo captured at:", photo.path);

            // Read image as base64
            const base64Data = await RNFS.readFile(photo.path, 'base64');
            const base64Image = `data:image/jpeg;base64,${base64Data}`;

            const sizeKB = Math.round((base64Data.length * 3) / 4 / 1024);
            console.log("📊 Image size:", sizeKB, "KB");

            // ENROLL MODE - COMMENTED OUT
            // if (mode === 'enroll') {
            //     // Verify face with BiometrikAPI
            //     console.log("🔐 Adding subject to BiometrikAPI...");
            //     await BiometrikAPI.addSubjectImage(userData.name || 'PolyID_User', base64Image);
            //     console.log("✅ Face enrolled successfully");

            //     // Generate unique user ID if not exists
            //     const userId = userData.id || `PID-${Date.now()}`;

            //     // Create COMPLETE QR content object (with faceImage)
            //     // This will be stored in Redux and returned when scanned
            //     const qrContent = JSON.stringify({
            //         name: userData.name || 'PolyID_User',
            //         id: userId,
            //         faceImage: photo.path
            //     });

            //     console.log(`📊 Complete QR Content: ${qrContent}`);

            //     // Save face image path to profileImage for database persistence
            //     dispatch(setProfileImage(photo.path));

            //     // Save COMPLETE QR content to Redux store (with faceImage)
            //     dispatch(setQrCodeData(qrContent));

            //     // Ensure user exists in DB first
            //     await dispatch(saveUserDataToStorage()).unwrap();

            //     setCaptureStatus('Success!');
            //     setTimeout(() => {
            //         navigation.replace('UploadProfileImage');
            //     }, 1000);

            // } else 


            if (mode === 'verify') {
                // Get the stored photo from API (base64)
                const storedPhoto = userData.photo;

                if (!storedPhoto) {
                    setCaptureStatus('No reference photo found');
                    setIsProcessing(false);
                    setTimeout(() => startAutoScan(), 2000);
                    return;
                }

                console.log("🔍 Verifying face using getFaceMatchScore...");

                // Prepare stored photo in correct format (image1)
                const image1 = storedPhoto.startsWith('data:image')
                    ? storedPhoto
                    : `data:image/jpeg;base64,${storedPhoto}`;

                // Captured photo is image2
                const image2 = base64Image;

                console.log("📸 Image1 (stored) length:", image1.length);
                console.log("📸 Image2 (captured) length:", image2.length);

                // Use getFaceMatchScore API for direct comparison
                try {
                    const result = await BiometrikAPI.getFaceMatchScore(image1, image2);
                    console.log("🔍 Face Match Score result:", result);

                    // Check if verification was successful
                    // The API might return different formats, check for similarity or score
                    const similarity = result?.similarity || result?.score || result?.match_score || 0;
                    const similarityPercent = typeof similarity === 'string'
                        ? parseFloat(similarity)
                        : similarity;

                    console.log("� Similarity percentage:", similarityPercent);

                    if (similarityPercent >= 80) {
                        console.log("✅ Face verified successfully! Similarity:", similarityPercent);
                        setCaptureStatus('Verified!');

                        // Generate QR code data with user information
                        const userId = userData.uniqueIdentifier || userData.id || `PID-${Date.now()}`;
                        const qrContent = JSON.stringify({
                            name: userData.name || `${userData.firstName} ${userData.lastName}`,
                            firstName: userData.firstName,
                            lastName: userData.lastName,
                            id: userId,
                            uniqueIdentifier: userData.uniqueIdentifier,
                            faceImage: photo.path // Store captured face path
                        });

                        console.log(`📊 QR Content generated for verified user`);

                        // Save captured face image path to profileImage
                        dispatch(setProfileImage(photo.path));

                        // Save QR content to Redux store
                        dispatch(setQrCodeData(qrContent));

                        // Save user data to storage
                        await dispatch(saveUserDataToStorage()).unwrap();

                        // Navigate to CreatePin after successful verification
                        setTimeout(() => {
                            navigation.replace('CreatePin');
                        }, 1000);
                        return;
                    } else {
                        console.log(`❌ Face verification failed. Similarity: ${similarityPercent}`);

                        // Show clear error message
                        let errorMessage = '';
                        if (similarityPercent === 0) {
                            errorMessage = '❌ Face not matched. No similarity detected.';
                            setCaptureStatus(errorMessage);
                        } else {
                            errorMessage = `❌ Face not matched (${similarityPercent.toFixed(1)}% similar). Need 80%+`;
                            setCaptureStatus(errorMessage);
                        }

                        // Show Alert dialog
                        Alert.alert(
                            'Error',
                            `Face Not Matched. No Similarity detected`,
                            [
                                {
                                    text: 'Go Back',
                                    style: 'cancel',
                                    onPress: () => navigation.goBack()
                                },
                                {
                                    text: 'Retry',
                                    onPress: () => {
                                        setIsProcessing(false);
                                        setTimeout(() => startAutoScan(), 1000);
                                    }
                                }
                            ]
                        );
                        return; // Don't auto-retry, wait for user action
                    }
                } catch (biometricError) {
                    console.error('❌ Face match score error:', biometricError);
                    setCaptureStatus('Verification error. Retrying...');
                }

                // Verification failed - retry
                setIsProcessing(false);
                setTimeout(() => startAutoScan(), 2000);
            }
        } catch (error) {
            console.error('❌ Face Scan Error:', error);
            setCaptureStatus('Error. Retrying...');
            setIsProcessing(false);
            setTimeout(() => startAutoScan(), 2000);
        }
    };

    if (!hasPermission || !device) {
        return <View style={styles.container} />;
    }

    return (
        <LinearGradient
            colors={['#ae5ff9ff', '#a87fefff']}
            style={styles.container}
        >
            {/* Header */}
            <View style={[styles.header, { marginTop: 20 }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {mode === 'enroll' ? 'Face Enrollment' : 'Verification'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Camera Circle */}
            <View style={styles.contentContainer}>
                <View style={styles.cameraFrame}>
                    <Camera
                        ref={camera}
                        style={StyleSheet.absoluteFill}
                        device={device}
                        format={format}
                        isActive={true}
                        photo={true}
                    />
                </View>
            </View>

            {/* Footer / Status */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                {isProcessing ? (
                    <ActivityIndicator size="large" color="#FFF" style={{ marginBottom: 10 }} />
                ) : null}
                <Text style={styles.statusText}>{captureStatus}</Text>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
        fontFamily: 'Poppins',
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraFrame: {
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        borderRadius: CIRCLE_SIZE / 2,
        overflow: 'hidden',
        borderWidth: 4,
        borderColor: '#FFF',
        backgroundColor: '#000',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    statusText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#FFF',
        marginBottom: 20,
        textAlign: 'center',
        fontFamily: 'Poppins',
    },
    skipText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        marginTop: 10,
        fontFamily: 'Poppins',
        textDecorationLine: 'underline',
    },
});

export default FaceScanScreen;
