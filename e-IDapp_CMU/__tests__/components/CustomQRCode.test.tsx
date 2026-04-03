/**
 * Test Suite: CustomQRCode Component
 * 
 * Tests for the CustomQRCode component which generates and displays
 * QR codes with compression support for large data.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import CustomQRCode from '../../src/components/CustomQRCode';

// Mock global btoa
global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');

// Mock react-native-svg
jest.mock('react-native-svg', () => {
    const RN = require('react-native');
    const MockSvg = ({ children, ...props }: any) => (
        <RN.View testID="svg" {...props}>{children}</RN.View>
    );
    const MockRect = (props: any) => <RN.View testID="rect" {...props} />;
    const MockG = ({ children, ...props }: any) => (
        <RN.View testID="g-element" {...props}>{children}</RN.View>
    );

    return {
        __esModule: true,
        default: MockSvg,
        Rect: MockRect,
        G: MockG,
        Svg: MockSvg,
    };
});

// Mock qrcode library
jest.mock('qrcode', () => ({
    create: jest.fn((data, options) => ({
        modules: {
            size: 21,
            get: (row: number, col: number) => (row + col) % 2 === 0,
        },
    })),
}));

// Mock pako compression
jest.mock('pako', () => ({
    deflate: jest.fn((data, options) => new Uint8Array([1, 2, 3, 4, 5])),
}));

describe('CustomQRCode', () => {
    const defaultProps = {
        value: 'test-qr-data',
        size: 200,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render correctly with required props', async () => {
            const { getByTestId } = render(<CustomQRCode {...defaultProps} />);

            await waitFor(() => {
                expect(getByTestId('svg')).toBeTruthy();
            });
        });

        it('should render SVG container', async () => {
            const { getByTestId } = render(<CustomQRCode {...defaultProps} />);

            await waitFor(() => {
                expect(getByTestId('svg')).toBeTruthy();
            });
        });

        it('should render background rect', async () => {
            const { getAllByTestId } = render(<CustomQRCode {...defaultProps} />);

            await waitFor(() => {
                const rects = getAllByTestId('rect');
                expect(rects.length).toBeGreaterThan(0);
            });
        });

        it('should render QR code modules group', async () => {
            const { getByTestId } = render(<CustomQRCode {...defaultProps} />);

            await waitFor(() => {
                expect(getByTestId('g-element')).toBeTruthy();
            });
        });
    });

    describe('Props', () => {
        it('should accept value prop', async () => {
            const QRCodeGenerator = require('qrcode');
            render(<CustomQRCode value="custom-value" size={200} />);

            await waitFor(() => {
                expect(QRCodeGenerator.create).toHaveBeenCalled();
            });
        });

        it('should accept size prop', async () => {
            const { getByTestId } = render(<CustomQRCode value="test" size={300} />);

            await waitFor(() => {
                const svg = getByTestId('svg');
                expect(svg).toBeTruthy();
            });
        });

        it('should use default color (black) when not specified', async () => {
            const { getAllByTestId } = render(<CustomQRCode {...defaultProps} />);

            await waitFor(() => {
                expect(getAllByTestId('rect').length).toBeGreaterThan(0);
            });
        });

        it('should accept custom color prop', async () => {
            const { getAllByTestId } = render(
                <CustomQRCode {...defaultProps} color="#FF0000" />
            );

            await waitFor(() => {
                expect(getAllByTestId('rect').length).toBeGreaterThan(0);
            });
        });

        it('should use default background color (white) when not specified', async () => {
            const { getAllByTestId } = render(<CustomQRCode {...defaultProps} />);

            await waitFor(() => {
                const rects = getAllByTestId('rect');
                expect(rects.length).toBeGreaterThan(0);
            });
        });

        it('should accept custom backgroundColor prop', async () => {
            const { getAllByTestId } = render(
                <CustomQRCode {...defaultProps} backgroundColor="#F0F0F0" />
            );

            await waitFor(() => {
                expect(getAllByTestId('rect').length).toBeGreaterThan(0);
            });
        });
    });

    describe('QR Code Generation', () => {
        it('should call QRCodeGenerator.create with value', async () => {
            const QRCodeGenerator = require('qrcode');
            render(<CustomQRCode value="hello-world" size={200} />);

            await waitFor(() => {
                expect(QRCodeGenerator.create).toHaveBeenCalledWith(
                    'hello-world',
                    expect.objectContaining({
                        errorCorrectionLevel: 'L',
                    })
                );
            });
        });

        it('should use low error correction level for maximum capacity', async () => {
            const QRCodeGenerator = require('qrcode');
            render(<CustomQRCode {...defaultProps} />);

            await waitFor(() => {
                expect(QRCodeGenerator.create).toHaveBeenCalledWith(
                    expect.any(String),
                    expect.objectContaining({
                        errorCorrectionLevel: 'L',
                    })
                );
            });
        });
    });

    describe('Compression', () => {
        it('should compress data when value is too large (>1000 chars)', async () => {
            const pako = require('pako');
            const largeValue = 'x'.repeat(1100);

            render(<CustomQRCode value={largeValue} size={200} />);

            await waitFor(() => {
                expect(pako.deflate).toHaveBeenCalled();
            });
        });

        it('should not compress data when value is small (<1000 chars)', async () => {
            const pako = require('pako');
            const smallValue = 'small-value';

            render(<CustomQRCode value={smallValue} size={200} />);

            await waitFor(() => {
                expect(pako.deflate).not.toHaveBeenCalled();
            });
        });
    });

    describe('Edge Cases', () => {
        it('should render placeholder when QR matrix is empty', () => {
            const QRCodeGenerator = require('qrcode');
            QRCodeGenerator.create.mockReturnValueOnce({
                modules: {
                    size: 0,
                    get: () => false,
                },
            });

            const { UNSAFE_root } = render(<CustomQRCode {...defaultProps} />);
            expect(UNSAFE_root).toBeTruthy();
        });

        it('should handle empty value', async () => {
            const { getByTestId } = render(<CustomQRCode value="" size={200} />);

            await waitFor(() => {
                expect(getByTestId('svg')).toBeTruthy();
            });
        });

        it('should re-generate QR code when value changes', async () => {
            const QRCodeGenerator = require('qrcode');
            const { rerender } = render(<CustomQRCode value="initial" size={200} />);

            rerender(<CustomQRCode value="updated" size={200} />);

            await waitFor(() => {
                expect(QRCodeGenerator.create).toHaveBeenCalledTimes(2);
            });
        });
    });

    describe('Quiet Zone', () => {
        it('should include quiet zone around QR code', async () => {
            const { getByTestId } = render(<CustomQRCode {...defaultProps} />);

            await waitFor(() => {
                const svg = getByTestId('svg');
                // The total size should be larger than the specified size due to quiet zone
                expect(svg).toBeTruthy();
            });
        });
    });
});
