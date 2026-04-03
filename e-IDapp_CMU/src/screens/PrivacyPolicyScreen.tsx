import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Pressable,
    useWindowDimensions,
    Platform,
    NativeSyntheticEvent,
    NativeScrollEvent,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type PrivacyPolicyNavigationProp = StackNavigationProp<RootStackParamList, 'PrivacyPolicy'>;

const PRIVACY_POLICY_TEXT = `e-IDSTACK PROJECT – INFORMATION SECURITY & SDLC POLICY

Company Name: Intuitive Data Solutions
Document Classification: Internal
Applies To: e-IDStack (Issuer–Holder–Verifier Platform)
Version: 1.0
Review Frequency: Annual or upon significant change

1. Purpose
This policy defines the information security principles, software development lifecycle (SDLC) controls, and operational practices governing the e-IDStack project at Intuitive Data Solutions.

The objective is to ensure that:
    • Security and privacy are embedded into development
    • Self-Sovereign Identity (SSI) principles are preserved
    • Risks are identified and managed
    • Processes are defined even where tooling is still evolving

2. Scope
This policy applies to:
    • Design, development, testing, deployment, and maintenance of the e- IDStack platform
    • All personnel involved in the e-IDStack project, including development and DevOps teams

3. e-IDSTACK ARCHITECTURE OVERVIEW
The e-IDStack project is a Self-Sovereign Identity platform based on the Issuer–Holder–Verifier model.

Key architectural principles:
    • Personal identity data and claims are stored only on user-controlled devices
    • Backend systems do not store personal data
    • All credential sharing occurs only with explicit user consent

Core components:
    • Issuer System: Issues verifiable credentials
    • Holder Application: Mobile wallet (Android/iOS)
    • Verifier System: Verifies credentials when consent is provided
    • Backend Services: Facilitate issuance and verification without retaining personal data

4. SOFTWARE DEVELOPMENT LIFE CYCLE (SDLC) POLICY

4.1 Objective
To ensure that e-IDStack development is secure, controlled, and traceable throughout its lifecycle.

4.2 SDLC Stages
a) Requirement Identification
    • Business and technical requirements are defined at the start of development.
    • Security and privacy considerations are reviewed during requirement discussions.

b) Design & Architecture
    • Architecture follows SSI and decentralization principles.
    • Centralized storage of personal data is explicitly prohibited.

c) Development
    • Secure coding practices are followed.
    • Developers adhere to internal coding standards.
    • Open-source dependencies are reviewed before usage.

d) Code Review
    • All code changes must be reviewed before merging.
    • A developer must not approve their own code.
    • Peer review is mandatory due to absence of automated enforcement tools.

e) Testing
    • Functional testing is performed for all releases.
    • Basic security testing is conducted prior to deployment.
    • Detailed security testing approach: _______To be Updated____________________

f) Deployment
    • Deployment is currently manual due to tooling limitations.
    • Deployment responsibility: _________to be updated______________________
    • Changes are deployed only after review approval.

g) Future Enhancements
    • CI/CD pipeline implementation is planned.
    • Multiple environments will be created post-CI/CD.

5. SEGREGATION OF DUTIES (SoD) POLICY
Objective
To prevent unauthorized or unreviewed changes to the system.

Policy Statement
    • Development, review, and deployment activities must be segregated.
    • One individual must not perform conflicting roles for the same change.
    • Due to tooling limitations, segregation is enforced procedurally.

Roles (generic, not person-specific)
    • Developer: Writes and modifies code
    • Reviewer: Reviews and approves code
    • DevOps: Handles deployment and environment operations

6. RISK MANAGEMENT POLICY
Objective
To identify and manage risks related to security, availability, and compliance.

Risk Identification
    • Risks are identified during design and development phases.
    • Risks include security, operational, availability, and compliance risks.

Risk Treatment 
    • Identified risks are documented.
    • Mitigation actions are defined and tracked.
    • Risk register location: _____To be updated__________________________

7. ENVIRONMENT & DEPLOYMENT MANAGEMENT
Current State
    • A single environment is in use.
    • No critical or sensitive personal data is stored.
    • Usage is primarily for development and demonstration.

Justification
    • Early-stage product development
    • SSI architecture minimizes data exposure risk

Planned State
    • Separate environments (Development, Testing, Demo, Production)
    • Implementation aligned with CI/CD rollout

8. DATA PRIVACY & DATA HANDLING POLICY
Policy Statement
    • e-IDStack backend systems do not store personal data or claims.
    • Personal data resides only on the user’s device.
    • User consent is mandatory for any credential sharing.

Compliance Alignment
    • Self-Sovereign Identity (SSI)
    • GDPR principles
    • Digital Personal Data Protection (DPDP) Act, India

Data Retention
    • Backend retains only system identifiers.
    • No personal data retention applies to backend services.

9. TRAINING & ONBOARDING POLICY
Objective
To ensure team members understand e-IDStack processes and security responsibilities.

Onboarding
    • New members receive walkthroughs of architecture and processes.
    • Policies and SOPs are shared during onboarding.
    • Knowledge transfer is performed by senior team members.
    • Training records location: ____To be updated _________________________

10. ROLES & RESPONSIBILITIES (HIGH LEVEL)
    • Activity: Development | Responsible Role: Developer
    • Activity: Code Review | Responsible Role: Peer Reviewer
    • Activity: Deployment | Responsible Role: DevOps
    • Activity: Backup & Monitoring | Responsible Role: DevOps

11. POLICY REVIEW & MAINTENANCE

This policy will be reviewed annually or upon major changes.
Policy owner: _________________________________`;

