# The Other 99 — Authentication Guide

## Provider

**Supabase** (`@supabase/supabase-js ^2.43.0`) with **PKCE flow**.

Supabase is the sole auth provider. No other auth SDKs are used. The client is
initialized in `src/lib/supabase.ts` and is `null` when `VITE_SUPABASE_URL` /
`VITE_SUPABASE_PUBLISHABLE_KEY` are not set.

---

## Supported auth methods

| Method | Web | Android |
|---|---|---|
| Google OAuth | ✅ | ✅ (A2.1) |
| Magic link (email) | ✅ | — |
| Password | ✅ | — |
| Guest mode | ✅ | ✅ |

---

## Web auth flow

`signInWithGoogle()` calls `supabase.auth.signInWithOAuth` with:

```
redirectTo: window.location.origin
```

Supabase opens the Google consent page. After consent, Google redirects back to
the app's origin. `detectSessionInUrl: true` in the Supabase client config picks
up the fragment and completes the session. `onAuthStateChange` fires.

---

## Android auth flow (A2.1)

### Problem solved

`window.location.origin` inside a Capacitor WebView resolves to `https://localhost`
(because `androidScheme: 'https'` maps the WebView). Using this as `redirectTo`
caused Google to redirect to `https://localhost` — a URL the system browser cannot
hand back to the installed app.

### Solution

Custom URI scheme deep link with PKCE:

```
app.theother99.mvp://auth-callback
```

### Step-by-step

1. `isAndroidNative()` returns `true` (Capacitor on Android native)
2. `signInWithOAuth` is called with `skipBrowserRedirect: true` and
   `redirectTo: app.theother99.mvp://auth-callback` → returns the auth URL
3. `Browser.open({ url })` opens a Chrome Custom Tab at the auth URL
4. User authenticates with Google
5. Google → Supabase callback → Supabase redirects to
   `app.theother99.mvp://auth-callback?code=...`
6. Android intent filter matches the scheme → fires `appUrlOpen` Capacitor event
7. `Browser.close()` dismisses the Chrome Custom Tab
8. `supabase.auth.exchangeCodeForSession(event.url)` completes PKCE
9. `onAuthStateChange` fires → app is authenticated

---

## Android redirect URI

```
app.theother99.mvp://auth-callback
```

This matches the `appId` in `capacitor.config.ts` (`app.theother99.mvp`).

---

## Provider console — owner action items

### Supabase Dashboard

1. Authentication → URL Configuration → Redirect URLs
2. Add: `app.theother99.mvp://auth-callback`
3. Verify existing web redirects are still listed
4. Save

### Google Cloud Console

1. APIs & Services → Credentials → OAuth 2.0 Client ID (Web application type)
2. Authorized redirect URIs must contain:
   `https://<supabase-project-ref>.supabase.co/auth/v1/callback`
3. Do **not** add the `app.theother99.mvp://` scheme here — Supabase handles it

> Never share project refs, service role keys, or publishable keys in issues or PRs.

---

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Project API URL (`https://xxx.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Anon/publishable key only — never service role |

Set in `.env.local` for local dev. Set as repository secrets for CI/CD.

---

## Key source files

| File | Role |
|---|---|
| `src/lib/supabase.ts` | Supabase client init + all auth helpers |
| `src/utils/platform.ts` | `isAndroidNative()`, scheme constants |
| `src/App.tsx` | `onAuthStateChange` listener + Android `appUrlOpen` handler |
| `android/app/src/main/AndroidManifest.xml` | Deep-link intent filter |

---

## Android permissions

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

Only `INTERNET`. No camera, contacts, location, storage, notifications, or other
sensitive permissions. The custom URI scheme intent filter requires no additional permission.

---

## Known limitations

- **Magic link and password auth on Android** — not wired to the Chrome Custom Tab
  flow. They redirect via `window.location.origin` which works only on web. Android
  users should use Google login.
- **iOS** — not in scope for current tracks. `isAndroidNative()` returns `false` on iOS;
  the web path is used. A separate iOS deep-link intent filter would be needed.
- **Session persistence** — handled by Supabase's `persistSession: true` with the
  custom `safeStorage` wrapper (localStorage with try/catch). Sessions survive
  app restarts.
- **No backend user storage beyond Supabase** — profile vectors and quiz state are
  stored in localStorage only. The Supabase `profiles` table stores minimal metadata.
