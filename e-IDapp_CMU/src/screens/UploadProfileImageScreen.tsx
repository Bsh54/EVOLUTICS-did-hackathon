import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ImagePicker from 'react-native-image-crop-picker';
import { useDispatch } from 'react-redux';
import { setProfileImage } from '../store/slices/userSlice';
import { STATUS_BAR_HEIGHT } from '../constants/layout';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface UploadProfileImageScreenProps {
    navigation: any;
}

const UploadProfileImageScreen: React.FC<UploadProfileImageScreenProps> = ({ navigation }) => {
    const dispatch = useDispatch();
    const [imagePath, setImagePath] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Cleanup temporary files on unmount
    useEffect(() => {
        return () => {
            // Clean up any temporary files created by the image picker
            ImagePicker.clean().catch(err => {
                console.log('Cleanup error:', err);
            });
        };
    }, []);

    const handleGallery = async () => {
        try {
            const image = await ImagePicker.openPicker({
                width: 400,
                height: 400,
                cropping: true,
                mediaType: 'photo',
                cropperCircleOverlay: true,
                compressImageQuality: 0.8,
                compressImageMaxWidth: 400,
                compressImageMaxHeight: 400,
                forceJpg: true, // Ensures consistent format
            });

            if (image.path) {
                setImagePath(image.path);
            }
        } catch (error: any) {
            console.log('Gallery Error: ', error);
            if (error.code !== 'E_PICKER_CANCELLED') {
                if (error.code === 'E_NO_LIBRARY_PERMISSION') {
                    Alert.alert('Permission Required', 'Please grant gallery access permission to select photos.');
                } else {
                    Alert.alert('Error', 'Could not pick image from gallery.');
                }
            }
        }
    };

    const handleCamera = async () => {
        try {
            const image = await ImagePicker.openCamera({
                width: 400,
                height: 400,
                cropping: true,
                mediaType: 'photo',
                cropperCircleOverlay: true,
                useFrontCamera: true,
                compressImageQuality: 0.8,
                compressImageMaxWidth: 400,
                compressImageMaxHeight: 400,
                forceJpg: true, // Ensures consistent format
                writeTempFile: true, // Explicitly write to temp file
            });

            if (image.path) {
                setImagePath(image.path);
            }
        } catch (error: any) {
            console.log('Camera Error: ', error);
            if (error.code !== 'E_PICKER_CANCELLED') {
                if (error.code === 'E_NO_CAMERA_PERMISSION') {
                    Alert.alert('Permission Required', 'Please grant camera access permission to take photos.');
                } else {
                    Alert.alert('Error', 'Could not take photo. Please try again.');
                }
            }
        }
    };

    const handleNext = async () => {
        if (!imagePath) {
            Alert.alert('Required', 'Please upload a profile image to continue.');
            return;
        }

        setIsLoading(true);
        try {
            // Save profile image to Redux state
            dispatch(setProfileImage(imagePath));

            // Navigate to SetupWait which will finalize user creation
            navigation.navigate('SetupWait');
        } catch (error) {
            console.error('Error saving profile image:', error);
            Alert.alert('Error', 'Failed to save profile image.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["#5B18B8CC", "#FFFFFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 0.6 }}
                style={[styles.gradient, { height: '58%' }]}
            />

            <View style={styles.content}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.mainContent}>
                    <Text style={styles.title}>Upload Profile Photo</Text>
                    <Text style={styles.subtitle}>
                        Choose a photo to personalize your wallet identity.
                    </Text>

                    <View style={styles.imageContainer}>
                        {imagePath ? (
                            <Image source={{ uri: imagePath }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.placeholderImage}>
                                <MaterialIcons name="person" size={80} color="#CBD5E0" />
                            </View>
                        )}
                        <TouchableOpacity style={styles.editIcon} onPress={() => setImagePath(null)}>
                            <MaterialIcons name="delete" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.optionsContainer}>
                        <TouchableOpacity style={styles.optionButton} onPress={handleGallery}>
                            <View style={styles.optionIconContainer}>
                                <MaterialIcons name="photo-library" size={28} color="#5B18B8" />
                            </View>
                            <Text style={styles.optionText}>Gallery</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.optionButton} onPress={handleCamera}>
                            <View style={styles.optionIconContainer}>
                                <MaterialIcons name="camera-alt" size={28} color="#5B18B8" />
                            </View>
                            <Text style={styles.optionText}>Camera</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.nextButton, !imagePath && styles.disabledButton]}
                        onPress={handleNext}
                        disabled={!imagePath || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <View style={styles.buttonContent}>
                                <Text style={styles.nextButtonText}>Next</Text>
                                <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    gradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    content: {
        flex: 1,
        paddingTop: STATUS_BAR_HEIGHT + 10,
        paddingHorizontal: 24,
    },
    header: {
        marginBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainContent: {
        flex: 1,
        alignItems: 'center',
        marginTop: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF', // On gradient
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#E2E8F0', // Light gray on gradient
        textAlign: 'center',
        marginBottom: 40,
    },
    imageContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        position: 'relative',
    },
    profileImage: {
        width: 160,
        height: 160,
        borderRadius: 80,
    },
    placeholderImage: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#F7FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EDF2F7',
    },
    editIcon: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#5B18B8',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    optionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        paddingHorizontal: 20,
    },
    optionButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 16,
        width: '45%',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    optionIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F3E8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3748',
    },
    footer: {
        paddingBottom: 40,
        alignItems: 'flex-end',
    },
    nextButton: {
        backgroundColor: '#5B18B8',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#5B18B8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    disabledButton: {
        backgroundColor: '#A0AEC0',
        elevation: 0,
        shadowOpacity: 0,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 8,
    },
});

export default UploadProfileImageScreen;
