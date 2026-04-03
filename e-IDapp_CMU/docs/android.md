# Android Deployment Guide: Google Play Store

This guide provides a step-by-step walkthrough for generating a production build and uploading it to the Google Play Store.

---

## 1. Prepare for Release

### Generate Signed Bundle/APK
Google Play requires all apps to be digitally signed with a certificate.
1. **Generate Keystore**: If you don't have one, generate a upload keystore using `keytool` or Android Studio.
   ```bash
   keytool -genkey -v -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```
2. **Configure Gradle**: Ensure your `android/app/build.gradle` is configured with `signingConfigs`.
3. **Build the Bundle**:
   - For React Native: `npx react-native build-android --mode=release`
   - Or via Android Studio: **Build > Generate Signed Bundle / APK...**
   - **Note**: Use `.aab` (Android App Bundle) for smaller download sizes and Google Play's modern requirements.

---

## 2. Google Play Console Setup

1. **Login**: Go to the [Google Play Console](https://play.google.com/console).
2. **Create App**: Click **Create app** and fill in the basic details (App name, language, App or Game, Free or Paid).
3. **App Setup**: Complete the "Set up your app" section, which includes:
   - Privacy policy.
   - App access (login credentials for reviewers).
   - Content rating.
   - Target audience.
   - News apps / COVID-19 tracing declarations.
   - Data safety (CRITICAL: Disclose how you handle user data).

---

## 3. Create a Release

### Choose a Track
- **Production**: Live for everyone.
- **Open Testing**: Public beta.
- **Closed Testing**: Specific group of testers.
- **Internal Testing**: Up to 100 internal testers (fastest review).

### Steps to Upload
1. Navigate to **Production** (or your chosen track) in the left sidebar.
2. Click **Create new release**.
3. **App Integrity**: If prompted, choose "Use Google Play App Signing."
4. **Upload**: Drag and drop your `.aab` file into the **App bundles** section.
5. **Release Notes**: Add what's new in this version.
6. **Save and Review**: Click **Next** to check for errors or warnings.

---

## 4. Store Listing & Compliance

Before you can publish, you must complete the **Main Store Listing**:
- **App Icon**: 512x512 PNG/JPG.
- **Feature Graphic**: 1024x500 PNG/JPG.
- **Screenshots**: At least 2 for Phone (4 recommended), 7-inch tablet, and 10-inch tablet.
- **Short & Full Descriptions**: Compelling text to attract users.

---

## 5. Start Rollout (Make it Live)

1. Once the release is reviewed and the store listing is complete, go to **Review and release**.
2. Click **Start rollout to Production**.
3. **Review Process**:
   - New apps usually take **3-7 days** for the first review.
   - Updates to existing apps usually take **1-3 days**.
   - You can monitor the status under **Publishing overview**.

---

## 6. Common Troubleshooting
- **Version Code Error**: Ensure `versionCode` in `build.gradle` is higher than the previous release.
- **Package Name Error**: The package name (e.g., `com.polyid.holder`) must be unique and cannot be changed after the first upload.
- **API Level**: Ensure your `targetSdkVersion` meets Google's current minimum requirements (usually the latest Android version).

---

## 💡 Pro Tips
- Use **Internal Testing** first to ensure the app works on real devices before going to Production.
- Enable **Managed Publishing** if you want to control exactly *when* the app goes live after it passes the review.
