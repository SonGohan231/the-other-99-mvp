export interface AppInfo {
  version: string;
  commit: string;
  buildDate: string;
  deploySource: string;
  platform: string;
  environment: string;
  supabaseConfigured: boolean;
}

function detectPlatform(): string {
  if (typeof navigator === 'undefined') return 'server';
  const ua = navigator.userAgent;
  if (/Android/.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/capacitor/i.test(ua) || window.location.protocol === 'capacitor:') return 'capacitor';
  return 'web';
}

export function getAppInfo(): AppInfo {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return {
    version: __APP_VERSION__,
    commit: __GIT_COMMIT__,
    buildDate: __BUILD_DATE__,
    deploySource: __DEPLOY_SOURCE__,
    platform: detectPlatform(),
    environment: import.meta.env.MODE,
    supabaseConfigured: Boolean(url && key),
  };
}
