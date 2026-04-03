import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ProofRequestDisplayItem } from '../hooks/useProofRequests';

interface ProofRequestCardProps {
    item: ProofRequestDisplayItem | any; // Allow for history items with different structure
    onPress?: (item: ProofRequestDisplayItem) => void;
    layoutScale: number;
    fontScale: number;
    iconScale: number;
    isHistoryItem?: boolean;
    statusText?: string;
}

const ProofRequestCard: React.FC<ProofRequestCardProps> = ({
    item,
    onPress,
    layoutScale,
    fontScale,
    iconScale,
    isHistoryItem = false,
    statusText,
}) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString();
    };

    return (
        <TouchableOpacity
            style={[ styles.card, {
                borderRadius: 16 * layoutScale,
                marginBottom: 12 * layoutScale,
                opacity: isHistoryItem && item.isCompleted && !onPress ? 0.7 : 1,
            } ]}
            onPress={onPress ? () => onPress(item) : undefined}
            activeOpacity={onPress ? 0.8 : 1}
            disabled={!onPress}
        >
            <View style={[ styles.cardContainer, {
                borderRadius: 16 * layoutScale,
                padding: 16 * layoutScale,
            } ]}>
                <View style={styles.header}>
                    <View style={[ styles.iconContainer, {
                        width: 48 * layoutScale,
                        height: 48 * layoutScale,
                        borderRadius: 24 * layoutScale,
                    } ]}>
                        <MaterialIcons
                            name="verified-user"
                            size={24 * iconScale}
                            color="#7C3AED"
                        />
                    </View>

                    <View style={styles.textContainer}>
                        {isHistoryItem && item.referenceId && (
                            <View style={[ styles.referenceBadge, { marginBottom: 4 * layoutScale } ]}>
                                <Text style={[ styles.referenceText, { fontSize: 10 * fontScale } ]}>
                                    {item.referenceId}
                                </Text>
                            </View>
                        )}
                        <Text style={[ styles.title, {
                            fontSize: 16 * fontScale,
                            lineHeight: 22 * fontScale,
                        } ]}>
                            {item.title}
                        </Text>
                        <Text style={[ styles.subtitle, {
                            fontSize: 13 * fontScale,
                            lineHeight: 18 * fontScale,
                            marginTop: 2 * layoutScale,
                        } ]}>
                            {item.subtitle}
                        </Text>

                        {isHistoryItem && (
                            <View style={[ styles.historyDetails, { marginTop: 8 * layoutScale } ]}>
                                <View style={styles.detailRow}>
                                    <Text style={[ styles.detailLabel, { fontSize: 12 * fontScale } ]}>Holder</Text>
                                    <Text style={[ styles.detailValue, { fontSize: 12 * fontScale } ]}>{item.holderName || 'N/A'}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={[ styles.detailLabel, { fontSize: 12 * fontScale } ]}>Verifier</Text>
                                    <Text style={[ styles.detailValue, { fontSize: 12 * fontScale } ]}>{item.title}</Text>
                                </View>
                                {item.location && (
                                    <View style={[ styles.footerItem, { marginTop: 4 * layoutScale } ]}>
                                        <MaterialIcons
                                            name="place"
                                            size={14 * iconScale}
                                            color="#6B7280"
                                        />
                                        <Text style={[ styles.footerText, {
                                            fontSize: 12 * fontScale,
                                            marginLeft: 4 * layoutScale,
                                        } ]}>
                                            {item.location}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {!isHistoryItem && (
                            <View style={styles.footerItem}>
                                <MaterialIcons
                                    name="access-time"
                                    size={14 * iconScale}
                                    color="#6B7280"
                                />
                                <Text style={[ styles.footerText, {
                                    fontSize: 12 * fontScale,
                                    marginLeft: 4 * layoutScale,
                                } ]}>
                                    {formatDate(item.createdAt)}
                                </Text>
                                {item.matchingCredentialsCount !== undefined && (
                                    <>
                                        <Text style={[ styles.footerText, {
                                            fontSize: 12 * fontScale,
                                            marginLeft: 8 * layoutScale,
                                            marginRight: 4 * layoutScale,
                                        } ]}>
                                            •
                                        </Text>
                                        <MaterialIcons
                                            name="badge"
                                            size={14 * iconScale}
                                            color="#7C3AED"
                                        />
                                        <Text style={[ styles.footerText, {
                                            fontSize: 12 * fontScale,
                                            marginLeft: 4 * layoutScale,
                                            color: '#7C3AED',
                                            fontWeight: '600',
                                        } ]}>
                                            {item.matchingCredentialsCount} {item.matchingCredentialsCount === 1 ? 'credential' : 'credentials'}
                                        </Text>
                                    </>
                                )}
                            </View>
                        )}
                    </View>

                    <View style={styles.rightSection}>
                        {(() => {
                            // Determine badge style and text based on status
                            let badgeStyle = styles.badge;
                            let badgeTextStyle = styles.badgeText;
                            let badgeText = 'Pending';
                            let showChevron = !!onPress;

                            if (isHistoryItem && statusText) {
                                badgeText = statusText;
                                switch (item.status) {
                                    case 'completed':
                                        badgeStyle = { ...styles.badge, ...styles.completedBadge };
                                        badgeTextStyle = { ...styles.badgeText, ...styles.completedBadgeText };
                                        break;
                                    case 'accepted':
                                        badgeStyle = { ...styles.badge, ...styles.acceptedBadge };
                                        badgeTextStyle = { ...styles.badgeText, ...styles.acceptedBadgeText };
                                        break;
                                    case 'declined':
                                        badgeStyle = { ...styles.badge, ...styles.declinedBadge };
                                        badgeTextStyle = { ...styles.badgeText, ...styles.declinedBadgeText };
                                        break;
                                    case 'failed':
                                        badgeStyle = { ...styles.badge, ...styles.failedBadge };
                                        badgeTextStyle = { ...styles.badgeText, ...styles.failedBadgeText };
                                        break;
                                }
                                showChevron = false; // History items don't have chevron
                            }

                            return (
                                <>
                                    <View style={[ badgeStyle, {
                                        paddingHorizontal: 8 * layoutScale,
                                        paddingVertical: 4 * layoutScale,
                                        borderRadius: 12 * layoutScale,
                                        marginBottom: showChevron ? 4 * layoutScale : 0,
                                    } ]}>
                                        <Text style={[ badgeTextStyle, {
                                            fontSize: 11 * fontScale,
                                        } ]}>
                                            {badgeText}
                                        </Text>
                                    </View>
                                    {showChevron && (
                                        <MaterialIcons
                                            name="chevron-right"
                                            size={24 * iconScale}
                                            color="#9CA3AF"
                                        />
                                    )}
                                </>
                            );
                        })()}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardContainer: {
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        backgroundColor: '#F3E8FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        marginLeft: 12,
    },
    title: {
        color: '#1F2937',
        fontWeight: '700',
        fontFamily: 'Poppins',
    },
    subtitle: {
        color: '#6B7280',
        fontWeight: '400',
        fontFamily: 'Poppins',
    },
    rightSection: {
        alignItems: 'flex-end',
    },
    badge: {
        backgroundColor: '#FEF3C7',
        borderWidth: 1,
        borderColor: '#FCD34D',
    },
    badgeText: {
        color: '#92400E',
        fontWeight: '600',
        fontFamily: 'Poppins',
    },
    completedBadge: {
        backgroundColor: '#D1FAE5',
        borderColor: '#10B981',
    },
    completedBadgeText: {
        color: '#065F46',
    },
    acceptedBadge: {
        backgroundColor: '#DBEAFE',
        borderColor: '#3B82F6',
    },
    acceptedBadgeText: {
        color: '#1E40AF',
    },
    declinedBadge: {
        backgroundColor: '#FEE2E2',
        borderColor: '#EF4444',
    },
    declinedBadgeText: {
        color: '#991B1B',
    },
    failedBadge: {
        backgroundColor: '#FEF2F2',
        borderColor: '#F87171',
    },
    failedBadgeText: {
        color: '#7F1D1D',
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    footerText: {
        color: '#6B7280',
        fontFamily: 'Poppins',
    },
    referenceBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    referenceText: {
        color: '#6B7280',
        fontWeight: '600',
        fontFamily: 'Poppins',
    },
    historyDetails: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    detailLabel: {
        color: '#9CA3AF',
        fontFamily: 'Poppins',
    },
    detailValue: {
        color: '#1F2937',
        fontWeight: '600',
        fontFamily: 'Poppins',
    },
});

export default ProofRequestCard;
