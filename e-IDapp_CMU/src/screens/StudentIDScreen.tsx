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
import { StudentIDCard } from '../templates';

const StudentIDScreen = () => {
    const navigation = useNavigation();

    // Sample student data - in real app, this would come from credentials
    const studentData = {
        universityName: 'METROPOLITAN UNIVERSITY',
        rollNo: '4334',
        studentName: 'James Smith',
        parentName: 'John Smith',
        phone: '+1 234 567 890',
        address: '123 Main Street, New York, USA',
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
                <Text style={styles.headerTitle}>Student ID Card</Text>
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
                <StudentIDCard
                    universityName={studentData.universityName}
                    rollNo={studentData.rollNo}
                    studentName={studentData.studentName}
                    parentName={studentData.parentName}
                    phone={studentData.phone}
                    address={studentData.address}
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
        paddingBottom: 40,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 40,
        marginTop: 20,
    },
    actionButton: {
        backgroundColor: '#7C3AED',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Poppins-SemiBold',
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 20,
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    infoHeaderText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        fontFamily: 'Poppins-SemiBold',
    },
    infoText: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        fontFamily: 'Poppins-Regular',
    },
});

export default StudentIDScreen;
