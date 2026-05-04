/**
 * Test Suite: SuccessModal Component
 * 
 * Tests for the SuccessModal component which displays success messages
 * after successful operations like credential acceptance.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SuccessModal from '../../src/components/SuccessModal';

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

describe('SuccessModal', () => {
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
            const { getByText } = render(<SuccessModal {...defaultProps} />);
            expect(getByText('Success!')).toBeTruthy();
        });

        it('should display success message', () => {
            const { getByText } = render(<SuccessModal {...defaultProps} />);
            expect(getByText('Your credentials have been successfully added to your list.')).toBeTruthy();
        });

        it('should display Done button', () => {
            const { getByText } = render(<SuccessModal {...defaultProps} />);
            expect(getByText('Done')).toBeTruthy();
        });

        it('should have a transparent overlay', () => {
            const { UNSAFE_getByType } = render(<SuccessModal {...defaultProps} />);
            const Modal = require('react-native').Modal;
            const modal = UNSAFE_getByType(Modal);
            expect(modal.props.transparent).toBe(true);
        });

        it('should use fade animation type', () => {
            const { UNSAFE_getByType } = render(<SuccessModal {...defaultProps} />);
            const Modal = require('react-native').Modal;
            const modal = UNSAFE_getByType(Modal);
            expect(modal.props.animationType).toBe('fade');
        });

        it('should render the check icon', () => {
            const { UNSAFE_getAllByType } = render(<SuccessModal {...defaultProps} />);
            const icons = UNSAFE_getAllByType('Icon');
            expect(icons.length).toBeGreaterThan(0);
        });
    });

    describe('User Interactions', () => {
        it('should call onClose and onNavigateToCredentials when Done is pressed', () => {
            const onClose = jest.fn();
            const onNavigateToCredentials = jest.fn();

            const { getByText } = render(
                <SuccessModal
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
                <SuccessModal
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
            const { UNSAFE_getByType } = render(<SuccessModal {...defaultProps} visible={true} />);
            const Modal = require('react-native').Modal;
            const modal = UNSAFE_getByType(Modal);
            expect(modal.props.visible).toBe(true);
        });

        it('should accept visible prop as false', () => {
            const { UNSAFE_getByType } = render(<SuccessModal {...defaultProps} visible={false} />);
            const Modal = require('react-native').Modal;
            const modal = UNSAFE_getByType(Modal);
            expect(modal.props.visible).toBe(false);
        });
    });

    describe('Visual Elements', () => {
        it('should render gradient circles for success icon', () => {
            const { UNSAFE_root } = render(<SuccessModal {...defaultProps} />);
            const views = UNSAFE_root.findAllByType(require('react-native').View);
            // Should have multiple views for overlay, container, icon container, and circles
            expect(views.length).toBeGreaterThan(3);
        });
    });

    describe('onRequestClose', () => {
        it('should have onRequestClose handler set to onClose', () => {
            const onClose = jest.fn();
            const { UNSAFE_getByType } = render(
                <SuccessModal {...defaultProps} onClose={onClose} />
            );
            const Modal = require('react-native').Modal;
            const modal = UNSAFE_getByType(Modal);

            // Simulate Android back button
            modal.props.onRequestClose();

            expect(onClose).toHaveBeenCalled();
        });
    });
});
