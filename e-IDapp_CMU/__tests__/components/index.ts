/**
 * Components Test Suite Index
 * 
 * Entry point for running all component tests.
 * This file helps organize and document available component tests.
 */

// Modal Components
export * from './LoadingModal.test';
export * from './ErrorModal.test';
export * from './SuccessModal.test';
export * from './DeclineModal.test';

// Layout Components
export * from './SafeAreaScreen.test';

// Navigation Components
export * from './FloatingQRButton.test';

// QR Code Components
export * from './CustomQRCode.test';

/**
 * Test Coverage Summary:
 * 
 * 1. LoadingModal - Loading indicator with spinning animation
 *    - Rendering and visibility
 *    - Animation behavior
 *    - Props handling
 * 
 * 2. ErrorModal - Error display with retry option
 *    - Rendering and visibility
 *    - User interactions (Try Again button)
 *    - Custom error messages
 *    - Handler callbacks
 * 
 * 3. SuccessModal - Success confirmation display
 *    - Rendering and visibility
 *    - User interactions (Done button)
 *    - Handler callbacks
 * 
 * 4. DeclineModal - Decline confirmation display
 *    - Rendering and visibility
 *    - User interactions (Done button)
 *    - Custom messages
 *    - Handler callbacks
 * 
 * 5. SafeAreaScreen - Safe area wrapper component
 *    - Rendering with children
 *    - Scrollable mode
 *    - Custom edges and styles
 * 
 * 6. FloatingQRButton - Floating action button for QR scanning
 *    - Rendering and styling
 *    - Navigation behavior
 *    - Gradient and icon display
 * 
 * 7. CustomQRCode - QR code generator with compression
 *    - Rendering and props
 *    - QR code generation
 *    - Data compression for large payloads
 *    - Edge cases
 */
