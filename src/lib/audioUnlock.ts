// Garde une référence au contexte audio partagé
let audioCtx: AudioContext | null = null;

/**
 * Appeler lors de n'importe quel geste utilisateur.
 * Si l'AudioContext est suspendu (iOS background/ringer), tente de le réactiver.
 * Joue un silence pour débloquer la session audio iOS.
 */
export function unlockAudio(): void {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Toujours tenter resume() — no-op si déjà running, nécessaire si suspendu
    audioCtx.resume().catch(() => {});

    // Jouer un silence uniquement si le contexte n'est pas encore running
    if (audioCtx.state !== "running") {
      const silence = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
      const el = new Audio(silence);
      el.volume = 0.001;
      el.play().catch(() => {});
    }
  } catch {}
}

/** Retourne le contexte audio partagé (utilisé par LinearRestTimer pour le bip). */
export function getSharedAudioContext(): AudioContext | null {
  return audioCtx;
}
