# App – Run & Build

Expo 54 (React Native) project. How to run in development and build for production.

## Development (run without building)

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

## Building for production

### Web (static export)

```bash
cd c:\PRO\webDaiHocVN73App
npx expo export --platform web
```

Output goes to `dist/`. Serve that folder with any static host (e.g. Laravel `public` or Nginx).

### Android / iOS (native builds)

Use **EAS Build** (Expo’s cloud build) or a **local build** with native code.

#### Option 1: EAS Build (recommended)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android
eas build --platform ios
```

First run of `eas build:configure` creates `eas.json`. Then you can use `eas build --platform all` for both platforms.

#### Option 2: Local build (Android)

```bash
npx expo prebuild
cd android
.\gradlew assembleRelease
```

APK path: `android/app/build/outputs/apk/release/`.

## Summary

| Goal              | Command / step                                      |
|-------------------|------------------------------------------------------|
| Run in dev        | `npm start` then w / a / i                           |
| Build for web     | `npx expo export --platform web` → use `dist/`        |
| Build Android/iOS | Use EAS Build or `expo prebuild` + native build       |
