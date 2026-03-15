# Screens, components & required packages

Audit of all screens and components and the npm packages they import. Use this to fix "Unable to resolve" errors.

## Screens

| Screen | File | External packages used |
|--------|------|------------------------|
| LoginScreen | `src/screens/LoginScreen.js` | `react`, `react-native`, `@expo/vector-icons`, `expo-auth-session` (optional require) |
| RegisterScreen | `src/screens/RegisterScreen.js` | `react`, `react-native`, `@expo/vector-icons`, `expo-auth-session` (optional require) |
| HomeScreen | `src/screens/HomeScreen.js` | `react`, `react-native`, `@react-navigation/native`, `expo-linear-gradient`, `@expo/vector-icons`, `react-native-safe-area-context` |
| TopicsScreen | `src/screens/TopicsScreen.js` | `react`, `react-native`, `@expo/vector-icons` |
| TopicDetailScreen | `src/screens/TopicDetailScreen.js` | `react`, `react-native`, `@expo/vector-icons` |
| ExamTakeScreen | `src/screens/ExamTakeScreen.js` | `react`, `react-native`, `expo-linear-gradient`, `@expo/vector-icons`, `react-native-safe-area-context` (+ MathText → `react-native-webview`) |
| ResultScreen | `src/screens/ResultScreen.js` | `react`, `react-native`, `expo-linear-gradient`, `@expo/vector-icons` (+ MathText, ProgressRing, IconButton) |
| ScoreboardScreen | `src/screens/ScoreboardScreen.js` | `react`, `react-native`, `@expo/vector-icons` |
| ProfileScreen | `src/screens/ProfileScreen.js` | `react`, `react-native`, `expo-linear-gradient`, `@expo/vector-icons`, `expo-image-picker` (optional require) |
| LimitsScreen | `src/screens/LimitsScreen.js` | `react`, `react-native` |
| HoiAiAskScreen | `src/screens/HoiAiAskScreen.js` | `react`, `react-native`, `@expo/vector-icons` (+ MathText), `expo-image-picker` (optional) |
| HoiAiHistoryScreen | `src/screens/HoiAiHistoryScreen.js` | `react`, `react-native`, `@expo/vector-icons` (+ MathText) |
| ForgotPasswordScreen | `src/screens/ForgotPasswordScreen.js` | `react`, `react-native` |
| SearchScreen | `src/screens/SearchScreen.js` | `react`, `react-native` |
| StudyMaterialsScreen | `src/screens/StudyMaterialsScreen.js` | `react`, `react-native` (+ MathText) |
| CommentsScreen | `src/screens/CommentsScreen.js` | `react`, `react-native` |
| MonThiScreen | `src/screens/MonThiScreen.js` | `react`, `react-native`, `@react-navigation/native`, `@expo/vector-icons` |
| MenuScreen | `src/screens/MenuScreen.js` | `react`, `react-native`, `@react-navigation/native`, `@expo/vector-icons` |
| GamificationScreen | `src/screens/GamificationScreen.js` | `react`, `react-native`, `expo-linear-gradient`, `@expo/vector-icons` (+ ProgressRing) |

## Components

| Component | File | External packages used |
|-----------|------|------------------------|
| MathText | `src/components/MathText.js` | `react`, `react-native`, **`react-native-webview`** |
| ProgressRing | `src/components/ProgressRing.js` | `react`, `react-native`, **`react-native-svg`** |
| GradientCard | `src/components/GradientCard.js` | `react`, `react-native`, **`expo-linear-gradient`** |
| AppHeader | `src/components/AppHeader.js` | `react`, `react-native`, `@react-navigation/native`, `@expo/vector-icons` |
| CustomTabBar | `src/components/CustomTabBar.js` | `react`, `react-native`, **`react-native-safe-area-context`**, `@expo/vector-icons` |
| IconButton | `src/components/IconButton.js` | `react`, `react-native`, `@expo/vector-icons` |
| EmptyState | `src/components/EmptyState.js` | `react`, `react-native`, `@expo/vector-icons` |
| StatBox | `src/components/StatBox.js` | `react`, `react-native`, `@expo/vector-icons` |
| ErrorBoundary | `src/components/ErrorBoundary.js` | `react`, `react-native`, `@expo/vector-icons` |

## Navigation & app root

| File | External packages used |
|------|------------------------|
| `App.js` | **`expo-status-bar`**, **`react-native-safe-area-context`** |
| `src/navigation/AppNavigator.js` | `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`, `@expo/vector-icons` |
| `src/auth/AuthContext.js` | `react` |
| `src/auth/storage.js` | **`@react-native-async-storage/async-storage`** |
| `src/hooks/useRequireAuth.js` | `@react-navigation/native` |
| `src/storage/preferences.js` | `@react-native-async-storage/async-storage` |

## Unique packages to install (Expo-compatible)

These are the **npm package names** that must be installed for screens and components to resolve. Install with Expo so versions match your SDK:

```bash
npx expo install \
  @react-native-async-storage/async-storage \
  @react-navigation/native \
  @react-navigation/native-stack \
  @react-navigation/bottom-tabs \
  expo-auth-session \
  expo-image-picker \
  expo-linear-gradient \
  expo-status-bar \
  react-native-safe-area-context \
  react-native-screens \
  react-native-svg \
  react-native-webview
```

- **`@expo/vector-icons`** – included with the `expo` package; no separate install.
- **`react`**, **`react-native`**, **`react-dom`**, **`react-native-web`** – set by Expo/React Native; keep versions that `expo install` recommends.

## Checklist (if you see "Unable to resolve X")

| Package | Used by |
|---------|--------|
| `expo-auth-session` | LoginScreen, RegisterScreen (Google sign-in) |
| `expo-image-picker` | ProfileScreen, HoiAiAskScreen (optional) |
| `expo-linear-gradient` | HomeScreen, ExamTakeScreen, ResultScreen, ProfileScreen, GamificationScreen, GradientCard |
| `expo-status-bar` | App.js |
| `react-native-safe-area-context` | HomeScreen, ExamTakeScreen, CustomTabBar, App.js (SafeAreaProvider) |
| `react-native-screens` | React Navigation (stack/tabs) |
| `react-native-svg` | ProgressRing |
| `react-native-webview` | MathText (used by ExamTakeScreen, ResultScreen, StudyMaterialsScreen, HoiAiAskScreen, HoiAiHistoryScreen) |
| `@react-navigation/native` | AppNavigator, HomeScreen, MonThiScreen, MenuScreen, AppHeader, CustomTabBar, useRequireAuth |
| `@react-navigation/native-stack` | AppNavigator |
| `@react-navigation/bottom-tabs` | AppNavigator |
| `@react-native-async-storage/async-storage` | auth/storage, preferences, tests |

Run the `npx expo install ...` command above from the project root to ensure all of these are present and compatible with your Expo SDK.
