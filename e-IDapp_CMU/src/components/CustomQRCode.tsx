import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, G } from 'react-native-svg';
import QRCodeGenerator from 'qrcode';
import pako from 'pako';

interface CustomQRCodeProps {
    value: string;
    size: number;
    color?: string;
    backgroundColor?: string;
}

const CustomQRCode: React.FC<CustomQRCodeProps> = ({
    value,
    size,
    color = '#000000',
    backgroundColor = '#FFFFFF'
}) => {
    const [qrMatrix, setQrMatrix] = useState<number[][]>([]);
    const [matrixSize, setMatrixSize] = useState(0);

    useEffect(() => {
        generateQRMatrix();
    }, [value]);

    const generateQRMatrix = () => {
        try {
            // Compress data if it's too large
            let dataToEncode = value;

            // Check if data is too large (> 1000 chars suggests it has base64 image)
            if (value.length > 1000) {
                try {
                    // Compress using gzip
                    const compressed = pako.deflate(value, { level: 9 });
                    // Convert to base64
                    const base64Compressed = btoa(
                        String.fromCharCode.apply(null, Array.from(compressed))
                    );
                    dataToEncode = `COMPRESSED:${base64Compressed}`;
                    console.log(`📦 Compressed: ${value.length} → ${dataToEncode.length} bytes`);
                } catch (compressionError) {
                    console.warn('Compression failed, using original data:', compressionError);
                }
            }

            // Generate QR code using qrcode library with lowest error correction for max capacity
            const segments = QRCodeGenerator.create(dataToEncode, {
                errorCorrectionLevel: 'L', // Low error correction = maximum data capacity
            });

            // Convert QR segments to matrix
            const modules = segments.modules;
            const size = modules.size;
            const matrix: number[][] = [];

            for (let row = 0; row < size; row++) {
                const rowData: number[] = [];
                for (let col = 0; col < size; col++) {
                    // Get module value (true = black, false = white)
                    rowData.push(modules.get(row, col) ? 1 : 0);
                }
                matrix.push(rowData);
            }

            setQrMatrix(matrix);
            setMatrixSize(size);
        } catch (error) {
            console.error('QR Code generation error:', error);
            // If still too big, show error in console
            if (error instanceof Error && error.message.includes('too big')) {
                console.error('❌ Data is still too large even after compression. Consider reducing image quality or using reference-based approach.');
            }
        }
    };

    if (!qrMatrix.length || !matrixSize) {
        return <View style={{ width: size, height: size, backgroundColor }} />;
    }

    const moduleSize = size / matrixSize;
    const quietZone = moduleSize * 2; // 2 modules quiet zone
    const totalSize = size + (quietZone * 2);

    return (
        <View style={[styles.container, { width: totalSize, height: totalSize }]}>
            <Svg width={totalSize} height={totalSize}>
                {/* Background */}
                <Rect
                    x={0}
                    y={0}
                    width={totalSize}
                    height={totalSize}
                    fill={backgroundColor}
                />

                {/* QR Code modules */}
                <G x={quietZone} y={quietZone}>
                    {qrMatrix.map((row, rowIndex) =>
                        row.map((cell, colIndex) => {
                            if (cell === 1) {
                                return (
                                    <Rect
                                        key={`${rowIndex}-${colIndex}`}
                                        x={colIndex * moduleSize}
                                        y={rowIndex * moduleSize}
                                        width={moduleSize}
                                        height={moduleSize}
                                        fill={color}
                                    />
                                );
                            }
                            return null;
                        })
                    )}
                </G>
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default CustomQRCode;
