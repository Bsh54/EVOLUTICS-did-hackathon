import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	SafeAreaView,
	ActivityIndicator,
	Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useBackupManagement } from '../hooks/useBackupManagement';

const BackupManagementScreen: React.FC = () => {
	const navigation = useNavigation<any>();

	const {
		backups,
		backupsLoading,
		backupsError,
		backupMetadata,
		deleteBackup,
	} = useBackupManagement();

	const handleDelete = (backupFilename: string) => {
		Alert.alert(
			'Delete Backup',
			`Are you sure you want to delete "${backupFilename}"? This action cannot be undone.`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						const success = await deleteBackup(backupFilename);
						if (success) {
							Alert.alert('Success', 'Backup deleted successfully');
						} else {
							Alert.alert('Error', 'Failed to delete backup');
						}
					},
				},
			]
		);
	};

	const formatDate = (timestamp: string) => {
		return new Date(timestamp).toLocaleString();
	};

	const formatSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
					<Text style={styles.headerTitle}>Backup Management</Text>
					<View style={styles.placeholder} />
				</View>

				<ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
					<View style={styles.iconContainer}>
						<MaterialIcons name="folder" size={80} color="#667eea" />
					</View>

					<View style={styles.actionsContainer}>
						<TouchableOpacity
							style={styles.actionButton}
							onPress={() => navigation.navigate('BackupWallet')}
						>
							<MaterialIcons name="backup" size={24} color="#fff" />
							<Text style={styles.actionButtonText}>Create Backup</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={[ styles.actionButton, styles.restoreButton ]}
							onPress={() => navigation.navigate('RestoreWallet')}
						>
							<MaterialIcons name="restore" size={24} color="#fff" />
							<Text style={styles.actionButtonText}>Restore Wallet</Text>
						</TouchableOpacity>
					</View>

					{backupsLoading ? (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size="large" color="#667eea" />
							<Text style={styles.loadingText}>Loading backups...</Text>
						</View>
					) : backupsError ? (
						<View style={styles.errorContainer}>
							<MaterialIcons name="error" size={40} color="#f44336" />
							<Text style={styles.errorText}>{backupsError}</Text>
						</View>
					) : backups.length === 0 ? (
						<View style={styles.emptyContainer}>
							<MaterialIcons name="folder-open" size={60} color="#ccc" />
							<Text style={styles.emptyText}>No backups found</Text>
							<Text style={styles.emptySubtext}>
								Create your first backup to get started
							</Text>
						</View>
					) : (
						<View style={styles.backupsList}>
							<Text style={styles.sectionTitle}>Available Backups</Text>
							{backups.map((backup) => {
								const metadata = backupMetadata[ backup ];
								return (
									<View key={backup} style={styles.backupCard}>
										<View style={styles.backupCardHeader}>
											<MaterialIcons name="backup" size={24} color="#667eea" />
											<View style={styles.backupCardInfo}>
												<Text style={styles.backupCardTitle} numberOfLines={1}>
													{backup}
												</Text>
												{metadata && (
													<>
														<Text style={styles.backupCardSubtitle}>
															{metadata.walletLabel}
														</Text>
														<Text style={styles.backupCardDate}>
															{formatDate(metadata.timestamp)}
														</Text>
														<Text style={styles.backupCardSize}>
															{formatSize(metadata.backupSize)}
														</Text>
													</>
												)}
											</View>
										</View>
										<View style={styles.backupCardActions}>
											<TouchableOpacity
												style={styles.deleteButton}
												onPress={() => handleDelete(backup)}
											>
												<MaterialIcons name="delete" size={20} color="#f44336" />
												<Text style={styles.deleteButtonText}>Delete</Text>
											</TouchableOpacity>
										</View>
									</View>
								);
							})}
						</View>
					)}
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
	actionsContainer: {
		flexDirection: 'row',
		gap: 12,
		marginBottom: 30,
	},
	actionButton: {
		flex: 1,
		backgroundColor: '#667eea',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 16,
		borderRadius: 12,
		gap: 8,
	},
	restoreButton: {
		backgroundColor: '#4caf50',
	},
	actionButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	loadingContainer: {
		alignItems: 'center',
		padding: 40,
	},
	loadingText: {
		marginTop: 12,
		fontSize: 16,
		color: '#666',
	},
	errorContainer: {
		alignItems: 'center',
		padding: 40,
	},
	errorText: {
		marginTop: 12,
		fontSize: 16,
		color: '#f44336',
		textAlign: 'center',
	},
	emptyContainer: {
		alignItems: 'center',
		padding: 40,
	},
	emptyText: {
		marginTop: 16,
		fontSize: 18,
		fontWeight: '600',
		color: '#666',
	},
	emptySubtext: {
		marginTop: 8,
		fontSize: 14,
		color: '#999',
		textAlign: 'center',
	},
	backupsList: {
		marginTop: 20,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#333',
		marginBottom: 16,
	},
	backupCard: {
		backgroundColor: '#f9f9f9',
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: '#e0e0e0',
	},
	backupCardHeader: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginBottom: 12,
		gap: 12,
	},
	backupCardInfo: {
		flex: 1,
	},
	backupCardTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: '#333',
		marginBottom: 4,
	},
	backupCardSubtitle: {
		fontSize: 14,
		color: '#666',
		marginBottom: 2,
	},
	backupCardDate: {
		fontSize: 12,
		color: '#999',
		marginBottom: 2,
	},
	backupCardSize: {
		fontSize: 12,
		color: '#999',
	},
	backupCardActions: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		borderTopWidth: 1,
		borderTopColor: '#e0e0e0',
		paddingTop: 12,
	},
	deleteButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 8,
		backgroundColor: '#ffebee',
		gap: 6,
	},
	deleteButtonText: {
		color: '#f44336',
		fontSize: 14,
		fontWeight: '600',
	},
});

export default BackupManagementScreen;

