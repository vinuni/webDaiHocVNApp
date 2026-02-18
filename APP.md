# App Documentation: Thi Thử Online (Mobile App)

This document is the **mobile app counterpart** to the web project’s **PROJECT.md** (in the Laravel repo `webDaiHocVN73`). It describes the Expo (React Native) app for **Thi Thử Online**, what has been **ported from web** to the app, and what is **pending or can be ported**.

---

## 📋 App Overview

The **Thi Thử Online** mobile app is a single codebase (Expo / React Native) for **iOS and Android**, consuming the Laravel backend via **REST API** (`/api/v1/`). It targets **user-facing features only**; admin and Quest (exam/question management) stay on the web.

### Tech Stack

| Category        | Technology                          |
|----------------|--------------------------------------|
| **Framework**  | Expo (React Native)                  |
| **Navigation** | React Navigation (native stack, bottom tabs) |
| **Auth**       | Laravel Sanctum (Bearer token), AsyncStorage |
| **API**        | Fetch + env `EXPO_PUBLIC_API_BASE_URL` |
| **Build**      | EAS Build (iOS/Android)              |

---

## ✅ Ported from Web to App (Already in App)

Features below are implemented in the app and use the backend API.

| # | Feature | Web (PROJECT.md) | App screen / API | Notes |
|---|---------|-------------------|------------------|--------|
| 1 | **Authentication** | Login, Register, session | `LoginScreen`, `RegisterScreen`, `AuthContext` | `POST /api/v1/login`, `register`, `logout`; token stored, Bearer sent |
| 2 | **Home** | Homepage with exam list | `HomeScreen` | `GET /api/v1/home` (mon_this, short/long exams) |
| 3 | **Subjects (MonThi)** | Subject pages | `TopicsScreen` | `GET /api/v1/home` (mon_this), filter by subject |
| 4 | **Topics (HocPhan)** | Topic/chapter list and detail | `TopicsScreen`, `TopicDetailScreen` | `GET /api/v1/hoc-phan`, `GET /api/v1/hoc-phan/{id}` |
| 5 | **Exam list & preview** | DeThi list per subject/topic | `TopicDetailScreen` | From home + hoc-phan; `GET /api/v1/de-thi/{id}` for preview |
| 6 | **Take exam** | Timed exam, submit answers | `ExamTakeScreen` | `GET /api/v1/de-thi/{id}/lam-bai`, `POST .../nop-bai` (full answers); timer, limit enforced by backend |
| 7 | **Results** | Score and review after exam | `ResultScreen` | `GET /api/v1/ket-qua/{deThiId}` |
| 8 | **Scoreboard** | User’s score history | `ScoreboardScreen` | `GET /api/v1/bang-diem` |
| 9 | **Profile** | User info and edit | `ProfileScreen` | `GET /api/v1/user`, `PUT /api/v1/user` |
| 10 | **Daily limits & recommendations** | Limits + practice recommendations | `LimitsScreen` | `GET /api/v1/limits`, `GET /api/v1/practice/recommendations` |
| 11 | **Gamification** | XP, level, badges, streak, challenges, leaderboard | `GamificationScreen` | `GET /api/v1/gamification` (dashboard); pull-to-refresh |
| 12 | **Hỏi AI (Ask)** | Ask question (text + optional photo), AI answer | `HoiAiAskScreen` | `POST /api/v1/ai-question` (JSON or multipart with photo); 429/503 handling; categorization shown |
| 13 | **Hỏi AI (History)** | Paginated Q&A history | `HoiAiHistoryScreen` | `GET /api/v1/ai-question/history`; pagination, expand item |
| 14 | **Forgot password** | Web + API | `ForgotPasswordScreen` | `POST /api/v1/forgot-password`; link from Login |
| 15 | **Search** | Backend API | `SearchScreen` | `GET /api/v1/search`, `GET /api/v1/search/history`; filters (mon_thi, difficulty) |
| 16 | **Avatar upload** | Profile API | `ProfileScreen` | `POST /api/v1/user` multipart with avatar; pick from library |
| 17 | **Email verification** | Web flow | `ProfileScreen` | Banner when unverified; link in email opens web |

