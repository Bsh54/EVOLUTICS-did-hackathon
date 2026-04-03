import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import {
  restoreWallet,
  validateBackup,
  loadBackupMetadata,
  loadBackups,
  setSelectedBackup,
  clearRestoreError,
} from '../../../store/slices/backupSlice';
import { initializeAgent } from '../../../store/slices/credoSlice';

const RestoreWalletScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const {
    isRestoring,
    restoreError,
    selectedBackup,
    selectedBackupMetadata,
    backups,
  } = useSelector((state: RootState) => state.backup);

  const [ pin, setPin ] = useState('');
  const [ exportKey, setExportKey ] = useState('');
  const [ newWalletKey, setNewWalletKey ] = useState('');
  const [ showPin, setShowPin ] = useState(false);
  const [ showExportKey, setShowExportKey ] = useState(false);
  const [ showNewWalletKey, setShowNewWalletKey ] = useState(false);
  const [ isValidating, setIsValidating ] = useState(false);

  useEffect(() => {
    // Clear any stale backup selection on mount
    dispatch(setSelectedBackup(null));
    // Load backups on mount
    dispatch(loadBackups());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Validate selectedBackup against backups list after it loads
  useEffect(() => {
    if (selectedBackup && backups.length > 0 && !backups.includes(selectedBackup)) {
      // Clear selection if it no longer exists in the backups list
      dispatch(setSelectedBackup(null));
    }
  }, [ backups, selectedBackup, dispatch ]);

  const handleSelectBackup = (backupFilename: string) => {
    dispatch(setSelectedBackup(backupFilename));
    dispatch(loadBackupMetadata(backupFilename));
  };

  const handleValidate = async () => {
    if (!selectedBackup) {
      Alert.alert('Error', 'Please select a backup file');
      return;
    }

    if (!pin) {
      Alert.alert('Error', 'Please enter your PIN');
      return;
    }

    setIsValidating(true);
    const result = await dispatch(validateBackup({ backupFilename: selectedBackup, pin }));

    if (validateBackup.fulfilled.match(result)) {
      Alert.alert('Success', 'Backup file is valid and PIN is correct');
    } else {
      Alert.alert('Error', result.payload as string || 'Backup validation failed');
    }
    setIsValidating(false);
  };

  const handleRestore = async () => {
    if (!selectedBackup) {
      Alert.alert('Error', 'Please select a backup file');
      return;
    }

    if (!pin) {
      Alert.alert('Error', 'Please enter your PIN');
      return;
    }

    if (!exportKey) {
      Alert.alert('Error', 'Please enter the export key');
      return;
    }

    // Show confirmation
    Alert.alert(
      'Confirm Restore',
      'This will replace your current wallet. Are you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            dispatch(clearRestoreError());

            const result = await dispatch(
              restoreWallet({
                backupFilename: selectedBackup,
                pin,
                exportKey,
                newWalletKey: newWalletKey || undefined,
              })
            );

            if (restoreWallet.fulfilled.match(result)) {
              // Reinitialize agent with restored wallet
              try {
                await dispatch(initializeAgent({}));
                Alert.alert(
                  'Success',
                  'Wallet restored successfully!',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        navigation.reset({
                          index: 0,
                          routes: [ { name: 'DrawerNavigator' } ],
                        });
                      },
                    },
                  ]
                );
              } catch (error: any) {
                Alert.alert('Error', 'Wallet restored but failed to reinitialize agent: ' + error.message);
              }
            } else {
              Alert.alert('Error', result.payload as string || 'Failed to restore wallet');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[ '#667eea', '#764ba2' ]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Restore Wallet</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="restore" size={80} color="#667eea" />
          </View>

          <Text style={styles.description}>
            Restore your wallet from a backup file. You'll need your PIN and the export key used when creating the backup.
          </Text>

          {/* Backup Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Backup</Text>
            {backups.length === 0 ? (
              <Text style={styles.noBackupsText}>No backups found</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.backupList}>
                {backups.map((backup) => (
                  <TouchableOpacity
                    key={backup}
                    style={[
                      styles.backupItem,
                      selectedBackup === backup && styles.backupItemSelected,
                    ]}
                    onPress={() => handleSelectBackup(backup)}
                  >
                    <MaterialIcons
                      name={selectedBackup === backup ? 'radio-button-checked' : 'radio-button-unchecked'}
                      size={20}
                      color={selectedBackup === backup ? '#667eea' : '#999'}
                    />
                    <Text style={styles.backupItemText} numberOfLines={1}>
                      {backup}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {selectedBackupMetadata && (
              <View style={styles.metadataContainer}>
                <Text style={styles.metadataText}>
                  Wallet: {selectedBackupMetadata.walletLabel}
                </Text>
                <Text style={styles.metadataText}>
                  Date: {new Date(selectedBackupMetadata.timestamp).toLocaleString()}
                </Text>
                <Text style={styles.metadataText}>
                  Size: {(selectedBackupMetadata.backupSize / 1024).toFixed(2)} KB
                </Text>
              </View>
            )}
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>PIN</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={pin}
                  onChangeText={setPin}
                  placeholder="Enter your PIN"
                  secureTextEntry={!showPin}
                  keyboardType="numeric"
                  maxLength={6}
                />
                <TouchableOpacity
                  onPress={() => setShowPin(!showPin)}
                  style={styles.eyeButton}
                >
                  <MaterialIcons
                    name={showPin ? 'visibility' : 'visibility-off'}
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Export Key</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={exportKey}
                  onChangeText={setExportKey}
                  placeholder="Enter export key"
                  secureTextEntry={!showExportKey}
                />
                <TouchableOpacity
                  onPress={() => setShowExportKey(!showExportKey)}
                  style={styles.eyeButton}
                >
                  <MaterialIcons
                    name={showExportKey ? 'visibility' : 'visibility-off'}
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>New Wallet Key (Optional)</Text>
              <Text style={styles.hint}>
                Leave empty to use the original wallet key
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={newWalletKey}
                  onChangeText={setNewWalletKey}
                  placeholder="Enter new wallet key (optional)"
                  secureTextEntry={!showNewWalletKey}
                />
                <TouchableOpacity
                  onPress={() => setShowNewWalletKey(!showNewWalletKey)}
                  style={styles.eyeButton}
                >
                  <MaterialIcons
                    name={showNewWalletKey ? 'visibility' : 'visibility-off'}
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {restoreError && (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error" size={20} color="#f44336" />
                <Text style={styles.errorText}>{restoreError}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[ styles.button, styles.validateButton ]}
              onPress={handleValidate}
              disabled={isValidating || !selectedBackup}
            >
              {isValidating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="verified" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Validate Backup</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[ styles.button, isRestoring && styles.buttonDisabled ]}
              onPress={handleRestore}
              disabled={isRestoring || !selectedBackup}
            >
              {isRestoring ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="restore" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Restore Wallet</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.warningContainer}>
            <MaterialIcons name="warning" size={20} color="#ff9800" />
            <Text style={styles.warningText}>
              Warning: Restoring will replace your current wallet. Make sure you have a backup of your current wallet if needed.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  contentContainer: {
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  backupList: {
    marginBottom: 12,
  },
  backupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    gap: 8,
    minWidth: 200,
  },
  backupItemSelected: {
    borderColor: '#667eea',
    backgroundColor: '#f3f4ff',
  },
  backupItemText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  noBackupsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  metadataContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  metadataText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  form: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#333',
  },
  eyeButton: {
    padding: 8,
  },
  button: {
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 10,
    gap: 8,
  },
  validateButton: {
    backgroundColor: '#4caf50',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#f44336',
    fontSize: 14,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  warningText: {
    flex: 1,
    color: '#e65100',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default RestoreWalletScreen;

