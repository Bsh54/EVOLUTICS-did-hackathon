/**
 * Test Suite: SafeAreaScreen Component
 * 
 * Tests for the SafeAreaScreen component which provides a reusable wrapper
 * for safe area handling across screens.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import SafeAreaScreen from '../../src/components/SafeAreaScreen';

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
    const RN = require('react-native');
    return {
        SafeAreaView: ({ children, edges, style }: any) => (
            <RN.View testID="safe-area-view" style={style} edges={edges}>
                {children}
            </RN.View>
        ),
        Edge: {},
    };
});

describe('SafeAreaScreen', () => {
    describe('Rendering', () => {
        it('should render children correctly', () => {
            const { getByText } = render(
                <SafeAreaScreen>
                    <Text>Test Content</Text>
                </SafeAreaScreen>
            );
            expect(getByText('Test Content')).toBeTruthy();
        });

        it('should render multiple children', () => {
            const { getByText } = render(
                <SafeAreaScreen>
                    <Text>First Child</Text>
                    <Text>Second Child</Text>
                </SafeAreaScreen>
            );
            expect(getByText('First Child')).toBeTruthy();
            expect(getByText('Second Child')).toBeTruthy();
        });

        it('should render nested components', () => {
            const { getByText } = render(
                <SafeAreaScreen>
                    <View>
                        <Text>Nested Text</Text>
                    </View>
                </SafeAreaScreen>
            );
            expect(getByText('Nested Text')).toBeTruthy();
        });
    });

    describe('Scrollable Mode', () => {
        it('should not render ScrollView by default', () => {
            const { queryByTestId, UNSAFE_queryByType } = render(
                <SafeAreaScreen>
                    <Text>Content</Text>
                </SafeAreaScreen>
            );
            const ScrollView = require('react-native').ScrollView;
            expect(UNSAFE_queryByType(ScrollView)).toBeNull();
        });

        it('should render ScrollView when scrollable is true', () => {
            const { UNSAFE_getByType } = render(
                <SafeAreaScreen scrollable={true}>
                    <Text>Scrollable Content</Text>
                </SafeAreaScreen>
            );
            const ScrollView = require('react-native').ScrollView;
            expect(UNSAFE_getByType(ScrollView)).toBeTruthy();
        });

        it('should render children inside ScrollView when scrollable', () => {
            const { getByText } = render(
                <SafeAreaScreen scrollable={true}>
                    <Text>Scrollable Content</Text>
                </SafeAreaScreen>
            );
            expect(getByText('Scrollable Content')).toBeTruthy();
        });

        it('should hide vertical scroll indicator by default', () => {
            const { UNSAFE_getByType } = render(
                <SafeAreaScreen scrollable={true}>
                    <Text>Content</Text>
                </SafeAreaScreen>
            );
            const ScrollView = require('react-native').ScrollView;
            const scrollView = UNSAFE_getByType(ScrollView);
            expect(scrollView.props.showsVerticalScrollIndicator).toBe(false);
        });

        it('should show vertical scroll indicator when specified', () => {
            const { UNSAFE_getByType } = render(
                <SafeAreaScreen scrollable={true} showsVerticalScrollIndicator={true}>
                    <Text>Content</Text>
                </SafeAreaScreen>
            );
            const ScrollView = require('react-native').ScrollView;
            const scrollView = UNSAFE_getByType(ScrollView);
            expect(scrollView.props.showsVerticalScrollIndicator).toBe(true);
        });

        it('should have keyboardShouldPersistTaps set to handled', () => {
            const { UNSAFE_getByType } = render(
                <SafeAreaScreen scrollable={true}>
                    <Text>Content</Text>
                </SafeAreaScreen>
            );
            const ScrollView = require('react-native').ScrollView;
            const scrollView = UNSAFE_getByType(ScrollView);
            expect(scrollView.props.keyboardShouldPersistTaps).toBe('handled');
        });
    });

    describe('Props', () => {
        it('should use default edges (top, bottom) when not specified', () => {
            const { getByTestId } = render(
                <SafeAreaScreen>
                    <Text>Content</Text>
                </SafeAreaScreen>
            );
            const safeAreaView = getByTestId('safe-area-view');
            expect(safeAreaView.props.edges).toEqual(['top', 'bottom']);
        });

        it('should accept custom edges', () => {
            const { getByTestId } = render(
                <SafeAreaScreen edges={['top']}>
                    <Text>Content</Text>
                </SafeAreaScreen>
            );
            const safeAreaView = getByTestId('safe-area-view');
            expect(safeAreaView.props.edges).toEqual(['top']);
        });

        it('should accept custom style', () => {
            const customStyle = { backgroundColor: 'red' };
            const { getByTestId } = render(
                <SafeAreaScreen style={customStyle}>
                    <Text>Content</Text>
                </SafeAreaScreen>
            );
            const safeAreaView = getByTestId('safe-area-view');
            expect(safeAreaView.props.style).toContainEqual(customStyle);
        });

        it('should accept contentContainerStyle for ScrollView', () => {
            const customStyle = { padding: 20 };
            const { UNSAFE_getByType } = render(
                <SafeAreaScreen scrollable={true} contentContainerStyle={customStyle}>
                    <Text>Content</Text>
                </SafeAreaScreen>
            );
            const ScrollView = require('react-native').ScrollView;
            const scrollView = UNSAFE_getByType(ScrollView);
            expect(scrollView.props.contentContainerStyle).toContainEqual(customStyle);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty children', () => {
            const { getByTestId } = render(
                <SafeAreaScreen>
                    {null}
                </SafeAreaScreen>
            );
            expect(getByTestId('safe-area-view')).toBeTruthy();
        });

        it('should handle all edge values', () => {
            const { getByTestId } = render(
                <SafeAreaScreen edges={['top', 'bottom', 'left', 'right']}>
                    <Text>Content</Text>
                </SafeAreaScreen>
            );
            const safeAreaView = getByTestId('safe-area-view');
            expect(safeAreaView.props.edges).toEqual(['top', 'bottom', 'left', 'right']);
        });
    });
});