| 18 | **Social login (Google)** | Web: Socialite | `LoginScreen` | `POST /api/v1/social-login` with provider + access_token; Google via expo-auth-session (set EXPO_PUBLIC_GOOGLE_*_CLIENT_ID) |
| 19 | **Comments** | Web: Laravelista | `CommentsScreen` | `GET/POST /api/v1/comments` (commentable_type, commentable_id); from Result "Bình luận đề thi", Profile, TopicDetail |
| 20 | **Study materials** | Web: per HocPhan | `StudyMaterialsScreen` | `GET /api/v1/hoc-phan/{id}/study-materials`; from TopicDetail "Tài liệu học", Profile |

### Placeholder / Coming soon

| Feature | App | Notes |
|---------|-----|--------|
| **Facebook login** | Not implemented | Backend accepts `provider: facebook` + access_token; add Facebook SDK in app when needed |

### App structure (screens)

- **Auth:** Login, Register, Forgot password  
- **Main tabs:** Home, Tìm kiếm (Search), Học phần (Topics), Thành tích (Gamification), Hỏi AI (stack: Ask → History), Bảng điểm (Scoreboard), Tài khoản (Profile), Giới hạn (Limits)  
- **Stack:** TopicDetail, ExamTake, Result, HoiAiHistory, StudyMaterials, Comments  

---

## ⏳ Pending / Can Be Ported

| # | Feature | Web / API status | App status | Notes |
|---|---------|-------------------|------------|--------|
| 1 | **PRO / subscription** | Web: subscription flow, limits bypass for pro_user | ⚠️ Partial | Limits screen shows usage; no in-app upgrade/payment |
| 2 | **Result email** | Web: email after exam | N/A | Backend sends email; app shows result screen only |
| 3 | **Admin / Quest** | Web: exam/question CRUD, users, etc. | ❌ Out of scope | Intentionally web-only |

---

## 🔌 API Endpoints Used by the App

| Endpoint | Method | Screen / use |
|----------|--------|----------------|
| `/api/v1/login` | POST | Login |
| `/api/v1/register` | POST | Register |
| `/api/v1/logout` | POST | Logout |
| `/api/v1/user` | GET, PUT, POST (multipart) | Profile (avatar) |
| `/api/v1/forgot-password` | POST | ForgotPasswordScreen |
| `/api/v1/search` | GET | SearchScreen |
| `/api/v1/search/history` | GET | SearchScreen |
| `/api/v1/home` | GET | Home, Topics (mon_this), Search (mon_this) |
| `/api/v1/hoc-phan` | GET | Topics (list by mon_thi) |
| `/api/v1/hoc-phan/{id}` | GET | TopicDetail |
| `/api/v1/de-thi/{id}` | GET | Exam preview |
| `/api/v1/de-thi/{id}/lam-bai` | GET | ExamTake (questions) |
| `/api/v1/de-thi/{id}/nop-bai` | POST | ExamTake (submit) |
| `/api/v1/ket-qua/{deThiId}` | GET | Result |
| `/api/v1/bang-diem` | GET | Scoreboard |
| `/api/v1/limits` | GET | Limits |
| `/api/v1/practice/recommendations` | GET | Limits |
| `/api/v1/gamification` | GET | Gamification |
| `/api/v1/ai-question` | POST | Hỏi AI Ask (JSON or multipart) |
| `/api/v1/ai-question/history` | GET | Hỏi AI History |
| `/api/v1/social-login` | POST | LoginScreen (Google) |
| `/api/v1/comments` | GET, POST | CommentsScreen |
| `/api/v1/hoc-phan/{id}/study-materials` | GET | StudyMaterialsScreen |

---

## 📁 App Project Structure

