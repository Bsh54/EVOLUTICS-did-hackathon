# PolyID Deep Linking (Android)

The PolyID app supports deep linking via the `polyid://` scheme on Android. This allows users to open invitations (connections, credentials, and proofs) directly from web links, emails, SMS, or other apps.

## URL Scheme Specification

The primary scheme is `polyid://`.

### Supported URL Patterns

| Type                   | URL Pattern                                    | Purpose                                                     |
| :--------------------- | :--------------------------------------------- | :---------------------------------------------------------- |
| **Generic Invitation** | `polyid://invite?oob=<base64_invitation>`      | Automatically detects the invitation type from the payload. |
| **Connection Request** | `polyid://invite?oob=<base64>&type=connection` | Explicitly triggers the connection request modal.           |
| **Credential Offer**   | `polyid://invite?oob=<base64>&type=offer`      | Explicitly triggers the credential offer modal.             |
| **Proof Request**      | `polyid://invite?oob=<base64>&type=proof`      | Explicitly triggers the proof request modal.                |
| **ZKP Proof Request**  | `polyid://invite?oob=<base64>&type=zkp-proof`  | Explicitly triggers the ZKP proof request flow.             |

## How it Works

1.  **Android Intent Filter**: `MainActivity` is registered to handle `polyid://` links in `AndroidManifest.xml`.
2.  **Intent Forwarding**: `SplashActivity` forwards any incoming deep link data to `MainActivity` during app startup.
3.  **DeepLink Feature**: A dedicated feature module in `src/features/deeplink/` handles:
    *   **Parsing**: Extracts and decodes the `oob` parameter using existing invitation logic.
    *   **Categorization**: Determines the type of request based on the URL parameters or the decoded payload.
    *   **Global Handling**: The `useDeepLinkHandler` hook in `AppNavigator.tsx` listens for both cold starts (app closed) and warm starts (app in background).
4.  **UI Feedback**: Modals for connections, credentials, and proofs are triggered globally in `AppNavigator.tsx` when a valid deep link is detected.

## Testing Instructions

To test deep linking on an Android emulator or a physical device with USB debugging enabled, use the following `adb` command:

### 1. Simple Connection Request
```bash
adb shell am start -W -a android.intent.action.VIEW -d "polyid://invite?oob=eyAiQGlkIjogIjEyMyIsICJAdHlwZSI6ICJodHRwczovL2RpZGNvbW0ub3JnL291dC1vZi1iYW5kLzEuMC9pbnZpdGF0aW9uIiwgImxhYmVsIjogIlRlc3QgT3JnYW5pemF0aW9uIiB9"
```
*(Note: The base64 above is a valid JSON invitation: `{"@id": "123", "@type": "https://didcomm.org/out-of-band/1.0/invitation", "label": "Test Organization"}`)*

### 2. With Explicit Type
```bash
adb shell am start -W -a android.intent.action.VIEW -d "polyid://invite?oob=YOUR_BASE64_HERE&type=offer"
```

### 3. Web/Browser Testing
You can also test by entering the URL directly into the Chrome browser on the Android device:
1. Open Chrome on the emulator/device.
2. Type `polyid://invite?oob=...` into the address bar and press Enter.
3. Chrome should prompt to "Open with PolyID".

## Web & Chat Integration

### 1. Using from a Website
To trigger the deep link from a webpage, use a standard anchor tag.

```html
<a href="polyid://invite?oob=YOUR_BASE64_HERE">
   Connect to PolyID Wallet
</a>
```

### 2. Sharing in Chat Apps
Most chat apps (WhatsApp, Slack, etc.) do not automatically make `polyid://` links clickable. To handle this, use a **Web Redirector**:

1.  **Create a simple HTTPS page** (e.g., `https://polyversity.io/connect?oob=...`).
2.  **Add a redirect script** to that page:
    ```javascript
    window.onload = function() {
      const urlParams = new URLSearchParams(window.location.search);
      const oob = urlParams.get('oob');
      if (oob) {
        window.location.href = "polyid://invite?oob=" + oob;
      }
    };
    ```
3.  **Share the HTTPS link** in the chat instead. It will be blue/clickable and will trigger the app once the user hits the landing page.

## Troubleshooting

*   **App not opening**: Ensure the `polyid` scheme is correctly registered in `AndroidManifest.xml`.
*   **Cold start fails**: Check if `SplashActivity.kt` is correctly forwarding the intent data.
*   **Modal not appearing**: Verify that the `useDeepLinkHandler` hook is correctly integrated into `AppNavigator.tsx` and that the `oob` parameter is a valid base64-encoded Credo invitation.
*   **Logs**: Check the console for logs prefixed with `🔗 [DEEPLINK]` for debugging information.
