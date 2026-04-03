/**
 * Test Suite: ErrorModal Component
 * 
 * Tests for the ErrorModal component which displays error messages
 * with a retry option.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ErrorModal from '../../src/components/ErrorModal';

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

describe('ErrorModal', () => {
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
            const { getByText } = render(<ErrorModal {...defaultProps} />);
            expect(getByText('Error!')).toBeTruthy();
        });

        it('should display default error message when no custom message provided', () => {
            const { getByText } = render(<ErrorModal {...defaultProps} />);
            expect(getByText('Something went wrong while processing your request. Please try again.')).toBeTruthy();
        });

        it('should display custom error message when provided', () => {
            const customMessage = 'Custom error occurred';
            const { getByText } = render(
                <ErrorModal {...defaultProps} errorMessage={customMessage} />
            );
            expect(getByText(customMessage)).toBeTruthy();
        });

        it('should display Try Again button', () => {
            const { getByText } = render(<ErrorModal {...defaultProps} />);
            expect(getByText('Try Again')).toBeTruthy();
        });

        it('should have a transparent overlay', () => {
            const { UNSAFE_getByType } = render(<ErrorModal {...defaultProps} />);
            const Modal = require('react-native').Modal;
            const modal = UNSAFE_getByType(Modal);
            expect(modal.props.transparent).toBe(true);
        });

        it('should use fade animation type', () => {
            const { UNSAFE_getByType } = render(<ErrorModal {...defaultProps} />);
            const Modal = require('react-native').Modal;
            const modal = UNSAFE_getByType(Modal);
            expect(modal.props.animationType).toBe('fade');
        });

        it('should render the close icon', () => {
            const { UNSAFE_getAllByType } = render(<ErrorModal {...defaultProps} />);
            const icons = UNSAFE_getAllByType('Icon');
            expect(icons.length).toBeGreaterThan(0);
        });
    });

    describe('User Interactions', () => {
        it('should call onClose and onNavigateToCredentials when Try Again is pressed', () => {
            const onClose = jest.fn();
            const onNavigateToCredentials = jest.fn();

            const { getByText } = render(
                <ErrorModal
                    visible={true}
                    onClose={onClose}
                    onNavigateToCredentials={onNavigateToCredentials}
                />
            );

            fireEvent.press(getByText('Try Again'));

            expect(onClose).toHaveBeenCalledTimes(1);
            expect(onNavigateToCredentials).toHaveBeenCalledTimes(1);
        });

        it('should call handlers in correct order (onClose first, then onNavigateToCredentials)', () => {
            const callOrder: string[] = [];
            const onClose = jest.fn(() => callOrder.push('onClose'));
            const onNavigateToCredentials = jest.fn(() => callOrder.push('onNavigateToCredentials'));

            const { getByText } = render(
                <ErrorModal
                    visible={true}
                    onClose={onClose}
                    onNavigateToCredentials={onNavigateToCredentials}
                />
            );

            fireEvent.press(getByText('Try Again'));

            expect(callOrder).toEqual(['onClose', 'onNavigateToCredentials']);
        });
    });

    describe('Props', () => {
        it('should accept visible prop as true', () => {
            const { UNSAFE_getByType } = render(<ErrorModal {...defaultProps} visible={true} />);
            const Modal = require('react-native').Modal;
            const modal = UNSAFE_getByType(Modal);
            expect(modal.props.visible).toBe(true);
        });

        it('should accept visible prop as false', () => {
            const { UNSAFE_getByType } = render(<ErrorModal {...defaultProps} visible={false} />);
            const Modal = require('react-native').Modal;
            const modal = UNSAFE_getByType(Modal);
            expect(modal.props.visible).toBe(false);
        });

        it('should handle empty error message', () => {
            const { getByText } = render(
                <ErrorModal {...defaultProps} errorMessage="" />
            );
            // Should still render the Error! title
            expect(getByText('Error!')).toBeTruthy();
        });
    });

    describe('Visual Elements', () => {
        it('should render outer, middle, and inner circles for icon container', () => {
            const { UNSAFE_root } = render(<ErrorModal {...defaultProps} />);
            // The component renders multiple View elements for the circles
            const views = UNSAFE_root.findAllByType(require('react-native').View);
            expect(views.length).toBeGreaterThan(3); // At least overlay, container, icon container, circles
        });
    });
});
