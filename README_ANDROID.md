# The Other 99 — Android Build Guide

This project uses [Capacitor](https://capacitorjs.com/) to wrap the existing Vite/React web app into a native Android application. The web build and Android shell share the same codebase; there is no React Native rewrite.

---

## Required local tools

| Tool | Version | Notes |
|---|---|---|
| Node.js | ≥ 22 | Required by `package.json` engines field |
| npm | ≥ 10 | Included with Node 22 |
| Java JDK | 17 or 21 | Android Gradle plugin requires JDK 17+ |
| Android Studio | Ladybug / 2024.x or newer | Includes SDK Manager |
| Android SDK | API level 36 (compileSdk) | Install via SDK Manager |
| Android SDK Build-Tools | 36.x | Install via SDK Manager |
| Android SDK Platform-Tools | latest | `adb`, `fastboot` |

**Environment variables required:**

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk     # macOS
export ANDROID_HOME=$HOME/Android/Sdk             # Linux
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

---

## Install steps

```bash
# 1. Clone and install JS dependencies
git clone https://github.com/SonGohan231/the-other-99-mvp.git
cd the-other-99-mvp
npm ci

# 2. Build the web app
npm run build

# 3. Sync web assets into the Android project
npm run android:sync
```

---

## Build debug APK

```bash
# Single command (builds web, syncs, assembles debug APK)
npm run android:build:debug

# Output APK:
# android/app/build/outputs/apk/debug/app-debug.apk
```

To install directly on a connected device:

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Sync steps after web changes

After any web code change, rebuild and re-sync before running on device:

```bash
npm run android:sync
# Then rebuild in Android Studio or run: npm run android:build:debug
```

---

## Open in Android Studio

```bash
npm run android:open
# or
npx cap open android
```

This opens the `android/` Gradle project. Use Android Studio's Run button to deploy to a device or emulator.

---

## Create a release AAB (Android App Bundle)

```bash
npm run android:bundle
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

> **Note:** Release builds are unsigned by default (`minifyEnabled false`). Before Play Store submission, the owner must configure signing — see [Signing / keystore — owner action items](#signing--keystore--owner-action-items) below.

---

## Signing / keystore — owner action items

The current Gradle `release` build type has `minifyEnabled false` and no signing config. To sign for Play Store submission:

1. **Generate a keystore** (one-time):
   ```bash
   keytool -genkey -v -keystore the-other-99-release.jks \
     -alias the-other-99 -keyalg RSA -keysize 2048 -validity 10000
   ```
   Store the `.jks` file and passwords securely. **Do not commit them to git.**

2. **Add signing config to `android/app/build.gradle`** (do not commit passwords in plaintext; use environment variables or `local.properties`):
   ```groovy
   android {
     signingConfigs {
       release {
         storeFile file(System.getenv("KEYSTORE_PATH") ?: "")
         storePassword System.getenv("KEYSTORE_PASS") ?: ""
         keyAlias System.getenv("KEY_ALIAS") ?: ""
         keyPassword System.getenv("KEY_PASS") ?: ""
       }
     }
     buildTypes {
       release {
         signingConfig signingConfigs.release
         minifyEnabled false
         ...
       }
     }
   }
   ```

3. **Set environment variables** before running `npm run android:bundle`:
   ```bash
   export KEYSTORE_PATH=/path/to/the-other-99-release.jks
   export KEYSTORE_PASS=your-store-password
   export KEY_ALIAS=the-other-99
   export KEY_PASS=your-key-password
   ```

---

## App configuration

| Property | Value |
|---|---|
| App name | The Other 99 |
| Package ID | `app.theother99.mvp` |
| Min SDK | 24 (Android 7.0+) |
| Target SDK | 36 |
| Compile SDK | 36 |
| Capacitor version | 8.x |

---

## Permissions requested

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

**Only INTERNET.** No camera, microphone, location, contacts, storage, notifications, or any other sensitive permissions are requested.

---

## How it works

Capacitor wraps the built `dist/` directory into an Android WebView. The web app is served via `https://localhost/` inside the WebView (controlled by `androidScheme: 'https'` in `capacitor.config.ts`). This ensures localStorage and other Web APIs work correctly on Android API 30+.

The v3 content CSVs (`public/v3/*.csv`) are copied into `android/app/src/main/assets/public/v3/` during `cap sync` and are fetched at runtime by the app the same way as on the web.

---

## Play Store readiness checklist

- [ ] **Signing** — keystore created and Gradle signing config in place (owner action)
- [ ] **App icon** — high-res icon at `android/app/src/main/res/mipmap-*/` (currently default launcher icon; replace before store submission)
- [ ] **Splash screen** — `android/app/src/main/res/drawable/splash.png` exists; update to branded asset if desired
- [ ] **Target SDK** — currently 36, which meets current Play Store requirements
- [ ] **Min SDK** — 24 (Android 7.0), covers ~95%+ of active Android devices
- [ ] **Privacy policy URL** — required by Play Store; must be added to the store listing
- [ ] **App description** — store listing copy (not in this repo)
- [ ] **Release notes** — for each store update
- [ ] **Content rating** — complete IARC questionnaire in Play Console
- [ ] **Data safety form** — complete in Play Console (this app collects no personal data; data safety form should reflect local-only storage)
- [ ] **Test on physical device** — smoke test all quiz flows on a real Android device before release

---

## How to share APK with testers

The GitHub Actions APK build produces two distribution options:

### Option A — GitHub pre-release (recommended)

After every CI run, the workflow publishes the APK as a GitHub pre-release tagged `debug-apk-latest`. The APK is attached directly as `the-other-99-debug.apk` (not inside a zip).

To download and share:
1. Go to the repository **Releases** page → find **"Debug APK — latest"** (marked Pre-release).
2. Click `the-other-99-debug.apk` to download the raw APK.
3. Upload the APK to **Google Drive**.
4. Share the Drive link (Viewer access) with the tester.
5. Tester opens the link on their Android device → taps **Download** → opens **Files / Downloads** → taps the APK → **Install**.

> **Do not send the APK file directly through Messenger or WhatsApp.** These apps may block, rename, or fail to open APK files. Google Drive sharing is the most reliable method.

### Option B — GitHub Actions artifact (ZIP)

The CI also uploads a `the-other-99-debug-apk` artifact (available under the workflow run's Artifacts section). This is a ZIP file, not a raw APK.

Manual steps to extract and share:
1. Go to the Actions run → Artifacts → click **the-other-99-debug-apk** to download the zip.
2. Unzip the downloaded file — you will get `app-debug.apk`.
3. Rename it to `the-other-99-debug.apk` for clarity.
4. Upload to Google Drive and share the link (see Option A steps 3–5 above).

### Tester install instructions

Send these instructions to the tester along with the Google Drive link:

> 1. Open the Google Drive link on your Android phone.
> 2. Tap the three-dot menu → **Download**.
> 3. Open your phone's **Files** or **Downloads** app and find `the-other-99-debug.apk`.
> 4. Tap the file → tap **Install**.
> 5. If prompted, allow **Install unknown apps** for the Files app (Settings → Special app access → Install unknown apps).
> 6. Once installed, open **The Other 99** from your home screen.

---

## Authentication — Google Sign-In on Android (A2.1)

### Auth provider

**Supabase** with PKCE flow (`@supabase/supabase-js ^2.43.0`). Google OAuth is
handled via Supabase's `signInWithOAuth` helper.

### Root cause (fixed in A2.1)

Inside the Capacitor WebView, `window.location.origin` resolves to `https://localhost`
(because `androidScheme: 'https'` is set in `capacitor.config.ts`). The previous
`redirectTo: window.location.origin` caused Google to redirect back to `https://localhost`
after OAuth — a URL the system browser cannot route back to the installed app.

### Fix

The Android path now uses a **custom URI scheme deep link**:

```
app.theother99.mvp://auth-callback
```

Flow:
1. `signInWithGoogle()` detects `isAndroidNative()` → calls `signInWithOAuth` with
   `skipBrowserRedirect: true` and `redirectTo: app.theother99.mvp://auth-callback`
2. The returned authorization URL is opened in a **Chrome Custom Tab** via
   `@capacitor/browser`
3. After Google auth, the browser is redirected to `app.theother99.mvp://auth-callback?code=...`
4. Android intercepts the deep link (intent filter in `AndroidManifest.xml`) and fires
   the `appUrlOpen` Capacitor event
5. `Browser.close()` dismisses the Custom Tab
6. `supabase.auth.exchangeCodeForSession(url)` completes the PKCE exchange
7. `onAuthStateChange` fires — the user is authenticated inside the Android app

Web login is completely unchanged — it still uses `redirectTo: window.location.origin`
with Supabase's `detectSessionInUrl: true`.

### Provider console — owner actions required

These steps must be completed by the project owner before real-device Google login works:

**1. Supabase Dashboard**
- Go to: Authentication → URL Configuration → Redirect URLs
- Add: `app.theother99.mvp://auth-callback`
- Confirm existing web redirect URLs are still present

**2. Google Cloud Console**
- Go to: APIs & Services → Credentials → OAuth 2.0 Client ID (Web application type)
- Confirm Authorized redirect URIs contains:
  `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
- Do **not** add the custom scheme here — Supabase handles it internally

> Do not share project refs or secret keys in issues or PRs.

### AndroidManifest — intent filter added

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="app.theother99.mvp" />
</intent-filter>
```

This filter sits alongside the existing `MAIN`/`LAUNCHER` filter on `MainActivity`.
`launchMode="singleTask"` (already set) ensures the existing activity instance receives
the deep link rather than creating a new one.

### Files changed in A2.1

| File | Purpose |
|---|---|
| `src/utils/platform.ts` | `isAndroidNative()`, `ANDROID_AUTH_SCHEME`, `ANDROID_AUTH_REDIRECT_URL` |
| `src/lib/supabase.ts` | Platform-aware `signInWithGoogle()` |
| `src/App.tsx` | `appUrlOpen` listener — closes Custom Tab, completes PKCE |
| `android/app/src/main/AndroidManifest.xml` | Intent filter for custom scheme |

### Manual Android smoke test checklist

After installing the new APK and completing provider console setup:

- [ ] Tap Google login → Chrome Custom Tab opens (not a bare WebView)
- [ ] Complete Google login → app returns automatically, Custom Tab closes
- [ ] User is authenticated inside the Android app (not stranded in a browser)
- [ ] Cancel login → returns safely to auth screen, no crash
- [ ] Failed/invalid login → safe retry state, no infinite redirect
- [ ] No black screen after callback
- [ ] Back button during auth does not corrupt session
- [ ] Close/reopen preserves session
- [ ] Quiz starts, Question 1 has exactly 4 answers
- [ ] No `[variant]` / `[wariant]` placeholder text
- [ ] Daily Card, reflection history, and announcement (Online B1/B2) still work

---

## Known limitations

- **Gradle build requires Android SDK locally.** CI environments without the Android SDK can only run `npm run build` + `npx cap sync`. The APK/AAB must be built locally or in a CI environment with the Android SDK configured.
- **No code splitting yet.** The JS bundle is ~821 KB (gzipped ~234 KB). Startup is fast over local WebView assets but may be worth splitting in a future track.
- **Back button exits the app.** The quiz state is fully persisted in localStorage; reopening the app resumes the session. No state is lost.
- **No proguard/R8 minification** (`minifyEnabled false`). Safe for current APK size; consider enabling before Play Store release to reduce APK size.
- **No signed release build in automated CI.** A release-signed AAB requires the owner's keystore — see signing section above.

---

## Stages 3–10 regression confirmation

All 497 unit tests pass (including Stages 3–10 engines) after Android integration:

```
Test Files  12 passed (12)
Tests       497 passed (497)
```

The Android build does not modify any engine files. The web deployment at `https://the-other-99-mvp.vercel.app` continues to work unchanged.
