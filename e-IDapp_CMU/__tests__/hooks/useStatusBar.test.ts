import { renderHook } from '@testing-library/react-native';
import { StatusBar, Platform } from 'react-native';
import { useStatusBar, STATUS_BAR_COLORS } from '../../src/hooks/useStatusBar';

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => ({
    useFocusEffect: jest.fn((callback) => callback()),
}));

// Mock StatusBar
jest.spyOn(StatusBar, 'setBarStyle');
jest.spyOn(StatusBar, 'setBackgroundColor');
jest.spyOn(StatusBar, 'setTranslucent');

describe('useStatusBar', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should set status bar style and color with default options', () => {
        renderHook(() => useStatusBar());

        expect(StatusBar.setBarStyle).toHaveBeenCalledWith(STATUS_BAR_COLORS.light.barStyle);

        if (Platform.OS === 'android') {
            expect(StatusBar.setBackgroundColor).toHaveBeenCalledWith(STATUS_BAR_COLORS.light.backgroundColor, true);
            expect(StatusBar.setTranslucent).toHaveBeenCalledWith(false);
        }
    });

    it('should set status bar style and color with custom options', () => {
        const customOptions = {
            barStyle: 'dark-content' as const,
            backgroundColor: '#FF0000',
            translucent: true,
        };

        renderHook(() => useStatusBar(customOptions));

        expect(StatusBar.setBarStyle).toHaveBeenCalledWith('dark-content');

        if (Platform.OS === 'android') {
            expect(StatusBar.setBackgroundColor).toHaveBeenCalledWith('#FF0000', true);
            expect(StatusBar.setTranslucent).toHaveBeenCalledWith(true);
        }
    });

    it('should work with predefined status bar colors', () => {
        renderHook(() => useStatusBar(STATUS_BAR_COLORS.purple));

        expect(StatusBar.setBarStyle).toHaveBeenCalledWith(STATUS_BAR_COLORS.purple.barStyle);

        if (Platform.OS === 'android') {
            expect(StatusBar.setBackgroundColor).toHaveBeenCalledWith(STATUS_BAR_COLORS.purple.backgroundColor, true);
        }
    });
});
