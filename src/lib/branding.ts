/**
 * The single place the product's display name lives. `plan.md` recommends
 * renaming away from "Kotib" (KOTIB AI already exists in Uzbekistan), so a
 * rename must stay a one-line change. Never hardcode the name in components.
 */
export const APP_NAME = 'Kotib';

/**
 * The URL baked into the Android shell (`capacitor.config.ts`). Permanent:
 * installed APKs load this and nothing else, so changing it strands them.
 */
export const SHELL_URL = 'https://yordamchi.vercel.app';
