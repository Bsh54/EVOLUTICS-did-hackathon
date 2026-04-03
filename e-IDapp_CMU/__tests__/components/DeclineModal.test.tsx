/**
 * Test Suite: DeclineModal Component
 * 
 * Tests for the DeclineModal component which displays decline confirmation
 * after a user declines a request.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DeclineModal from '../../src/components/DeclineModal';

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

describe('DeclineModal', () => {
    const defaultProps = {
        visible: true,
        onClose: jest.fn(),
        onNavigateToCredentials: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render correctly when visible', () => {
            const { getByText } = render(<DeclineModal {...defaultProps} />);
            expect(getByText('Declined')).toBeTruthy();
        });

        it('should display default decline message when no custom message provided', () => {
            const { getByText } = render(<DeclineModal {...defaultProps} />);
            expect(getByText('Request declined successfully.')).toBeTruthy();
        });

        it('should display custom error message when provided', () => {
            const customMessage = 'Custom decline message';
            const { getByText } = render(
                <DeclineModal {...defaultProps} errorMessage={customMessage} />
            );
            expect(getByText(customMessage)).toBeTruthy();
        });

        it('should display Done button', () => {
            const { getByText } = render(<DeclineModal {...defaultProps} />);
            expect(getByText('Done')).toBeTruthy();
        });

        it('should have a transparent overlay', () => {
            const { UNSAFE_getByType } = render(<DeclineModal {...defaultProps} />);
            const Modal = require('react-native').Modal;
            const modal = UNSAFE_getByType(Modal);
            expect(modal.props.transparent).toBe(true);
        });

        it('should use fade animation type', () => {
            const { UNSAFE_getByType } = render(<DeclineModal {...defaultProps} />);
            const Modal = require('react-native').Modal;
            const modal = UNSAFE_getByType(Modal);
            expect(modal.props.animationType).toBe('fade');
        });

        it('should render the close icon', () => {
            const { UNSAFE_getAllByType } = render(<DeclineModal {...defaultProps} />);
            const icons = UNSAFE_getAllByType('Icon');
            expect(icons.length).toBeGreaterThan(0);
        });
    });

    describe('User Interactions', () => {
        it('should call onClose and onNavigateToCredentials when Done is pressed', () => {
            const onClose = jest.fn();
            const onNavigateToCredentials = jest.fn();

            const { getByText } = render(
                <DeclineModal
                    visible={true}
                    onClose={onClose}
                    onNavigateToCredentials={onNavigateToCredentials}
                />
            );

            fireEvent.press(getByText('Done'));

            expect(onClose).toHaveBeenCalledTimes(1);
            expect(onNavigateToCredentials).toHaveBeenCalledTimes(1);
        });

        it('should call handlers in correct order (onClose first, then onNavigateToCredentials)', () => {
            const callOrder: string[] = [];
            const onClose = jest.fn(() => callOrder.push('onClose'));
            const onNavigateToCredentials = jest.fn(() => callOrder.push('onNavigateToCredentials'));

            const { getByText } = render(
                <DeclineModal
                    visible={true}
                    onClose={onClose}
                    onNavigateToCredentials={onNavigateToCredentials}
                />
            );

            fireEvent.press(getByText('Done'));

            expect(callOrder).toEqual(['onClose', 'onNavigateToCredentials']);
        });
    });

    describe('Props', () => {
        it('should accept visible prop as true', () => {
            const { UNSAFE_getByType } = render(<DeclineModal {...defaultProps} visible={true} />);
            const Modal = require('react-native').Modal;
            const modal = UNSAFE_getByType(Modal);
            expect(modal.props.visible).toBe(true);
        });

        it('should accept visible prop as false', () => {
            const { UNSAFE_getByType } = render(<DeclineModal {...defaultProps} visible={false} />);
            const Modal = require('react-native').Modal;
            const modal = UNSAFE_getByType(Modal);
            expect(modal.props.visible).toBe(false);
        });

        it('should handle empty error message', () => {
            const { getByText } = render(
                <DeclineModal {...defaultProps} errorMessage="" />
            );
            // Should still render the Declined title
            expect(getByText('Declined')).toBeTruthy();
        });
    });

    describe('Visual Elements', () => {
        it('should render outer, middle, and inner circles for icon container', () => {
            const { UNSAFE_root } = render(<DeclineModal {...defaultProps} />);
            const views = UNSAFE_root.findAllByType(require('react-native').View);
            expect(views.length).toBeGreaterThan(3);
        });
    });

    describe('onRequestClose', () => {
        it('should have onRequestClose handler set to onClose', () => {
            const onClose = jest.fn();
            const { UNSAFE_getByType } = render(
                <DeclineModal {...defaultProps} onClose={onClose} />
            );
            const Modal = require('react-native').Modal;
            const modal = UNSAFE_getByType(Modal);

            // Simulate Android back button
            modal.props.onRequestClose();

            expect(onClose).toHaveBeenCalled();
        });
    });
});
