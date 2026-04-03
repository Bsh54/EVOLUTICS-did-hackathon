# Feature-Based Documentation Index

Welcome to the PolyID Holder App feature-based documentation. This index provides a centralized mapping of all application features to their respective documentation and tracking files.

## Features Overview

| Feature                         | Description                                           | Main Documentation                            | Issues Tracking                               |
| ------------------------------- | ----------------------------------------------------- | --------------------------------------------- | --------------------------------------------- |
| **Deep Linking**                | Android deep linking via `polyid://` scheme           | [README](./deep-linking/README.md)            | [Issues](./deep-linking/issues.md)            |
| **ZKP (Zero-Knowledge Proofs)** | ZKP request handling and selective disclosure         | [README](./zkp/README.md)                     | [Issues](./zkp/issues.md)                     |
| **Wallet Backup & Restore**     | Encrypted backup and restoration of the wallet        | [README](./wallet-backup/README.md)           | [Issues](./wallet-backup/issues.md)           |
| **Credentials & Connections**   | Management and display of connections and credentials | [README](./credentials-connections/README.md) | [Issues](./credentials-connections/issues.md) |
| **UI & Theme**                  | Global UI configurations, including Status Bar        | [README](./ui/README.md)                      | N/A                                           |

## Mapping of Original Files

For reference, the following original documentation files have been mapped into this feature structure:

| Original File                             | New Feature Location                              |
| ----------------------------------------- | ------------------------------------------------- |
| `docs/deep-linking.md`                    | `docs/features/deep-linking/README.md`            |
| `docs/changelog/deep-linking-issues.md`   | `docs/features/deep-linking/issues.md`            |
| `docs/zkp-implementation.md`              | `docs/features/zkp/implementation.md`             |
| `docs/zkp-unification-summary.md`         | `docs/features/zkp/unification.md`                |
| `docs/selective-disclosure-research.md`   | `docs/features/zkp/selective-disclosure.md`       |
| `docs/wallet-backup-implementation.md`    | `docs/features/wallet-backup/README.md`           |
| `docs/listing-features-implementation.md` | `docs/features/credentials-connections/README.md` |
| `docs/status-bar-configuration.md`        | `docs/features/ui/status-bar.md`                  |

---
*Note: Original files are kept at their root locations for now. Future updates should primarily occur within the feature folders.*

## 📜 Documentation Rules

When creating or updating documentation:
1. **Categorize**: Place in `docs/features/<feature-name>/`.
2. **Structure**: 
   - `README.md`: Main technical overview.
   - `issues.md`: Tracking (Active/Solved/Waiting).
3. **Compactness**: Use bullet points and concise language. Avoid verbosity to save tokens.
4. **Index**: Always update this `index.md` mapping when adding a new feature.
