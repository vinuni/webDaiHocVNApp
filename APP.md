# App – Run & Build

Expo 54 (React Native) project. How to run in development and how to build development vs production.

---

## Run in development (no build)

Use this for day-to-day coding. No native build required; JS is served from Metro.

From the app folder:

```bash
cd c:\PRO\webDaiHocVN73App
npm install
npm start
```

Then:

- Press **w** for web
- Press **a** for Android (device/emulator)
- Press **i** for iOS (simulator, Mac only)

Or run a platform directly:

```bash
npm run web
npm run android
npm run ios
```

**Note:** On Android/iOS you can use **Expo Go** (from store) or a **development build** (see below) for dev menu and native modules.

---

## Development build

A **development build** is a native app that includes the Expo dev client. Use it when you need the dev menu, custom native code, or to test on a device without Expo Go.

### Option A: EAS Build (cloud)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile development
eas build --platform ios --profile development
```

Ensure `eas.json` has a `development` profile (created by `eas build:configure`). Install the built APK/IPA on your device and run `npm start`; the app will connect to your Metro bundler.

### Option B: Local build (Android)

Requires **Android SDK** and `ANDROID_HOME` (see “Android SDK setup” below).

```bash
npx expo prebuild
npx expo run:android
```

This builds and runs a debug/dev build on a connected device or emulator.

---

## Production build

Use these to create builds for **web hosting** or **store distribution** (Google Play / App Store).

### Web (static export)

```bash
cd c:\PRO\webDaiHocVN73App
npx expo export --platform web
```

Output goes to `dist/`. Serve that folder with any static host (e.g. Laravel `public` or Nginx).

### Android (AAB/APK for Play Store or sideload)

**Option 1: EAS Build (recommended)**

```bash
eas build --platform android --profile production
```

```bash
eas build --platform android --profile development
```

Produces an AAB (or APK if configured) for Google Play or direct install. First run `eas build:configure` if needed.

**Option 2: Local build**

Requires **Android SDK** and `ANDROID_HOME` (see below).

```bash
npx expo prebuild
cd android
.\gradlew assembleRelease
```

APK path: `android/app/build/outputs/apk/release/`. For AAB (Play Store): `.\gradlew bundleRelease` → `android/app/build/outputs/bundle/release/`.

### iOS (App Store)

Use EAS Build (Mac or cloud):

```bash
eas build --platform ios --profile production
```

Local builds require Xcode and a Mac: `npx expo run:ios --configuration Release`.

### Android SDK setup (Windows, for local run/build)

1. **Install Android Studio** (easiest): https://developer.android.com/studio  
   - During setup, ensure **Android SDK** is installed (default).

2. **Set environment variables** (replace path if your SDK is elsewhere):
   - `ANDROID_HOME` = `C:\Users\<You>\AppData\Local\Android\Sdk`
   - Add to **Path**: `%ANDROID_HOME%\platform-tools` and `%ANDROID_HOME%\emulator`

   **PowerShell (current user):**
   ```powershell
   [System.Environment]::SetEnvironmentVariable('ANDROID_HOME', "$env:LOCALAPPDATA\Android\Sdk", 'User')
   $path = [System.Environment]::GetEnvironmentVariable('Path', 'User')
   $path += ";$env:LOCALAPPDATA\Android\Sdk\platform-tools;$env:LOCALAPPDATA\Android\Sdk\emulator"
   [System.Environment]::SetEnvironmentVariable('Path', $path, 'User')
   ```
   Then **close and reopen** PowerShell/terminal.

3. **Verify:** `adb version` should run without error.

4. **Run app:** `npx expo run:android` (or start with `npx expo start` and press **a** with an emulator/device connected).

---

## Summary

| Goal                | Command / step                                                |
|---------------------|---------------------------------------------------------------|
| Run in dev          | `npm start` then w / a / i                                    |
| Development build   | `eas build --profile development` or `npx expo run:android`  |
| Production – web   | `npx expo export --platform web` → serve `dist/`              |
| Production – Android | `eas build --platform android --profile production` or local `assembleRelease` / `bundleRelease` |
| Production – iOS   | `eas build --platform ios --profile production`               |
