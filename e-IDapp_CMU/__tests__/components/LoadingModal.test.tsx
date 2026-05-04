/**
 * Test Suite: LoadingModal Component
 * 
 * Tests for the LoadingModal component which displays a loading indicator
 * with a spinning animation when visible.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import LoadingModal from '../../src/components/LoadingModal';

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock Animated API
jest.mock('react-native', () => {
    const RN = jest.requireActual('react-native');
    RN.Animated.loop = jest.fn((animation) => ({
        start: jest.fn(),
        stop: jest.fn(),
    }));
    RN.Animated.timing = jest.fn(() => ({
        start: jest.fn(),
        stop: jest.fn(),
    }));
    return RN;
});

describe('LoadingModal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render correctly when visible', () => {
            const { getByText } = render(<LoadingModal visible={true} />);
            expect(getByText('Please wait...')).toBeTruthy();
        });

        it('should not render content when not visible', () => {
            const { queryByText } = render(<LoadingModal visible={false} />);
            // When modal is not visible, its content is not rendered in the DOM
            // React Native Modal component doesn't render children when visible is false
            expect(queryByText('Please wait...')).toBeNull();
        });

        it('should display the loading text', () => {
            const { getByText } = render(<LoadingModal visible={true} />);
            expect(getByText('Please wait...')).toBeTruthy();
        });

        it('should have a transparent overlay', () => {
            const { UNSAFE_getByType } = render(<LoadingModal visible={true} />);
            // The Modal should be transparent
            const Modal = require('react-native').Modal;
            const modal = UNSAFE_getByType(Modal);
            expect(modal.props.transparent).toBe(true);
        });

        it('should use fade animation type', () => {
            const { UNSAFE_getByType } = render(<LoadingModal visible={true} />);
            const Modal = require('react-native').Modal;
            const modal = UNSAFE_getByType(Modal);
            expect(modal.props.animationType).toBe('fade');
        });
    });

    describe('Accessibility', () => {
        it('should render the refresh icon for loading indicator', () => {
            const { UNSAFE_getAllByType } = render(<LoadingModal visible={true} />);
            const icons = UNSAFE_getAllByType('Icon');
            expect(icons.length).toBeGreaterThan(0);
        });
    });

    describe('Props', () => {
        it('should accept visible prop as true', () => {
            const { UNSAFE_getByType } = render(<LoadingModal visible={true} />);
            const Modal = require('react-native').Modal;
            const modal = UNSAFE_getByType(Modal);
            expect(modal.props.visible).toBe(true);
        });

        it('should accept visible prop as false', () => {
            const { UNSAFE_getByType } = render(<LoadingModal visible={false} />);
            const Modal = require('react-native').Modal;
            const modal = UNSAFE_getByType(Modal);
            expect(modal.props.visible).toBe(false);
        });
    });

    describe('Animation', () => {
        it('should render animated view for spinning effect', () => {
            const { UNSAFE_getAllByType } = render(<LoadingModal visible={true} />);
            const Animated = require('react-native').Animated;
            const animatedViews = UNSAFE_getAllByType(Animated.View);
            expect(animatedViews.length).toBeGreaterThan(0);
        });
    });
});
