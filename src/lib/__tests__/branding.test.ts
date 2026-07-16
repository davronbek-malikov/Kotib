import { describe, expect, it } from 'vitest';
import { APP_NAME, SHELL_URL } from '../branding';

describe('branding', () => {
  it('exposes the display name', () => {
    expect(APP_NAME).toBe('Kotib');
  });

  it('pins the permanent shell URL', () => {
    // Baked into every APK. Changing this strands installed apps.
    expect(SHELL_URL).toBe('https://yordamchi.vercel.app');
  });
});
