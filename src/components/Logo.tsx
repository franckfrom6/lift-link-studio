import { useTheme } from "@/contexts/ThemeContext";

interface LogoProps {
  variant?: "full" | "header" | "mobile" | "compact";
  className?: string;
}

const ACCENT = "#6C5CE7";

const Logo = ({ variant = "header", className = "" }: LogoProps) => {
  const { theme } = useTheme();
  const textColor = theme === "dark" ? "#F3F4F6" : "#1A1A1A";

  if (variant === "compact") {
    return (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className={className}>
        <rect width="44" height="44" rx="10" fill={ACCENT} />
        <text x="22" y="23" textAnchor="middle" dominantBaseline="central" fill="#FFF" fontFamily="Inter,sans-serif" fontWeight="900" fontSize="20" letterSpacing="-1">F6</text>
      </svg>
    );
  }

  if (variant === "full") {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div style={{ fontSize: 46, fontWeight: 900, letterSpacing: "-2px", lineHeight: 1, fontFamily: "Inter,sans-serif" }}>
          <span style={{ color: textColor }}>F</span>
          <span style={{ color: ACCENT }}>6</span>
          <span style={{ color: textColor }}>GYM</span>
        </div>
        <span style={{ fontSize: 9, fontWeight: 400, letterSpacing: "5px", color: textColor, opacity: 0.3, marginTop: 6 }}>
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
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width={badgeSize} height={badgeSize} viewBox={`0 0 ${badgeSize} ${badgeSize}`} fill="none">
        <rect width={badgeSize} height={badgeSize} rx={badgeRadius} fill={ACCENT} />
        <text x={badgeSize / 2} y={badgeSize / 2 + 1} textAnchor="middle" dominantBaseline="central" fill="#FFF" fontFamily="Inter,sans-serif" fontWeight="900" fontSize={badgeFontSize} letterSpacing="-0.5">F6</text>
      </svg>
      <span style={{ fontSize: textSize, fontWeight: 900, letterSpacing: "-2px", lineHeight: 1, fontFamily: "Inter,sans-serif" }}>
        <span style={{ color: textColor }}>F</span>
        <span style={{ color: ACCENT }}>6</span>
        <span style={{ color: textColor }}>GYM</span>
      </span>
    </div>
  );
};

export default Logo;
