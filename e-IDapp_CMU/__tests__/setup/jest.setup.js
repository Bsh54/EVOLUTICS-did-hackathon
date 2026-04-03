import 'reflect-metadata';
import '@testing-library/jest-native/extend-expect';

// 1. Mock Reanimated (Essential for navigation and animations)
jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock');
    Reanimated.default.call = () => { };
    return Reanimated;
});

// 1a. Mock Gesture Handler
jest.mock('react-native-gesture-handler', () => {
    return {
        State: {},
        PanGestureHandler: 'PanGestureHandler',
        BaseButton: 'BaseButton',
        RectButton: 'RectButton',
        BorderlessButton: 'BorderlessButton',
        Directions: {},
    };
});

// 1b. Mock Safe Area Context
jest.mock('react-native-safe-area-context', () => {
    const inset = { top: 0, right: 0, bottom: 0, left: 0 };
    return {
        SafeAreaProvider: ({ children }) => children,
        SafeAreaView: ({ children }) => <>{children}</>,
        useSafeAreaInsets: () => inset,
        useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
    };
});

// 2. Mock NativeAnimatedHelper - Removed as it's not present/needed in this RN version

// 3. Mock React Navigation (Global mock to avoid repeating in every test)
const mockedNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
    const actualNav = jest.requireActual('@react-navigation/native');
    return {
        ...actualNav,
        useNavigation: jest.fn(() => ({
            navigate: mockedNavigate,
            goBack: jest.fn(),
            addListener: jest.fn(),
            removeListener: jest.fn(),
            setOptions: jest.fn(),
            dispatch: jest.fn(),
            canGoBack: jest.fn(() => true),
            reset: jest.fn(),
            isFocused: jest.fn(() => true),
        })),
        useRoute: jest.fn(() => ({
            params: {},
            key: 'test-route',
            name: 'TestRoute',
        })),
        useFocusEffect: jest.fn(),
        useIsFocused: jest.fn(() => true),
    };
});

// 4. Mock Redux (Global mock for state management)
jest.mock('react-redux', () => ({
    useSelector: jest.fn().mockImplementation((selector) => {
        const mockState = {
            user: {
                isAuthenticated: false,
                name: '',
                did: 'did:poly:test:123456789',
                qrCodeData: JSON.stringify({ name: 'Test User', id: '123', faceImage: true }),
                profile: { name: 'Test User', profileImage: 'https://example.com/image.png' }
            },
            credentials: { list: [] },
            connections: { list: [] },
            proofRequests: { list: [] },
        };
        if (typeof selector === 'function') {
            try {
                return selector(mockState);
            } catch (e) {
                return undefined;
            }
        }
        return mockState;
    }),
    useDispatch: () => jest.fn(),
    Provider: ({ children }) => children,
    connect: () => (Component) => Component,
}));

// 5. Mock Native Modules that are frequent causes of failure
jest.mock('react-native-permissions', () => require('../mocks/react-native-permissions.js'));
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vision-camera', () => require('../mocks/react-native-vision-camera.js'));
jest.mock('@react-native-clipboard/clipboard', () => ({ setString: jest.fn(), getString: jest.fn() }));
jest.mock('react-native/Libraries/Share/Share', () => ({ share: jest.fn() }));

// 6. Mock WatermelonDB (Database)
jest.mock('@nozbe/watermelondb/Database');

// 7. Mock BackHandler
jest.mock('react-native/Libraries/Utilities/BackHandler', () => ({
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    removeEventListener: jest.fn(),
    exitApp: jest.fn(),
}));

// 8. Mock InteractionManager
jest.mock('react-native/Libraries/Interaction/InteractionManager', () => ({
    runAfterInteractions: jest.fn((cb) => { cb(); return { cancel: jest.fn() }; }),
    createInteractionHandle: jest.fn(),
    clearInteractionHandle: jest.fn(),
    addListener: jest.fn(),
}));

// 8. Silent console logs/errors during tests to keep output clean
const originalConsoleError = console.error;
console.error = (...args) => {
    // Suppress specific React Native warnings that don't affect test logic
    if (typeof args[0] === 'string' &&
        (/Warning:.*not wrapped in act/.test(args[0]) ||
            /Task orphaned/.test(args[0]))) {
        return;
    }
    originalConsoleError(...args);
};

// 9. Mock @credo-ts/core (enums and types)
jest.mock('@credo-ts/core', () => ({
    ProofState: {
        RequestReceived: 'request-received',
        PresentationSent: 'presentation-sent',
        Done: 'done',
        Declined: 'declined',
    },
    CredentialState: {
        OfferReceived: 'offer-received',
        RequestSent: 'request-sent',
        CredentialReceived: 'credential-received',
        Done: 'done',
        Declined: 'declined',
    },
    BaseError: class BaseError extends Error {
        constructor(message, { cause } = {}) {
            super(message);
            this.cause = cause;
        }
    },
    CredoError: class CredoError extends Error { },
    BaseRecord: class BaseRecord { },
    Repository: class Repository { },
    StorageService: 'StorageService',
    Agent: {
        StorageService: 'StorageService',
    },
    InjectionSymbols: {
        StorageService: 'StorageService',
    },
    AgentMessage: class AgentMessage { },
    KeyType: {
        Ed25519: 'ed25519',
        X25519: 'x25519',
        Bls12381g2: 'bls12381g2',
    },
    DidExchangeState: {
        InvitationSent: 'invitation-sent',
        InvitationReceived: 'invitation-received',
        RequestSent: 'request-sent',
        RequestReceived: 'request-received',
        ResponseSent: 'response-sent',
        ResponseReceived: 'response-received',
        Abandoned: 'abandoned',
        Completed: 'completed',
    },
    ConnectionEventTypes: {
        ConnectionStateChanged: 'ConnectionStateChanged',
    },
    CredentialEventTypes: {
        CredentialStateChanged: 'CredentialStateChanged',
    },
    ProofEventTypes: {
        ProofStateChanged: 'ProofStateChanged',
    },
    injectable: () => (target) => target,
    inject: () => (target, key, index) => { },
}));

// 10. Mock react-native-qrcode-svg
jest.mock('react-native-qrcode-svg', () => 'QRCode');
