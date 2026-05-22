let unlocked = false;

/**
 * Call this once during any user gesture (tap/click).
 * Plays a 1-frame silent <audio> to switch iOS audio session from
 * "ambient" (muted by ringer) to "playback" (never muted by ringer).
 */
export function unlockAudio(): void {
  if (unlocked) return;
  unlocked = true;
  try {
    // Silent inline WAV (44 bytes, 1 sample of silence)
    const silence = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
    const el = new Audio(silence);
    el.volume = 0.001;
    el.play().catch(() => {});
  } catch {}
}
