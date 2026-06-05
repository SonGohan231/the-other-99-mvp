# The Other 99 — Mobile App Roadmap

## Current State

The Other 99 is a React 18 + Vite 5 + TypeScript single-page application deployed on Vercel.

Capacitor is installed and the Android platform has been added. A debug APK was successfully built. A GitHub Actions workflow is available to build a debug APK artifact on demand.

## Why Capacitor

- Preserves the existing React/Vite codebase without a rewrite
- Supports Android (and iOS in future) from the same web code
- Keeps the Vercel web deployment intact
- PWA installability adds a third deployment channel

---

## How to Download a Debug APK via GitHub Actions

This is the easiest way to get an installable APK without setting up Android Studio locally.

1. Go to the GitHub repository.
2. Click **Actions** in the top navigation.
3. Select **Android Debug APK** from the workflow list on the left.
4. Click **Run workflow** → **Run workflow**.
5. Wait for the build to complete (typically 3–6 minutes).
6. Open the completed workflow run.
7. Scroll down to **Artifacts**.
8. Download **app-debug-apk**.
9. Extract the ZIP — you get `app-debug.apk`.
10. Transfer the APK to your Android device.
11. On Android, go to **Settings → Install unknown apps** and allow installation from your file manager or browser.
12. Open the APK file and install it.

> The debug APK is signed with a debug key and is for **testing only**. It cannot be published to Google Play.

---

## Local Build Steps

### Prerequisites

- Node.js 18+
- Java 17+ (JDK)
- Android Studio with Android SDK (or Android command-line tools)
- `ANDROID_HOME` environment variable pointing to your SDK

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Build the web app
npm run build

# 3. Sync web assets to Android (already added; run this after every web build)
npx cap sync android

# 4. Open Android Studio
npx cap open android
```

Then in Android Studio:
- **Build → Build Bundle(s) / APK(s) → Build APK(s)** for a debug APK
- **Build → Generate Signed Bundle / APK** for a release APK or AAB

### Quick NPM Scripts

```bash
npm run mobile:build          # npm run build + npx cap sync (all platforms)
npm run mobile:android        # npm run build + npx cap sync android
npm run mobile:sync           # npx cap sync (sync only, no rebuild)
npm run mobile:open:android   # npx cap open android
npm run mobile:add:android    # npx cap add android (run once if android/ is missing)
npm run mobile:doctor         # npx cap doctor (diagnose environment)
```

### Command-Line Build (no Android Studio)

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Release APK / AAB

For distribution through Google Play, you need a signed AAB (Android App Bundle).

```bash
cd android
./gradlew bundleRelease
# AAB: android/app/build/outputs/bundle/release/app-release.aab
```

Sign the AAB:
- Use Android Studio: **Build → Generate Signed Bundle / APK**
- Or use `apksigner` / `jarsigner` from the command line with your keystore

**Important:**
- Store your signing keystore securely — never commit it to the repository.
- You need the same keystore for all future updates to the same app.
- Google Play requires target SDK 34+ (Android 14+).

---

## Capacitor Status

| Item | Status |
|---|---|
| @capacitor/core | INSTALLED (8.4.0) |
| @capacitor/cli | INSTALLED (8.4.0) |
| @capacitor/android | INSTALLED (8.4.0) |
| capacitor.config.ts | CONFIGURED |
| Android platform (android/) | ADDED |
| Web assets synced | VERIFIED |
| Debug APK built | VERIFIED (4.3 MB) |
| GitHub Actions workflow | ADDED |
| App icons (branded) | ADDED (programmatic placeholders) |
| Splash screen | TODO |
| Release signing | TODO (requires keystore setup) |
| Google Play submission | TODO |
| iOS platform | TODO (requires macOS + Xcode) |
| App Store submission | TODO |
| Push notifications | TODO |
| Offline mode | TODO |

---

## Capacitor Configuration

`capacitor.config.ts`:
```typescript
{
  appId: 'app.theother99.mvp',
  appName: 'The Other 99',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  plugins: { SplashScreen: { launchShowDuration: 0 } },
}
```

---

## Android Build Details

- `minSdkVersion`: 24 (Android 7.0+)
- `compileSdkVersion`: 36 (Android 16)
- `targetSdkVersion`: 36 (Android 16)
- `MainActivity`: `app.theother99.mvp`
- Package ID: `app.theother99.mvp`
- Gradle wrapper included in repo (no local Gradle needed)

---

## App Icons

| File | Size | Status |
|---|---|---|
| `public/icons/icon.svg` | Source SVG | CREATED |
| `public/icons/icon-192.png` | 192×192 (PWA) | CREATED |
| `public/icons/icon-512.png` | 512×512 (PWA) | CREATED |
| `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` | 48×48 | CREATED |
| `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` | 72×72 | CREATED |
| `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` | 96×96 | CREATED |
| `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` | 144×144 | CREATED |
| `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` | 192×192 | CREATED |

> These icons are programmatically generated placeholders (violet circle, "99" text). Replace with professionally designed assets before Google Play or App Store submission.

---

## PWA Installability

The app is installable as a Progressive Web App:

- Manifest: `public/manifest.webmanifest` (linked in `index.html`)
- `display: standalone`
- `start_url: /`
- `theme_color: #7c3aed`
- `orientation: portrait`
- Icons: 192px and 512px

To install: in Chrome/Edge on Android, tap **Add to Home Screen** from the browser menu. On iOS Safari, tap Share → **Add to Home Screen**.

> A service worker for offline mode is not yet implemented (marked TODO) to avoid caching issues with Supabase auth.

---

## iOS Requirements

- macOS with Xcode 14+ required
- Install `@capacitor/ios`: `npm install @capacitor/ios`
- Add iOS platform: `npx cap add ios`
- Sync: `npx cap sync ios`
- Open: `npx cap open ios`
- Apple Developer Account required for App Store submission
- Apple IAP required for any in-app purchases distributed through the App Store

**Status: TODO** — not started, requires macOS build environment

---

## App Store / Google Play Notes

- Google Play requires target SDK 34+ (Android 14+). Current target is 36 — compliant.
- App Store requires latest Xcode and iOS SDK target.
- Both stores require a privacy policy URL in the app submission.
- In-App Purchases on iOS must go through Apple IAP — no third-party payment processors allowed.
- Debug APK cannot be submitted to any store — use a signed release AAB for Google Play.
