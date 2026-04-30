import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";

interface LogoProps {
  variant?: "full" | "header" | "mobile" | "compact";
  className?: string;
}

/**
 * F6GYM Logo
 * - Light theme : "F" et "GYM" en noir, "6" en bleu Klein (#1A3CFF — primary)
 * - Dark theme  : "F" et "GYM" en blanc, "6" en orange (#FF6A1A — primary)
 * Le badge "F6" du variant compact/header utilise la couleur primary du thème,
 * avec un foreground contrasté.
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
  // Couleur signature : bleu Klein en light, orange en dark
  const accent = isDark ? "#FF6A1A" : "#1A3CFF";
  // Lettres : noir en light, blanc en dark
  const textColor = isDark ? "#F3F4F6" : "#0A0A0A";
  // Foreground du badge (contraste sur l'accent)
  const badgeFg = isDark ? "#0A0A0A" : "#FFFFFF";

  if (variant === "compact") {
    return (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className={className} aria-label="F6GYM">
        <rect width="44" height="44" rx="10" fill={accent} />
        <text
          x="22"
          y="23"
          textAnchor="middle"
          dominantBaseline="central"
          fill={badgeFg}
          fontFamily="Inter,sans-serif"
          fontWeight="900"
          fontSize="20"
          letterSpacing="-1"
        >
          F6
        </text>
      </svg>
    );
  }

  if (variant === "full") {
    return (
      <div className={`flex flex-col items-center ${className}`} aria-label="F6GYM Coaching">
        <div
          style={{
            fontSize: 46,
            fontWeight: 900,
            letterSpacing: "-2px",
            lineHeight: 1,
            fontFamily: "Inter,sans-serif",
          }}
        >
          <span style={{ color: textColor }}>F</span>
          <span style={{ color: accent }}>6</span>
          <span style={{ color: textColor }}>GYM</span>
        </div>
        <span
          style={{
            fontSize: 9,
            fontWeight: 400,
            letterSpacing: "5px",
            color: textColor,
            opacity: 0.3,
            marginTop: 6,
          }}
        >
          COACHING
        </span>
      </div>
    );
  }

  // header & mobile
  const isHeader = variant === "header";
  const badgeSize = isHeader ? 36 : 32;
  const badgeRadius = isHeader ? 8 : 7;
  const badgeFontSize = isHeader ? 15 : 13;
  const textSize = isHeader ? 20 : 16;

  return (
    <div className={`flex items-center gap-2 ${className}`} aria-label="F6GYM">
      <svg width={badgeSize} height={badgeSize} viewBox={`0 0 ${badgeSize} ${badgeSize}`} fill="none">
        <rect width={badgeSize} height={badgeSize} rx={badgeRadius} fill={accent} />
        <text
          x={badgeSize / 2}
          y={badgeSize / 2 + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fill={badgeFg}
          fontFamily="Inter,sans-serif"
          fontWeight="900"
          fontSize={badgeFontSize}
          letterSpacing="-0.5"
        >
          F6
        </text>
      </svg>
      <span
        style={{
          fontSize: textSize,
          fontWeight: 900,
          letterSpacing: "-2px",
          lineHeight: 1,
          fontFamily: "Inter,sans-serif",
        }}
      >
        <span style={{ color: textColor }}>F</span>
        <span style={{ color: accent }}>6</span>
        <span style={{ color: textColor }}>GYM</span>
      </span>
    </div>
  );
};

export default Logo;