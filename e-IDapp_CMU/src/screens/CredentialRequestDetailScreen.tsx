import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
// import { useNavigation } from '@react-navigation/native';
import { credoAgentService } from '../services/agent';

const { width } = Dimensions.get('window');

const CredentialRequestDetailScreen = ({
  route,
  navigation,
}: {
  route: any;
  navigation: any;
}) => {
  // const nav = useNavigation();
  const { credentialOffer } = route.params;
  const [accepting, setAccepting] = useState(false);

  console.log('Credential offer:', credentialOffer);

  const handleAccept = async () => {
    if (!credentialOffer?.invitationUrl) {
      Alert.alert('Error', 'No invitation URL found');
      return;
    }

    try {
      setAccepting(true);
      console.log('Accepting invitation from URL:', credentialOffer.invitationUrl);

      // Accept the invitation - this will create the connection and credential offer
      // The event listener will automatically accept the credential offer
      const agent = credoAgentService.getAgent();
      if (!agent) {
        throw new Error('Agent not initialized');
      }

      // Receive the invitation
      await agent.oob.receiveInvitationFromUrl(credentialOffer.invitationUrl, {
        autoAcceptConnection: true,
        autoAcceptInvitation: true,
      });

      // Wait for the credential to be processed by event listeners
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Data will auto-refresh via event listeners
      Alert.alert(
        'Success',
        'Credential request accepted! The credential will be added to your wallet shortly.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('DrawerNavigator'),
          },
        ]
      );
    } catch (error) {
      console.error('Error accepting credential:', error);
      Alert.alert(
        'Error',
        `Failed to accept credential: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    if (!credentialOffer) {
      navigation.navigate('DrawerNavigator');
      return;
    }

    Alert.alert(
      'Decline Credential',
      'Are you sure you want to decline this credential offer?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              // If we have a credential ID (from existing records), delete it
              if (credentialOffer.id && credentialOffer.id !== 'unknown') {
                const agent = credoAgentService.getAgent();
                if (agent) {
                  try {
                    await agent.credentials.deleteById(credentialOffer.id);
                    console.log('Credential offer declined successfully');
                  } catch (error) {
                    console.log('Credential not found in agent records, continuing...');
                  }
                }
              }

              Alert.alert(
                'Declined',
                'Credential offer has been declined.',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('DrawerNavigator'),
                  },
                ]
              );
            } catch (error) {
              console.error('Error declining credential:', error);
              Alert.alert(
                'Error',
                `Failed to decline credential: ${error instanceof Error ? error.message : 'Unknown error'}`,
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('DrawerNavigator'),
                  },
                ]
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground
          source={require('../assets/images/header-bg.png')}
          style={[styles.headerBackground, styles.headerGradient]}
          imageStyle={styles.headerBackgroundImage}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Credential Request</Text>
            <TouchableOpacity style={styles.menuButton}>
              <MaterialIcons name="more-vert" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.cardContainer}>
            <LinearGradient
              colors={['#FCA5A5', '#F87171']}
              style={styles.shield}
            >
              <View style={styles.shieldInner}>
                <Text style={styles.cardTitle}>
                  {'PolyID Issuer'}
                </Text>
                <View style={styles.cardDivider} />
                <Text style={styles.cardSubtitle}>
                  {credentialOffer?.attributes?.length || 0} Attributes
                </Text>
              </View>
            </LinearGradient>
          </View>
        </ImageBackground>
        <Text style={styles.requestedOn}>Requested On</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-US', {
            month: 'long',    // January
            day: 'numeric',   // 1–31
            year: 'numeric'   // 2025
          })}
        </Text>

        <View style={styles.attributesHeader}>
          <View style={styles.attributesIconContainer}>
            <MaterialIcons name="folder" size={20} color="#5B18B8" />
          </View>
          <Text style={styles.attributesTitle}>Attributes Offered</Text>
        </View>

        {credentialOffer?.attributes && credentialOffer.attributes.length > 0 ? (
          <>
            {credentialOffer.attributes.map((attr: { name: string; value: string }, index: number) => (
              <View key={index} style={styles.attributeRow}>
                <View style={styles.attributeBoxLarge}>
                  <Text style={styles.attributeLabel}>{attr.name.toUpperCase()}</Text>
                  <Text style={styles.attributeValue}>{attr.value}</Text>
                </View>
                <MaterialIcons name="check-circle" size={24} color="#9CA3AF" />
              </View>
            ))}
          </>
        ) : (
          <>
            <View style={styles.attributeRow}>
              <View style={styles.attributeBoxLarge}>
                <Text style={styles.attributeLabel}>EVENT NAME</Text>
                <Text style={styles.attributeValue}>VITAP</Text>
              </View>
              <MaterialIcons name="event" size={24} color="#9CA3AF" />
            </View>

            <View style={styles.attributeRow}>
              <View style={styles.attributeBoxLarge}>
                <Text style={styles.attributeLabel}>PARTICIPANT NAME</Text>
                <Text style={styles.attributeValue}>Basavantsya</Text>
              </View>
              <MaterialIcons name="person" size={24} color="#9CA3AF" />
            </View>
          </>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.acceptButton, accepting && styles.acceptButtonDisabled]}
          onPress={handleAccept}
          disabled={accepting}
        >
          <Text style={styles.buttonText}>
            {accepting ? 'Accepting...' : 'Accept'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={handleDecline}
          disabled={accepting}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 100, // Space for footer
  },
  headerBackground: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden', // Ensures the image respects the border radius
  },
  headerBackgroundImage: {
    // No specific styles needed here if it's just for the border radius
  },
  headerGradient: {
    paddingBottom: 70,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
  },
  cardContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  shield: {
    width: width * 0.4,
    height: width * 0.45,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  shieldInner: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 70,
    borderBottomRightRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Poppins-Bold',
  },
  cardDivider: {
    height: 1,
    width: '60%',
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginVertical: 8,
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Poppins-Regular',
  },
  requestedOn: {
    textAlign: 'center',
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
    marginTop: 24,
  },
  date: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'Poppins-SemiBold',
    marginTop: 4,
  },
  attributesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 32,
  },
  attributesIconContainer: {
    backgroundColor: '#EDE9FE',
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  attributesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5B18B8',
    fontFamily: 'Poppins-SemiBold',
  },
  attributeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginTop: 16,
  },
  attributeBoxLarge: {
    flex: 1,
  },
  attributeLabel: {
    fontSize: 12,
    color: '#5b18b8',
    fontFamily: 'Poppins-Regular',
    textTransform: 'uppercase',
  },
  attributeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'Poppins-SemiBold',
    marginTop: 4,
  },
  smallAttributeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginTop: 16,
  },
  attributeBoxSmall: {
    backgroundColor: '#f7f3fb',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '30%',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#F9FAFB',
  },
  acceptButton: {
    backgroundColor: '#5B18B8',
    paddingVertical: 16,
    borderRadius: 28,
    flex: 1,
    alignItems: 'center',
    marginRight: 8,
  },
  declineButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 28,
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5b18b8',
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Poppins-SemiBold',
  },
  declineButtonText: {
    color: '#5b18b8',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Poppins-SemiBold',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
  },
  menuButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
  },
  acceptButtonDisabled: {
    opacity: 0.6,
  },
});

export default CredentialRequestDetailScreen;
