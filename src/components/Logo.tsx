import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface LogoProps {
  variant?: "full" | "header" | "mobile" | "compact";
  className?: string;
}

/**
 * 6way Logo — Fraunces Italic 300 wordmark.
 * - Light theme : "6" en noir, "way" en orange dense (#E84A14)
 * - Dark theme  : "6" en crème, "way" en orange néon (#FF5B1F)
 * variant="compact" affiche uniquement le "6" orange dans un carré arrondi
 * (app-icon style) — utile pour les avatars / favicons inline.
 */
const useIsDark = () => {
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    const update = () => setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [theme]);

  return isDark;
};

const Logo = ({ variant = "header", className = "" }: LogoProps) => {
  const isDark = useIsDark();
  // Orange accent : néon (#FF5B1F) en dark, plus dense (#E84A14) en light
  const accent = isDark ? "#FF5B1F" : "#E84A14";
  // "6" : crème en dark, noir en light
  const sixColor = isDark ? "#F4F4F0" : "#0A0A0B";

  // App-icon style : carré arrondi, fond noir, "6" orange (favicon vibe)
  if (variant === "compact") {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className={className} aria-label="6way">
        <rect width="32" height="32" rx="6" fill="#0A0A0B" />
        <text
          x="16"
          y="25"
          textAnchor="middle"
          fill={accent}
          fontFamily="Fraunces, serif"
          fontWeight={300}
          fontStyle="italic"
          fontSize="30"
        >
          6
        </text>
      </svg>
    );
  }

  // Sizes per variant
  const sizes = {
    full: { width: 184, height: 56, fontSize: 64 },
    header: { width: 92, height: 28, fontSize: 64 },
    mobile: { width: 80, height: 24, fontSize: 64 },
  } as const;
  const { width, height, fontSize } = sizes[variant];

  const wordmark = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 280 80"
      width={width}
      height={height}
      className={className}
      aria-label="6way"
      role="img"
    >
      <text
        x="22"
        y="62"
        fontFamily="Fraunces, serif"
        fontSize={fontSize}
        fontWeight={300}
        fontStyle="italic"
        fill={sixColor}
      >
        6
      </text>
      <text
        x="62"
        y="62"
        fontFamily="Fraunces, serif"
        fontSize={fontSize}
        fontWeight={300}
        fontStyle="italic"
        fill={accent}
      >
        way
      </text>
    </svg>
  );

  if (variant === "full") {
    return (
      <div className={`flex flex-col items-center ${className}`} aria-label="6way">
        {wordmark}
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.18em",
            color: sixColor,
            opacity: 0.5,
            marginTop: 8,
            textTransform: "uppercase",
          }}
        >
          TRAIN · TRACK · EVOLVE
        </span>
      </div>
    );
  }

  return wordmark;
};

export default Logo;