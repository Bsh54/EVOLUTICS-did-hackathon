import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    ImageBackground,
    Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.95;
const CARD_HEIGHT = CARD_WIDTH * 0.63; // Standard ID card aspect ratio

interface NationalIDCardProps {
    countryName?: string;
    dateOfBirth?: string;
    citizenship?: string;
    placeOfBirth?: string;
    eyeColor?: string;
    gender?: string;
    height?: string;
    dateOfIssue?: string;
    applyNo?: string;
    idNumber?: string;
    idNumberLine2?: string;
    idNumberLine3?: string;
    flagColors?: string[];
    qrValue?: string;
}

const NationalIDCard: React.FC<NationalIDCardProps> = ({
    countryName = 'SOUTH AFRICA',
    dateOfBirth = '1989-08-25',
    citizenship = 'CITIZEN',
    placeOfBirth = 'OMASHAKA',
    eyeColor = 'BROWN',
    gender = 'MALE',
    height = '1.60',
    dateOfIssue = '2022-12-1',
    applyNo = 'R9 09',
    idNumber = 'I D N A 2 9 2 7 9 2 0 <<<<<< 0 3 9 8 4 3 8 4  0 0 2 <<<<<',
    idNumberLine2 = '2 7 2 3 2 7 3 2 3 Y 2 3 3 4 6 7 4 8 2 4 G 2 S 8 U 8 << 7',
    idNumberLine3 = 'S U R 8 9 << 7 4 3 6 4 6 3 7 < T A A T S U <<<<<<<<',
    flagColors = ['#003366', '#D31130', '#007A4D'], // Navy, Red, Green
    qrValue = 'https://polyid.io/verify/IDNA29279200',
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.card}>
                {/* Top Flag Stripes */}
                <View style={styles.flagContainer}>
                    <View style={[styles.flagStripe, { backgroundColor: flagColors[0] }]} />
                    <View style={styles.flagGap} />
                    <View style={[styles.flagStripe, { backgroundColor: flagColors[1] }]} />
                    <View style={styles.flagGap} />
                    <View style={[styles.flagStripe, { backgroundColor: flagColors[2] }]} />
                </View>

                {/* Main Content Area with Image Background */}
                <ImageBackground
                    source={require('../assets/images/tree.png')}
                    style={styles.backgroundImage}
                    imageStyle={styles.imageStyle}
                >
                    <LinearGradient
                        colors={['rgba(224, 245, 235, 0.7)', 'rgba(208, 240, 224, 0.7)']}
                        style={styles.contentArea}
                    >
                        {/* Header Content */}
                        <View style={styles.mainRow}>
                            {/* Left & Middle Data Section */}
                            <View style={styles.dataSection}>
                                <View style={styles.row}>
                                    <View style={styles.leftCol}>
                                        <InfoField label="DATE.OF.BIRTH" value={dateOfBirth} />
                                        <InfoField label="PLACE/COUNTRY OF BIRTH" value={placeOfBirth} />
                                        <View style={styles.subRow}>
                                            <View style={styles.halfWidth}>
                                                <InfoField label="GENDER" value={gender} />
                                            </View>
                                            <View style={styles.halfWidth}>
                                                <InfoField label="HEIGHT/M" value={height} />
                                            </View>
                                        </View>
                                        <InfoField label="DATE OF ISSUE" value={dateOfIssue} />
                                        <InfoField label="APPLY NO" value={applyNo} />
                                    </View>

                                    <View style={styles.rightCol}>
                                        <InfoField label="CITIZENSHIP" value={citizenship} />
                                        <InfoField label="EYE COLOUR" value={eyeColor} />
                                    </View>
                                </View>
                            </View>

                            {/* QR Code Section on the Right */}
                            <View style={styles.qrSection}>
                                <View style={styles.qrContainer}>
                                    <QRCode
                                        value={qrValue}
                                        size={CARD_WIDTH * 0.22}
                                        backgroundColor="transparent"
                                        color="#003366"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Bottom Machine Readable Zone (MRZ) */}
                        <View style={styles.mrzContainer}>
                            <Text style={styles.mrzText}>{idNumber}</Text>
                            <Text style={styles.mrzText}>{idNumberLine2}</Text>
                            <Text style={styles.mrzText}>{idNumberLine3}</Text>
                        </View>
                    </LinearGradient>
                </ImageBackground>
            </View>
        </View>
    );
};

// Info Field Component
const InfoField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        padding: 10,
        alignItems: 'center',
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    flagContainer: {
        flexDirection: 'row',
        height: 14,
    },
    flagStripe: {
        flex: 1,
    },
    flagGap: {
        width: 2,
        backgroundColor: '#fff',
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    imageStyle: {
        resizeMode: 'cover',
        opacity: 0.9,
    },
    contentArea: {
        flex: 1,
        padding: 15,
    },
    mainRow: {
        flex: 1,
        flexDirection: 'row',
    },
    dataSection: {
        flex: 3,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    leftCol: {
        width: '58%',
    },
    rightCol: {
        width: '40%',
    },
    subRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfWidth: {
        width: '48%',
    },
    qrSection: {
        flex: 1,
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        paddingTop: 10,
    },
    qrContainer: {
        padding: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 8,
    },
    fieldContainer: {
        marginBottom: 8,
    },
    fieldLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#003366', // Navy Blue
        fontFamily: 'Poppins-Bold',
        letterSpacing: 0.2,
    },
    fieldValue: {
        fontSize: 16,
        fontWeight: '400',
        color: '#000',
        fontFamily: 'Poppins-Regular',
        marginTop: -2,
    },
    mrzContainer: {
        marginTop: 'auto',
        width: '100%',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Subtle highlight
        paddingVertical: 4,
    },
    mrzText: {
        fontSize: 12,
        color: '#000',
        fontFamily: 'Courier',
        letterSpacing: 1.5,
        lineHeight: 15,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
});

export default NationalIDCard;
