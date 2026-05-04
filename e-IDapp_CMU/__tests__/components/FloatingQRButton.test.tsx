/**
 * Test Suite: FloatingQRButton Component
 * 
 * Tests for the FloatingQRButton component which provides a floating action button
 * for QR code scanning functionality.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FloatingQRButton from '../../src/components/FloatingQRButton';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock react-native-linear-gradient
jest.mock('react-native-linear-gradient', () => {
    const RN = require('react-native');
    return ({ children, style, ...props }: any) => (
        <RN.View testID="linear-gradient" style={style} {...props}>
            {children}
        </RN.View>
    );
});

describe('FloatingQRButton', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render correctly', () => {
            const { UNSAFE_root } = render(<FloatingQRButton />);
            expect(UNSAFE_root).toBeTruthy();
        });

        it('should render the QR scanner icon', () => {
            const { UNSAFE_getAllByType } = render(<FloatingQRButton />);
            const icons = UNSAFE_getAllByType('Icon');
            expect(icons.length).toBeGreaterThan(0);
        });

        it('should render linear gradient wrapper', () => {
            const { getByTestId } = render(<FloatingQRButton />);
            expect(getByTestId('linear-gradient')).toBeTruthy();
        });

        it('should render TouchableOpacity for button interaction', () => {
            const { UNSAFE_getByType } = render(<FloatingQRButton />);
            const TouchableOpacity = require('react-native').TouchableOpacity;
            expect(UNSAFE_getByType(TouchableOpacity)).toBeTruthy();
        });
    });

    describe('Navigation', () => {
        it('should navigate to Scan QR screen when pressed', () => {
            const { UNSAFE_getByType } = render(<FloatingQRButton />);
            const TouchableOpacity = require('react-native').TouchableOpacity;
            const button = UNSAFE_getByType(TouchableOpacity);

            fireEvent.press(button);

            expect(mockNavigate).toHaveBeenCalledWith('Scan QR');
        });

        it('should call navigate only once per press', () => {
            const { UNSAFE_getByType } = render(<FloatingQRButton />);
            const TouchableOpacity = require('react-native').TouchableOpacity;
            const button = UNSAFE_getByType(TouchableOpacity);

            fireEvent.press(button);

            expect(mockNavigate).toHaveBeenCalledTimes(1);
        });
    });

    describe('Styling', () => {
        it('should have absolute positioning for floating behavior', () => {
            const { UNSAFE_root } = render(<FloatingQRButton />);
            const View = require('react-native').View;
            const views = UNSAFE_root.findAllByType(View);

            // The container should have position: absolute
            const containerView = views.find((v: any) =>
                v.props.style?.position === 'absolute' ||
                (Array.isArray(v.props.style) && v.props.style.some((s: any) => s?.position === 'absolute'))
            );
            expect(containerView).toBeTruthy();
        });

        it('should have high zIndex for overlay visibility', () => {
            const { UNSAFE_root } = render(<FloatingQRButton />);
            const View = require('react-native').View;
            const views = UNSAFE_root.findAllByType(View);

            // The container should have high zIndex
            const hasHighZIndex = views.some((v: any) => {
                const style = v.props.style;
                if (!style) return false;
                if (Array.isArray(style)) {
                    return style.some((s: any) => s?.zIndex >= 999);
                }
                return style.zIndex >= 999;
            });
            expect(hasHighZIndex).toBe(true);
        });

        it('should have activeOpacity set for touch feedback', () => {
            const { UNSAFE_getByType } = render(<FloatingQRButton />);
            const TouchableOpacity = require('react-native').TouchableOpacity;
            const button = UNSAFE_getByType(TouchableOpacity);
            expect(button.props.activeOpacity).toBe(0.8);
        });
    });

    describe('Gradient', () => {
        it('should have gradient colors for visual appeal', () => {
            const { getByTestId } = render(<FloatingQRButton />);
            const gradient = getByTestId('linear-gradient');
            // The gradient should have colors prop
            expect(gradient.props.colors).toEqual(['#FFEA60', '#FEAA05']);
        });

        it('should have gradient start and end points', () => {
            const { getByTestId } = render(<FloatingQRButton />);
            const gradient = getByTestId('linear-gradient');
            expect(gradient.props.start).toEqual({ x: 0, y: 0 });
            expect(gradient.props.end).toEqual({ x: 1, y: 1 });
        });
    });

    describe('Icon', () => {
        it('should render qr-code-scanner icon', () => {
            const { UNSAFE_getAllByType } = render(<FloatingQRButton />);
            const icons = UNSAFE_getAllByType('Icon');
            const qrIcon = icons.find((icon: any) => icon.props.name === 'qr-code-scanner');
            expect(qrIcon).toBeTruthy();
        });

        it('should have white color for the icon', () => {
            const { UNSAFE_getAllByType } = render(<FloatingQRButton />);
            const icons = UNSAFE_getAllByType('Icon');
            const qrIcon = icons.find((icon: any) => icon.props.name === 'qr-code-scanner');
            expect(qrIcon?.props.color).toBe('#FFFFFF');
        });
    });
});
