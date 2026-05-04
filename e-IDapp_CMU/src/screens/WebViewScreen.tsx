import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, SafeAreaView, StatusBar, Platform, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

type WebViewScreenRouteProp = RouteProp<RootStackParamList, 'WebView'>;

const WebViewScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<WebViewScreenRouteProp>();
    const { url, title, templateData } = route.params;

    // Build injected script to replace {{placeholder}} with templateData values (dynamic)
    const injectedScript = templateData
        ? `(function() {
            var data = ${JSON.stringify(templateData)};
            var html = document.documentElement.innerHTML;
            var keys = Object.keys(data);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var regex = new RegExp('\\\\{\\\\{' + key + '\\\\}\\\\}', 'gi');
                html = html.replace(regex, data[key] || '');
            }
            document.documentElement.innerHTML = html;
        })();
        true;`
        : undefined;

    // Handle WebView errors
    const handleError = (syntheticEvent: any) => {
        const { nativeEvent } = syntheticEvent;
        console.warn('WebView error: ', nativeEvent);
        Alert.alert('Error', 'Failed to load the web page');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {title || 'HTML Template'}
                </Text>
                <View style={{ width: 40 }} />
            </View>
            <WebView
                source={{ uri: url }}
                style={styles.webview}
                startInLoadingState={true}
                scalesPageToFit={true}
                onError={handleError}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                mixedContentMode="compatibility"
                injectedJavaScript={injectedScript}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        height: Platform.OS === 'ios' ? 44 : 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#5B18B8',
        paddingHorizontal: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 10,
    },
    webview: {
        flex: 1,
    },
    debugInfo: {
        backgroundColor: '#f0f0f0',
        padding: 8,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    debugText: {
        color: '#666',
        fontSize: 12,
        fontFamily: 'Poppins',
        textAlign: 'center',
    },
});

export default WebViewScreen;
