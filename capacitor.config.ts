import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // PERMANENT. Changing appId forces every user to uninstall and reinstall.
  appId: 'com.yordamchi.app',
  // Display name only — safe to change on a rebrand. Mirrors lib/branding.ts.
  appName: 'Kotib',
  webDir: 'dist',
  server: {
    // The app loads the live web build, so every Vercel production deploy
    // reaches installed phones automatically — no reinstall, no store.
    // PERMANENT: installed APKs load this URL and nothing else.
    // Trade-off (accepted, spec §5): the app needs internet to start.
    url: 'https://yordamchi.vercel.app',
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#1E6B54',
    },
  },
};

export default config;