```
webDaiHocVN73App/
├── src/
│   ├── api/
│   │   └── client.js          # apiClient (get, post, put, postFormData)
│   ├── auth/
│   │   ├── AuthContext.js
│   │   └── storage.js
│   ├── navigation/
│   │   └── AppNavigator.js    # Tabs + stack
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── ForgotPasswordScreen.js
│   │   ├── HomeScreen.js
│   │   ├── SearchScreen.js
│   │   ├── TopicsScreen.js
│   │   ├── TopicDetailScreen.js
│   │   ├── ExamTakeScreen.js
│   │   ├── ResultScreen.js
│   │   ├── ScoreboardScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── LimitsScreen.js
│   │   ├── GamificationScreen.js
│   │   ├── HoiAiAskScreen.js
│   │   ├── HoiAiHistoryScreen.js
│   │   ├── StudyMaterialsScreen.js    # List by hoc_phan_id from API
│   │   └── CommentsScreen.js          # List + create with commentable context
│   └── theme.js
├── assets/
├── App.js
├── package.json
└── APP.md                     # This file
```

---

## 🧪 Testing

### 1. Unit tests (Jest)

From the project root:

```bash
npm test
```

Runs all unit tests (theme, sessionManager, API client, home data normalization). Watch mode:

```bash
npm run test:watch
```

**Test files:**

| Path | What’s tested |
|------|----------------|
| `src/__tests__/theme.test.js` | Theme exports (colors, spacing, gradients, typography, etc.) |
| `src/__tests__/homeData.test.js` | Home API response normalization logic |
| `src/auth/__tests__/sessionManager.test.js` | Session clear and onUnauthorized callback |
| `src/api/__tests__/client.test.js` | API client URL building, auth header, 401 calls clearSession |

### 2. Home API test (manual)

Verifies that `GET /api/v1/home` returns the expected shape. Requires the Laravel backend running; use an auth token if the route is protected.

```bash
npm run test:api
```

**PowerShell (with token):**

```powershell
$env:TOKEN="your-bearer-token"
npm run test:api
```

---

## 📦 Production build (Android)

### Option A: EAS Build (recommended)

Expo Application Services (EAS) builds the app in the cloud and produces an AAB/APK.

1. **Install EAS CLI and log in**
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Configure the project (first time only)**
   ```bash
   eas build:configure
   ```
   This creates `eas.json`. For Android production, use profile `production` (or add one).

3. **Set production API URL**
   In EAS dashboard or via env: set `EXPO_PUBLIC_API_BASE_URL` to your production API (e.g. `https://your-api.com`). You can add this in **eas.json** under the build profile:
   ```json
   "env": {
     "EXPO_PUBLIC_API_BASE_URL": "https://your-api.com"
   }
   ```

4. **Build Android production AAB (for Play Store)**
   ```bash
   eas build --platform android --profile production
   ```
   Or APK for direct install:
   ```bash
   eas build --platform android --profile production
   ```
   In `eas.json`, under the production profile, set `"buildType": "apk"` if you want an APK instead of AAB.

5. **Download the build** from the link EAS prints, or from [expo.dev](https://expo.dev) → your project → Builds.

### Option B: Local Android build (Expo prebuild + Android Studio)

1. **Generate native Android project**
   ```bash
   npx expo prebuild --platform android
   ```

2. **Open in Android Studio**  
   Open the `android` folder, then **Build → Generate Signed Bundle / APK**. Choose **Android App Bundle (AAB)** for Play Store or **APK** for direct install. Create or use an existing keystore.

3. **Set production API URL**  
   Before building, set `EXPO_PUBLIC_API_BASE_URL` in `.env` or export it so the app points to your production API.

### Checklist before production

- [ ] `EXPO_PUBLIC_API_BASE_URL` points to the production API (HTTPS).
- [ ] Version and build number updated in `app.json` (`expo.version`, and `expo.android.versionCode` if you use it).
- [ ] Signing: EAS manages it by default; for local builds use your own keystore.

---

## 🚀 Suggested Next Ports (Priority)

1. **PRO / limits** – Show upgrade CTA and link to web or future in-app purchase when backend is ready.
2. **Facebook login** – Add Facebook SDK and "Đăng nhập bằng Facebook" (backend already accepts `provider: facebook`).

---

*This file is the app counterpart to the web project’s PROJECT.md. Last updated: February 2025.*
