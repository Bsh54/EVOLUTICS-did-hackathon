import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { NationalIDCard } from '../templates';

const NationalIDScreen = () => {
    const navigation = useNavigation();

    // Sample national ID data - in real app, this would come from credentials
    const nationalIDData = {
        countryName: 'SOUTH AFRICA',
        dateOfBirth: '1989-08-25',
        citizenship: 'CITIZEN',
        placeOfBirth: 'OMASHAKA',
        eyeColor: 'BROWN',
        gender: 'MALE',
        height: '1.60',
        dateOfIssue: '2022-12-1',
        applyNo: 'R9 09',
        idNumber: 'I D N A 2 9 2 7 9 2 0 <<<<<< 0 3 9 8 4 3 8 4  0 0 2 <<<<<',
        flagColors: ['#003366', '#D31130', '#007A4D'], // Navy, Red, Green
        qrValue: 'https://polyid.io/verify/IDNA29279200',
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>National ID Card</Text>
                <TouchableOpacity style={styles.menuButton}>
                    <MaterialIcons name="more-vert" size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <NationalIDCard
                    countryName={nationalIDData.countryName}
                    dateOfBirth={nationalIDData.dateOfBirth}
                    citizenship={nationalIDData.citizenship}
                    placeOfBirth={nationalIDData.placeOfBirth}
                    eyeColor={nationalIDData.eyeColor}
                    gender={nationalIDData.gender}
                    height={nationalIDData.height}
                    dateOfIssue={nationalIDData.dateOfIssue}
                    applyNo={nationalIDData.applyNo}
                    idNumber={nationalIDData.idNumber}
                    flagColors={nationalIDData.flagColors}
                    qrValue={nationalIDData.qrValue}
                />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        fontFamily: 'Poppins-SemiBold',
    },
    menuButton: {
        padding: 8,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 20,
        paddingBottom: 40,
    },
});

export default NationalIDScreen;
