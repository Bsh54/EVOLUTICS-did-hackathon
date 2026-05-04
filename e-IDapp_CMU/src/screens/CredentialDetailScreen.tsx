import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { RootStackParamList } from '../navigation/AppNavigator';
import { fetchTemplateUrl } from '../services/template-api';
import { loadTemplateDataStore, TemplateDataEntry } from '../utils/templateStorage';

const { width } = Dimensions.get('window');

type CredentialDetailRouteProp = RouteProp<RootStackParamList, 'CredentialDetail'>;

const CredentialDetailScreen = ({ navigation }: { navigation: any }) => {
  const route = useRoute<CredentialDetailRouteProp>();
  const { credential } = route.params || {};
  const connections = useSelector((state: RootState) => state.credo.connections);

  // Extract credential data
  const attributes = credential?.credentialAttributes || [];
  const credentialTitle = 'Credential';

  // If connection label is "Unknown Issuer", use the first credential attribute value as the issuer name
  const issuer = useMemo(() => {
    const connectionLabel = credential?.connectionLabel || 'Unknown Issuer';
    if (connectionLabel === 'Unknown Issuer' && attributes.length > 0 && attributes[0]?.value) {
      return attributes[0].value;
    }
    return connectionLabel;
  }, [credential?.connectionLabel, attributes]);

  const createdAt = credential?.createdAt
    ? new Date(credential.createdAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    : 'Unknown';

  const state = credential?.state || 'unknown';
  const isPending = state === 'offer-received' || state === 'request-sent';
  const isDone = state === 'done';

  // Template data state
  const [templateEntry, setTemplateEntry] = useState<TemplateDataEntry | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);

  // Check if template data exists for this credential
  useEffect(() => {
    const checkTemplateData = async () => {
      try {
        const store = await loadTemplateDataStore();
        const storeEntries = Object.entries(store);
        console.log('📄 template store =============', JSON.stringify(store));
        console.log('📄 credential id =============', credential?.id);
        console.log('📄 credential comment =============', credential?.comment);
        console.log('📄 credential attributes =============', credential?.credentialAttributes?.map((a: any) => a.name));

        if (storeEntries.length === 0) {
          console.log('📄 No template data in store');
          return;
        }

        const credId = credential?.id || '';
        const credComment = credential?.comment || '';
        const credAttrs = credential?.credentialAttributes || [];

        // Strategy 1: Direct match by credential ID
        if (store[credId]) {
          console.log('📄 ✅ Matched by credential ID:', credId);
          setTemplateEntry(store[credId]);
          return;
        }

        // Strategy 2: Match by comment/label (invitation label often matches comment)
        for (const [key, entry] of storeEntries) {
          if (credComment && key.includes(credComment)) {
            console.log('📄 ✅ Matched by comment:', credComment);
            setTemplateEntry(entry);
            return;
          }
        }

        // Strategy 3: Match by attribute names (when stored attributes are available)
        for (const [key, entry] of storeEntries) {
          if (entry.attributes && entry.attributes.length > 0 && credAttrs.length > 0) {
            const storedAttrNames = entry.attributes.map((a: any) => a.name).sort().join(',');
            const credAttrNames = credAttrs.map((a: any) => a.name).sort().join(',');
            if (storedAttrNames === credAttrNames) {
              console.log('📄 ✅ Matched by attribute names:', storedAttrNames);
              setTemplateEntry(entry);
              return;
            }
          }
        }

        // Strategy 4: Fallback - if there's any entry with a valid documentKey, use it
        // This handles cases where stored attributes are empty but documentKey exists
        for (const [key, entry] of storeEntries) {
          if (entry.documentKey) {
            console.log('📄 ✅ Fallback match - using entry with documentKey:', entry.documentKey, 'key:', key);
            setTemplateEntry(entry);
            return;
          }
        }

        console.log('📄 ❌ No matching template entry found');
      } catch (error) {
        console.log('Error checking template data:', error);
      }
    };
    checkTemplateData();
  }, [credential]);

  // Handle template view button press
  const handleTemplateView = async () => {
    if (!templateEntry) return;

    setTemplateLoading(true);
    try {
      // Fetch the template URL from API
      console.log("templateEntry.documentKey =============", templateEntry.documentKey)
      const response = await fetchTemplateUrl(templateEntry.documentKey);
      console.log("template response =============", response)
      if (response.success && response.data?.url) {
        // Build templateData from credential attributes
        const templateData: Record<string, string> = {};
        const credAttrs = credential?.credentialAttributes || [];
        credAttrs.forEach((attr: any) => {
          if (attr.name && attr.value) {
            templateData[attr.name] = attr.value;
          }
        });

        // Also merge stored attributes as fallback
        templateEntry.attributes.forEach((attr) => {
          if (attr.name && attr.value && !templateData[attr.name]) {
            templateData[attr.name] = attr.value;
          }
        });

        setTemplateLoading(false);

        // Navigate to WebView with the template URL
        navigation.navigate('WebView', {
          url: response.data.url,
          title: 'Template View',
          templateData,
        });
      } else {
        setTemplateLoading(false);
        Alert.alert('Error', 'Failed to load template URL. Please try again.');
      }
    } catch (error) {
      setTemplateLoading(false);
      console.error('Error loading template:', error);
      Alert.alert('Error', 'Failed to load template. Please check your internet connection.');
    }
  };

  console.log("templateEntry =============", templateEntry)
  return (
    <View style={[styles.container, styles.headerGradient]}>
      <ImageBackground
        source={require('../assets/images/header-bg.png')}
        style={[styles.headerBackground, styles.headerGradient]}
        imageStyle={styles.headerBackgroundImage}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isPending ? 'Credential Request' : 'Credential Details'}
          </Text>
          <TouchableOpacity style={styles.menuButton}>
            <MaterialIcons name="more-vert" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.cardContainer}>
          <LinearGradient
            colors={isPending ? ['#FCA5A5', '#F87171'] : ['#10B981', '#059669']}
            style={styles.shield}
          >
            <View style={styles.shieldInner}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {credentialTitle}
              </Text>
              <View style={styles.cardDivider} />
              <Text style={styles.cardSubtitle}>
                {attributes.length} {attributes.length === 1 ? 'Attribute' : 'Attributes'}
              </Text>
            </View>
          </LinearGradient>
        </View>
      </ImageBackground>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.requestedOn}>
          {isPending ? 'Requested On' : 'Issued On'}
        </Text>
        <Text style={styles.date}>{createdAt}</Text>

        {attributes.length > 0 ? (
          <>
            <View style={styles.attributesHeader}>
              <View style={styles.attributesIconContainer}>
                <MaterialIcons name="folder" size={20} color="#5B18B8" />
              </View>
              <Text style={styles.attributesTitle}>
                {isPending ? 'Attributes Offered' : 'Credential Attributes'}
              </Text>
            </View>

            {attributes.map((attr: any, index: number) => (
              <View key={index} style={styles.attributeRow}>
                <View style={styles.attributeBoxLarge}>
                  <Text style={styles.attributeLabel}>
                    {attr.name?.toUpperCase() || 'ATTRIBUTE'}
                  </Text>
                  <Text style={styles.attributeValue} numberOfLines={2}>
                    {attr.value || 'N/A'}
                  </Text>
                </View>
                <MaterialIcons
                  name={getAttributeIcon(attr.name)}
                  size={24}
                  color="#9CA3AF"
                />
              </View>
            ))}
          </>
        ) : (
          <View style={styles.noAttributesContainer}>
            <MaterialIcons name="info-outline" size={48} color="#9CA3AF" />
            <Text style={styles.noAttributesText}>
              No attributes available for this credential
            </Text>
          </View>
        )}

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Issuer</Text>
            <Text style={styles.infoValue}>{issuer}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={[styles.infoValue, {
              color: isDone ? '#10B981' : isPending ? '#F59E0B' : '#6B7280',
            }]}>
              {state}
            </Text>
          </View>
          {credential?.schemaId && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Schema ID</Text>
              <Text style={[styles.infoValue, { fontSize: 12 }]} numberOfLines={1}>
                {credential.schemaId}
              </Text>
            </View>
          )}
        </View>

        {/* Template View Button */}
        {templateEntry && (
          <TouchableOpacity
            style={styles.templateViewButton}
            onPress={handleTemplateView}
            disabled={templateLoading}
            activeOpacity={0.7}
          >
            {templateLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="description" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.templateViewButtonText}>Template View</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
      {isPending && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.acceptButton}>
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.declineButton}>
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
  },
  scrollContainer: {
    flex: 1,
    paddingBottom: 10,
  },
  noAttributesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    marginHorizontal: 24,
  },
  noAttributesText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 16,
    fontFamily: 'Poppins',
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginTop: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'Poppins',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
    textTransform: 'capitalize',
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
  templateViewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B18B8',
    borderRadius: 28,
    paddingVertical: 16,
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 20,
    shadowColor: '#5B18B8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  templateViewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Poppins-SemiBold',
  },
});

// Helper function to get icon based on attribute name
const getAttributeIcon = (name: string): string => {
  const lowerName = name?.toLowerCase() || '';
  if (lowerName.includes('name') || lowerName.includes('participant')) return 'person';
  if (lowerName.includes('event') || lowerName.includes('title')) return 'event';
  if (lowerName.includes('date') || lowerName.includes('time')) return 'calendar-today';
  if (lowerName.includes('email') || lowerName.includes('mail')) return 'email';
  if (lowerName.includes('phone') || lowerName.includes('mobile')) return 'phone';
  if (lowerName.includes('address') || lowerName.includes('location')) return 'location-on';
  if (lowerName.includes('id') || lowerName.includes('number')) return 'badge';
  return 'info';
};

export default CredentialDetailScreen;
