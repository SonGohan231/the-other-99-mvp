# The Other 99 — Mobile App Roadmap

## Current State

The Other 99 is a React 18 + Vite 5 + TypeScript single-page application deployed on Vercel.

The Capacitor layer has been added to enable packaging this existing web app as a native mobile app without a React Native rewrite.

## Why Capacitor

- Preserves the existing React/Vite codebase without a rewrite
- Supports Android (and iOS in future) from the same web code
- Keeps the Vercel web deployment intact
- PWA installability adds a third deployment channel

## Capacitor Status

Installed packages:
- `@capacitor/core`
- `@capacitor/cli`
- `@capacitor/android`

Config file: `capacitor.config.ts`
- appId: `app.theother99.mvp`
- appName: `The Other 99`
- webDir: `dist`

## Android Build Steps

### Prerequisites

- Node.js 18+
- Java 17+ (JDK)
- Android Studio with Android SDK
- ANDROID_HOME environment variable set

### Steps

```bash
# 1. Build the web app
npm run build

# 2. Add Android platform (run once)
npx cap add android

# 3. Sync web build to Android
npx cap sync android

# 4. Open Android Studio
npx cap open android

# 5. In Android Studio: Build → Generate Signed Bundle / APK
```

### Environment Notes

The `npx cap add android` step requires Android SDK to be installed. In the current CI environment, the Android toolchain is not available. The command is documented here and must be run locally with Android Studio installed.

Status: **PARTIAL** — Capacitor configured, Android platform pending local setup

## APK / AAB Notes

- For Google Play: generate a signed AAB from Android Studio
- For direct distribution: generate a signed APK
- Signing keys should be stored securely and not committed to the repository

## iOS Requirements

- macOS with Xcode 14+ required
- Install `@capacitor/ios`: `npm install @capacitor/ios`
- Add iOS platform: `npx cap add ios`
- Sync: `npx cap sync ios`
- Open: `npx cap open ios`
- Apple Developer Account required for App Store submission

Status: **TODO** — Not started, requires macOS build environment

## PWA Installability

PWA manifest added at `public/manifest.webmanifest`.

- `start_url: /`
- `display: standalone`
- `theme_color: #7c3aed`
- Icon placeholders at `public/icons/` (192px, 512px)

To make fully installable, replace placeholder icon files with actual PNG icons.

## App Store / Google Play Notes

- Google Play requires target SDK 33+ (Android 13+)
- App Store requires latest Xcode and iOS SDK target
- Both stores require privacy policy URL in app submission
- Premium subscription: In-App Purchase must go through store payment systems for App Store submission (Apple IAP required for iOS)

## What Remains

| Item | Status |
|---|---|
| Capacitor configured | IMPLEMENTED |
| Android platform added | BLOCKED (needs local Android SDK) |
| iOS platform | TODO |
| App icons (real) | TODO |
| Splash screen | TODO |
| PWA manifest | IMPLEMENTED |
| Google Play submission | TODO |
| App Store submission | TODO |
| Push notifications | TODO |
| Offline mode | TODO |
