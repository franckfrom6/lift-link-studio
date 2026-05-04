import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, User, ExternalLink } from "lucide-react";

export interface VideoPlayerSheetProps {
  open: boolean;
  onClose: () => void;
  videoId: string;
  exerciseName: string;
  muscle?: string | null;
  category?: string | null;
  coachName?: string | null;
}

export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export function VideoPlayerSheet({
  open,
  onClose,
  videoId,
  exerciseName,
  muscle,
  category,
  coachName,
}: VideoPlayerSheetProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Lock body scroll + theme-color while open
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const prevTheme = themeMeta?.getAttribute("content") ?? null;
    if (themeMeta) themeMeta.setAttribute("content", "#000000");
    return () => {
      document.body.style.overflow = prevOverflow;
      if (themeMeta && prevTheme !== null) themeMeta.setAttribute("content", prevTheme);
    };
  }, [open]);

  // ESC closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = () => {
    // Pause via YouTube IFrame API postMessage before unmount
    try {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
        "*"
      );
    } catch {
      /* noop */
    }
    onClose();
  };

  if (!open) return null;

  const subline = [muscle, category].filter(Boolean).join(" · ");
  const embedSrc = `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&playsinline=1&color=white&iv_load_policy=3&autoplay=1&enablejsapi=1`;
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Démonstration · ${exerciseName}`}
      className="fixed inset-0 z-[60] animate-fade-in"
      style={{
        background: "#000",
        height: "100dvh",
        touchAction: "none",
        fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)",
      }}
    >
      <div
        className="flex h-full w-full flex-col"
        style={{ animation: "slide-in-right 280ms cubic-bezier(0.32,0.72,0,1)" }}
      >
        {/* Header overlay */}
        <div
          className="absolute inset-x-0 top-0 z-10 flex items-center gap-3"
          style={{
            padding: "44px 16px 14px",
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 100%)",
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fermer"
            className="flex shrink-0 items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--r-sm, 8px)",
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              color: "#fff",
            }}
          >
            <X size={16} strokeWidth={2} />
          </button>
          <div className="min-w-0 flex-1">
            <div
              className="t-caption"
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: "rgba(255,255,255,0.6)",
                marginBottom: 2,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Démonstration
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                color: "#fff",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {exerciseName}
            </div>
          </div>
        </div>

        {/* YouTube viewport */}
        <div
          className="relative flex flex-1 items-center justify-center"
          style={{ background: "#000" }}
        >
          <iframe
            ref={iframeRef}
            src={embedSrc}
            title={`${exerciseName} démonstration`}
            width="100%"
            height="100%"
            frameBorder={0}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>

        {/* Bottom meta panel */}
        <div
          className="relative"
          style={{
            background: "#0a0a0a",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            padding: "16px 16px 24px",
          }}
        >
          <div
            className="t-caption"
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 4,
            }}
          >
            Exercice
          </div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#fff",
            }}
          >
            {exerciseName}
          </div>
          {subline && (
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.65)",
                marginTop: 2,
              }}
            >
              {subline}
            </div>
          )}

          {coachName && (
            <div
              className="flex items-center"
              style={{ marginTop: 14, gap: 10 }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "var(--r-xs, 6px)",
                  background: "rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.85)",
                  flexShrink: 0,
                }}
              >
                <User size={13} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>
                  Sélection {coachName}
                </div>
                <div
                  className="t-caption"
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginTop: 1,
                  }}
                >
                  Source · YouTube
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => window.open(watchUrl, "_blank", "noopener,noreferrer")}
            className="flex w-full items-center justify-center gap-2"
            style={{
              marginTop: 14,
              padding: "11px 14px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "var(--r-sm, 8px)",
              color: "rgba(255,255,255,0.9)",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "-0.005em",
            }}
          >
            <ExternalLink size={13} strokeWidth={2} />
            Ouvrir sur YouTube
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default VideoPlayerSheet;