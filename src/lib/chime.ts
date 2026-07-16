/**
 * A soft two-note chime (plan.md §3.3). Synthesized with WebAudio rather than
 * shipping an mp3 — one less asset, and it works identically on web and in the
 * Android WebView.
 */
export function playChime(): void {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const now = ctx.currentTime;

    for (const [i, freq] of [880, 1174.7].entries()) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.16;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.5);
    }
    setTimeout(() => void ctx.close(), 1200);
  } catch {
    /* Autoplay blocked or no WebAudio — the visual banner still shows. */
  }
}
