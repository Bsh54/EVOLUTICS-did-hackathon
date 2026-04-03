<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.81.4-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Hyperledger_Aries-Credo_TS-2F3134?style=for-the-badge&logo=hyperledger&logoColor=white" alt="Hyperledger Aries" />
  <img src="https://img.shields.io/badge/License-Apache_2.0-D22128?style=for-the-badge&logo=apache&logoColor=white" alt="License" />
  <img src="https://img.shields.io/badge/Platform-Android_%7C_iOS-green?style=for-the-badge" alt="Platform" />
</p>

<h1 align="center">e-IDStack App</h1>

<p align="center">
  <strong>A decentralized identity wallet built on Hyperledger Aries & Credo-TS</strong>
</p>

<p align="center">
  Securely manage your verifiable credentials, establish trusted connections, and share proofs — all from your mobile device. e-IDStack puts you in full control of your digital identity with privacy-preserving zero-knowledge proof support.
</p>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Running the App](#running-the-app)
- [Building for Production](#building-for-production)
- [Project Structure](#project-structure)
- [Deep Linking](#deep-linking)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Documentation](#documentation)
- [License](#license)

---

## Overview

**e-IDStack App** is a production-grade mobile wallet application that implements the **W3C Verifiable Credentials** and **DIDComm** standards using the [Hyperledger Aries](https://www.hyperledger.org/projects/aries) framework via [Credo-TS](https://github.com/openwallet-foundation/credo-ts). It enables individuals to:

- **Receive** verifiable credentials from trusted issuers
- **Store** credentials securely in a local, encrypted wallet
- **Present** proofs of credentials to verifiers on demand
- **Control** what information is shared through selective disclosure and zero-knowledge proofs

The app follows a **Self-Sovereign Identity (SSI)** model, ensuring that the user's data never leaves their device without explicit consent.

---

## Key Features

| Feature | Description |
|---|---|
| 🔐 **Secure Wallet** | AES-encrypted wallet storage powered by Hyperledger Aries Askar |
| 📜 **Verifiable Credentials** | Receive, store, and manage W3C-compliant verifiable credentials |
| 🤝 **DIDComm Connections** | Establish peer-to-peer connections with organizations via QR codes or deep links |
| 🛡️ **Proof Presentation** | Respond to proof requests from verifiers with granular attribute selection |
| 🔏 **Zero-Knowledge Proofs** | Privacy-preserving proof presentations using AnonCreds |
| 📷 **QR Code Scanner** | Built-in scanner for accepting invitations, credentials, and proof requests |
| 🔗 **Deep Linking** | Open invitations directly from web links, SMS, or other apps via `e-id://` scheme |
| 🔑 **PIN Protection** | PIN-based access control with encrypted storage |
| 💾 **Offline Storage** | WatermelonDB-backed local persistence — works without network connectivity |
| 🌐 **Multi-Language Support** | Language selection during onboarding |
| 📤 **Wallet Backup & Restore** | Securely back up and restore your wallet with passphrase protection |
| 🔔 **Real-Time Updates** | Event-driven architecture for instant credential and connection state changes |

---

## Architecture

The e-IDStack Holder App follows a **layered, service-oriented architecture** with event-driven state management:

```
┌─────────────────────────────────────────────────────┐
│                    UI Layer                          │
│         Screens · Components · Navigation           │
├─────────────────────────────────────────────────────┤
│                State Management                     │
│        Redux Toolkit + Credo Redux Store            │
├─────────────────────────────────────────────────────┤
│                 Service Layer                       │
│  CredoAgentService · ConnectionService · ProofSvc   │
├─────────────────────────────────────────────────────┤
│               Identity Framework                    │
│            Credo-TS (Hyperledger Aries)              │
├─────────────────────────────────────────────────────┤
│               Persistence Layer                     │
│   WatermelonDB · Secure Storage · Aries Askar       │
└─────────────────────────────────────────────────────┘
```

> For a comprehensive architecture overview including data flow diagrams, state management patterns, and design decisions, see [`docs/architecture-overview.md`](docs/architecture-overview.md).

---

## Technology Stack

| Category | Technology |
|---|---|
| **Framework** | React Native 0.81.4 with TypeScript |
| **Identity** | Credo-TS 0.5.17 (Hyperledger Aries) |
| **Wallet Storage** | Hyperledger Aries Askar |
| **Credential Format** | AnonCreds (Anonymous Credentials) |
| **Ledger Access** | Indy VDR (BCovrin Test Network) |
| **State Management** | Redux Toolkit + Credo Redux Store |
| **Local Database** | WatermelonDB |
| **Secure Storage** | React Native Encrypted Storage + Keychain |
| **Navigation** | React Navigation 7 (Stack, Tab, Drawer) |
| **Camera / QR** | React Native Vision Camera + QR Scanner |
| **Animations** | React Native Reanimated 4 |
| **Testing** | Jest + React Native Testing Library |

---

## Prerequisites

Before setting up the project, ensure you have the following installed:

### Required Software

| Software | Minimum Version | Notes |
|---|---|---|
| **Node.js** | >= 20.x | LTS version recommended |
| **npm** or **Yarn** | npm 9+ / Yarn 1.22+ | Package manager |
| **React Native CLI** | Latest | `npm install -g @react-native-community/cli` |
| **Java JDK** | 17 | Required for Android builds |
| **Android Studio** | Latest | With Android SDK, NDK, and emulator |
| **Xcode** | 15+ | iOS builds only (macOS required) |
| **CocoaPods** | Latest | iOS dependency manager |
| **Ruby** | 2.7+ | Required for CocoaPods (Bundler) |

### Platform-Specific Setup

Follow the official React Native environment setup guide for your development OS and target platform:

👉 [React Native — Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment)

> **Important**: Ensure that `ANDROID_HOME` and `JAVA_HOME` environment variables are correctly configured.

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/idsecosystem/e-IDapp_CMU.git
cd e-IDapp_CMU
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# OR using Yarn
yarn install
```

> The `postinstall` script will automatically run `patch-package` to apply required patches.

### 3. iOS Only — Install CocoaPods

```bash
# Install Bundler dependencies (first time only)
bundle install

# Install CocoaPods dependencies
cd ios && bundle exec pod install && cd ..
```

---

## Environment Configuration

The app requires environment variables for connecting to the Hyperledger Indy network and mediator service.

### 1. Create the `.env` File

Copy the sample environment file and fill in the values:

```bash
cp .env.sample .env
```

### 2. Required Variables

| Variable | Description | Example |
|---|---|---|
| `GENESIS_URL` | URL to fetch the Indy ledger genesis transactions | `https://test.bcovrin.vonx.io/genesis` |
| `MEDIATOR_URL` | URL for the DIDComm mediator invitation endpoint | `https://your-mediator.example.com/createMediatorInvitation` |

### 3. Verify Configuration

After creating the `.env` file, **restart the Metro bundler** to pick up the changes:

```bash
npm start -- --reset-cache
```

> ⚠️ **Never commit the `.env` file.** It is included in `.gitignore`. For CI/CD pipelines, inject environment variables as build secrets. See [`docs/BUILD.md`](docs/BUILD.md) for detailed build configuration.

---

## Running the App

### Step 1: Start the Metro Dev Server

```bash
# Using npm
npm start

# OR using Yarn
yarn start
```

### Step 2: Launch on Device or Emulator

Open a new terminal and run:

#### Android

```bash
npm run android
# OR
yarn android
```

#### iOS

```bash
npm run ios
# OR
yarn ios
```

> You can also open the project in **Android Studio** (`android/`) or **Xcode** (`ios/`) to build and run directly from the IDE.

---

## Building for Production

### Android Release Build

```bash
npm run build:android
# OR
yarn build:android
```

This script bundles the JavaScript, copies assets, and runs a Gradle `assembleRelease` to produce a signed APK.

> Ensure your release signing configuration is set up in `android/app/build.gradle`. See [`docs/BUILD.md`](docs/BUILD.md) for environment variable injection in production builds.

### iOS Release Build

Use Xcode to archive and distribute the iOS app. Open `ios/PolyversityWallet.xcworkspace` in Xcode and follow standard App Store submission procedures.

---

## Project Structure

```
e-IDapp_CMU/
├── android/                  # Android native project
├── ios/                      # iOS native project
├── src/
│   ├── assets/               # Images, fonts, and static resources
│   ├── components/           # Reusable UI components
│   │   ├── RequestModal.tsx           # Connection request modal
│   │   ├── RequestCredentialModal.tsx  # Credential offer modal
│   │   ├── ProofRequestModal.tsx      # Proof request modal
│   │   ├── LoadingModal.tsx           # Loading state overlay
│   │   ├── SuccessModal.tsx           # Success confirmation
│   │   └── ...
│   ├── config/               # App configuration (env, constants)
│   ├── constants/            # Shared constants and enums
│   ├── db/                   # WatermelonDB models and provider
│   ├── features/             # Feature modules
│   │   ├── agent/                    # Credo agent provider & hooks
│   │   ├── credential-connection/    # Credential & connection management
│   │   ├── deeplink/                 # Deep linking handler
│   │   ├── verification-history/     # Proof verification history
│   │   ├── wallet-backup/            # Wallet backup & restore
│   │   └── zkp/                      # Zero-knowledge proof support
│   ├── hooks/                # Custom React hooks
│   ├── navigation/           # React Navigation configuration
│   ├── screens/              # App screens
│   │   ├── OnboardingScreen.tsx       # First-time user onboarding
│   │   ├── DashboardScreen.tsx        # Main dashboard
│   │   ├── ScanQRScreen.tsx           # QR code scanner
│   │   ├── CredentialsScreen.tsx      # Credentials list
│   │   ├── CredentialDetailScreen.tsx # Credential details
│   │   ├── ProofRequestDetailsScreen.tsx  # Proof request handling
│   │   └── ...
│   ├── services/             # Core business logic services
│   │   ├── CredoAgentService.ts       # Main Credo agent service
│   │   ├── ConnectionService.ts       # Connection operations
│   │   ├── CredentialService.ts       # Credential operations
│   │   ├── ProofService.ts            # Proof request operations
│   │   ├── CredoEventListener.ts      # Agent event listeners
│   │   └── mediator/                  # Mediator service
│   ├── store/                # Redux store configuration
│   │   ├── index.ts                   # Store setup
│   │   └── slices/                    # Redux slices
│   ├── templates/            # Reusable templates
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions
├── docs/                     # Project documentation
├── patches/                  # patch-package patches
├── scripts/                  # Build and utility scripts
├── __tests__/                # Test suites
├── .env.sample               # Sample environment variables
├── App.tsx                   # Application root component
├── package.json              # Project dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

---

## Deep Linking

The e-IDStack app supports deep linking via the `e-id://` URL scheme, allowing invitations to be shared and opened from web pages, SMS, email, or other applications.

### Supported URL Patterns

| Type | URL Pattern |
|---|---|
| Generic Invitation | `e-id://invite?oob=<base64_invitation>` |
| Connection Request | `e-id://invite?oob=<base64>&type=connection` |
| Credential Offer | `e-id://invite?oob=<base64>&type=offer` |
| Proof Request | `e-id://invite?oob=<base64>&type=proof` |
| ZKP Proof Request | `e-id://invite?oob=<base64>&type=zkp-proof` |

### Web Integration Example

```html
<a href="e-id://invite?oob=YOUR_BASE64_HERE">
   Connect to e-ID Wallet
</a>
```

> For full deep linking documentation including testing instructions, chat app integration, and troubleshooting, see [`docs/deep-linking.md`](docs/deep-linking.md).

---

## Testing

The project uses **Jest** and **React Native Testing Library** for unit and component testing.

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Linting

```bash
npm run lint
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|---|---|
| Metro bundler stuck or stale cache | Run `npm start -- --reset-cache` |
| Environment variables undefined | Verify `.env` file exists, then restart Metro |
| "Network request failed" in production | Ensure `.env` was present during build. See [`docs/BUILD.md`](docs/BUILD.md) |
| Android build fails | Check `ANDROID_HOME`, `JAVA_HOME`, and SDK versions |
| iOS pod install fails | Run `bundle install` then `bundle exec pod install` |
| QR scanner not working | Grant camera permissions in device settings |

### Additional Resources

- [React Native Troubleshooting Guide](https://reactnative.dev/docs/troubleshooting)
- [Build Configuration Guide](docs/BUILD.md)
- [Patching Guide](docs/patching.md)

---

## Contributing

We welcome contributions to the e-IDStack Holder App! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/my-feature`)
3. **Commit** your changes with clear, descriptive messages
4. **Push** to your branch (`git push origin feature/my-feature`)
5. **Open** a Pull Request against the `main` branch

### Development Guidelines

- Follow the existing **TypeScript** conventions and code style
- Run `npm run lint` before submitting a PR
- Ensure all tests pass with `npm test`
- Add relevant tests for new features
- Update documentation for any API or configuration changes

---

## Documentation

Detailed documentation is available in the [`docs/`](docs/) directory:

| Document | Description |
|---|---|
| [Architecture Overview](docs/architecture-overview.md) | High-level architecture, data flows, and design decisions |
| [Build Configuration](docs/BUILD.md) | Environment variable setup, production builds, and CI/CD |
| [Deep Linking](docs/deep-linking.md) | `e-id://` URL scheme configuration and usage |
| [ZKP Implementation](docs/zkp-implementation.md) | Zero-knowledge proof feature internals |
| [Wallet Backup](docs/wallet-backup-implementation.md) | Wallet backup and restore implementation |
| [Selective Disclosure](docs/selective-disclosure-research.md) | Research on selective disclosure capabilities |
| [Patching Guide](docs/patching.md) | How to manage native dependency patches |

---

## License

```
Copyright 2025 IDSSOFT

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
```

---

<p align="center">
  Built with ❤️ by <strong>IDSSOFT</strong>
</p>