const PrivacyPolicyScreen: React.FC = () => {
    const { width, height } = useWindowDimensions();
    const navigation = useNavigation<PrivacyPolicyNavigationProp>();
    const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const styles = React.useMemo(() => createStyles(width, height), [width, height]);

    const handleScroll = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
            const paddingToBottom = 30;
            const isCloseToBottom =
                layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

            if (isCloseToBottom && !hasScrolledToEnd) {
                setHasScrolledToEnd(true);
            }
        },
        [hasScrolledToEnd],
    );

    const handleCheckboxToggle = () => {
        if (hasScrolledToEnd) {
            setIsChecked(!isChecked);
        }
    };

    const handleAcceptAll = () => {
        if (isChecked) {
            navigation.navigate('EnterName');
        }
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#D6C5F6" />

            {/* Header with gradient background */}
            <LinearGradient
                colors={['#D6C5F6', '#E8DCF8', '#F3EDFB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.headerGradient}
            >
                {/* Back Button */}
                <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                    <MaterialIcons name="arrow-back-ios" size={22} color="#5B18B8" />
                </TouchableOpacity>

                {/* Shield Icon */}
                <View style={styles.shieldContainer}>
                    <View style={styles.shieldCircle}>
                        <MaterialIcons name="verified-user" size={width * 0.1} color="#5B18B8" />
                    </View>
                </View>
            </LinearGradient>

            {/* Body Content */}
            <View style={styles.bodyContainer}>
                {/* Title */}
                <Text style={styles.title}>Your Privacy Matters</Text>

                {/* Subtitle */}
                <Text style={styles.subtitle}>
                    We value your trust. Here is a quick summary of how we handle your data to provide a
                    better experience.
                </Text>

                {/* Scrollable Privacy Policy Text */}
                <View style={styles.scrollContainer}>
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled={true}
                    >
                        <Text style={styles.policyText}>{PRIVACY_POLICY_TEXT}</Text>
                    </ScrollView>

                    {/* Scroll hint indicator */}
                    {!hasScrolledToEnd && (
                        <View style={styles.scrollHint}>
                            <MaterialIcons name="keyboard-arrow-down" size={20} color="#5B18B8" />
                        </View>
                    )}
                </View>

                {/* Checkbox */}
                <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={handleCheckboxToggle}
                    activeOpacity={hasScrolledToEnd ? 0.7 : 1}
                >
                    <View
                        style={[
                            styles.checkbox,
                            isChecked && styles.checkboxChecked,
                            !hasScrolledToEnd && styles.checkboxDisabled,
                        ]}
                    >
                        {isChecked && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
                    </View>
                    <Text
                        style={[
                            styles.checkboxLabel,
                            !hasScrolledToEnd && styles.checkboxLabelDisabled,
                        ]}
                    >
                        I have read and agree to the{' '}
                        <Text style={styles.checkboxBold}>Privacy Policy</Text> and{' '}
                        <Text style={styles.checkboxBold}>Terms of Service</Text>.
                    </Text>
                </TouchableOpacity>

                {/* Accept All Button */}
                <View style={styles.buttonContainer}>
                    <LinearGradient
                        colors={isChecked ? ['#FFEA60', '#FEAA05'] : ['#E0E0E0', '#BDBDBD']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradientBorder}
                    >
                        <Pressable
                            style={({ pressed }) => [
                                styles.acceptButton,
                                !isChecked && styles.acceptButtonDisabled,
                                pressed && isChecked && styles.acceptButtonPressed,
                            ]}
                            onPress={handleAcceptAll}
                            disabled={!isChecked}
                        >
                            {({ pressed }) => (
                                <Text
                                    style={[
                                        styles.acceptButtonText,
                                        !isChecked && styles.acceptButtonTextDisabled,
                                        pressed && isChecked && styles.acceptButtonTextPressed,
                                    ]}
                                >
                                    Accept All
                                </Text>
                            )}
                        </Pressable>
                    </LinearGradient>
                </View>
            </View>
        </View>
    );
};

const createStyles = (width: number, height: number) => {
    const isSmallDevice = height < 700;
    const headerHeight = Math.max(height * 0.2, 140);

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: '#FFFFFF',
        },
        headerGradient: {
            height: headerHeight,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: Platform.OS === 'ios' ? 50 : 20,
        },
        backButton: {
            position: 'absolute',
            top: Platform.OS === 'ios' ? 50 : 20,
            left: 16,
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
        },
        shieldContainer: {
            alignItems: 'center',
            justifyContent: 'center',
        },
        shieldCircle: {
            width: width * 0.18,
            height: width * 0.18,
            borderRadius: (width * 0.18) / 2,
            backgroundColor: 'rgba(91, 24, 184, 0.08)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        bodyContainer: {
            flex: 1,
            paddingHorizontal: 24,
            paddingTop: isSmallDevice ? 16 : 24,
            paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        },
        title: {
            fontSize: isSmallDevice ? 22 : 26,
            fontWeight: '700',
            color: '#1A1A2E',
            fontFamily: 'Poppins-Bold',
            marginBottom: 8,
        },
        subtitle: {
            fontSize: isSmallDevice ? 13 : 14,
            color: '#6B7280',
            fontFamily: 'Poppins',
            lineHeight: isSmallDevice ? 19 : 21,
            marginBottom: isSmallDevice ? 12 : 18,
        },
        scrollContainer: {
            flex: 1,
            borderRadius: 12,
            backgroundColor: '#F9FAFB',
            borderWidth: 1,
            borderColor: '#E5E7EB',
            marginBottom: isSmallDevice ? 12 : 16,
            position: 'relative',
            overflow: 'hidden',
        },
        scrollView: {
            flex: 1,
        },
        scrollContent: {
            padding: 16,
            paddingBottom: 24,
        },
        policyText: {
            fontSize: isSmallDevice ? 13 : 14,
            color: '#374151',
            fontFamily: 'Poppins',
            lineHeight: isSmallDevice ? 20 : 22,
        },
        scrollHint: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 36,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(249, 250, 251, 0.9)',
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
        },
        checkboxRow: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: isSmallDevice ? 12 : 18,
            paddingRight: 8,
        },
        checkbox: {
            width: 22,
            height: 22,
            borderRadius: 4,
            borderWidth: 2,
            borderColor: '#D1D5DB',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 10,
            marginTop: 2,
        },
        checkboxChecked: {
            backgroundColor: '#5B18B8',
            borderColor: '#5B18B8',
        },
        checkboxDisabled: {
            opacity: 0.4,
        },
        checkboxLabel: {
            flex: 1,
            fontSize: isSmallDevice ? 12 : 13,
            color: '#374151',
            fontFamily: 'Poppins',
            lineHeight: isSmallDevice ? 18 : 20,
        },
        checkboxLabelDisabled: {
            opacity: 0.5,
        },
        checkboxBold: {
            fontWeight: '700',
            color: '#1A1A2E',
        },
        buttonContainer: {
            alignItems: 'center',
            paddingBottom: 4,
        },
        gradientBorder: {
            borderRadius: 50,
            padding: 4,
            width: width * 0.7,
            maxWidth: 300,
        },
        acceptButton: {
            backgroundColor: '#6D2CC8',
            borderRadius: 46,
            height: isSmallDevice ? 48 : 55,
            justifyContent: 'center',
            alignItems: 'center',
        },
        acceptButtonDisabled: {
            backgroundColor: '#9E9E9E',
        },
        acceptButtonPressed: {
            backgroundColor: '#8B4DD8',
        },
        acceptButtonText: {
            color: '#FFFFFF',
            fontSize: isSmallDevice ? 16 : 18,
            fontWeight: '600',
            fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        },
        acceptButtonTextDisabled: {
            color: '#E0E0E0',
        },
        acceptButtonTextPressed: {
            color: '#FEAA05',
        },
    });
};

export default PrivacyPolicyScreen;
