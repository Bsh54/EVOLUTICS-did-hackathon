import React, { useState } from 'react';
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
import { createBackup, clearBackupError } from '../../../store/slices/backupSlice';
import { verifyPin } from '../../../utils/localStorage';

const BackupWalletScreen: React.FC = () => {
	const navigation = useNavigation<any>();
	const dispatch = useDispatch<AppDispatch>();
	const { isBackingUp, backupError } = useSelector((state: RootState) => state.backup);

	const [ pin, setPin ] = useState('');
	const [ exportKey, setExportKey ] = useState('');
	const [ confirmExportKey, setConfirmExportKey ] = useState('');
	const [ showPin, setShowPin ] = useState(false);
	const [ showExportKey, setShowExportKey ] = useState(false);
	const [ showConfirmExportKey, setShowConfirmExportKey ] = useState(false);

	const handleBackup = async () => {
		// Validate inputs
		if (!pin) {
			Alert.alert('Error', 'Please enter your PIN');
			return;
		}

		// Verify PIN
		const isValidPin = await verifyPin(pin);
		if (!isValidPin) {
			Alert.alert('Error', 'Invalid PIN');
			return;
		}

		if (!exportKey) {
			Alert.alert('Error', 'Please enter an export key');
			return;
		}

		if (exportKey.length < 8) {
			Alert.alert('Error', 'Export key must be at least 8 characters long');
			return;
		}

		if (exportKey !== confirmExportKey) {
			Alert.alert('Error', 'Export keys do not match');
			return;
		}

		// Clear any previous errors
		dispatch(clearBackupError());

		// Create backup
		const result = await dispatch(createBackup({ pin, exportKey }));

		if (createBackup.fulfilled.match(result)) {
			Alert.alert(
				'Success',
				'Wallet backup created successfully!',
				[
					{
						text: 'OK',
						onPress: () => navigation.goBack(),
					},
				]
			);
		} else {
			Alert.alert('Error', result.payload as string || 'Failed to create backup');
		}
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
					<Text style={styles.headerTitle}>Backup Wallet</Text>
					<View style={styles.placeholder} />
				</View>

				<ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
					<View style={styles.iconContainer}>
						<MaterialIcons name="backup" size={80} color="#667eea" />
					</View>

					<Text style={styles.description}>
						Create a secure backup of your wallet. You'll need your PIN and an export key to restore this backup later.
					</Text>

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
							<Text style={styles.hint}>
								Choose a strong export key (minimum 8 characters). You'll need this to restore your backup.
							</Text>
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
							<Text style={styles.label}>Confirm Export Key</Text>
							<View style={styles.inputWrapper}>
								<TextInput
									style={styles.input}
									value={confirmExportKey}
									onChangeText={setConfirmExportKey}
									placeholder="Confirm export key"
									secureTextEntry={!showConfirmExportKey}
								/>
								<TouchableOpacity
									onPress={() => setShowConfirmExportKey(!showConfirmExportKey)}
									style={styles.eyeButton}
								>
									<MaterialIcons
										name={showConfirmExportKey ? 'visibility' : 'visibility-off'}
										size={24}
										color="#666"
									/>
								</TouchableOpacity>
							</View>
						</View>

						{backupError && (
							<View style={styles.errorContainer}>
								<MaterialIcons name="error" size={20} color="#f44336" />
								<Text style={styles.errorText}>{backupError}</Text>
							</View>
						)}

						<TouchableOpacity
							style={[ styles.button, isBackingUp && styles.buttonDisabled ]}
							onPress={handleBackup}
							disabled={isBackingUp}
						>
							{isBackingUp ? (
								<ActivityIndicator color="#fff" />
							) : (
								<>
									<MaterialIcons name="backup" size={20} color="#fff" />
									<Text style={styles.buttonText}>Create Backup</Text>
								</>
							)}
						</TouchableOpacity>
					</View>

					<View style={styles.warningContainer}>
						<MaterialIcons name="warning" size={20} color="#ff9800" />
						<Text style={styles.warningText}>
							Important: Store your export key in a safe place. You'll need both your PIN and export key to restore this backup.
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

export default BackupWalletScreen;

