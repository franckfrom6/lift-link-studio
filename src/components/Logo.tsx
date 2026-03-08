import { useTheme } from "@/contexts/ThemeContext";

type LogoVariant = "full" | "compact" | "icon";
type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
}

const sizes = {
  sm: { full: { h: 24, fs: 18 }, compact: { h: 28, w: 28 }, icon: { h: 20, w: 20 } },
  md: { full: { h: 32, fs: 24 }, compact: { h: 36, w: 36 }, icon: { h: 28, w: 28 } },
  lg: { full: { h: 48, fs: 36 }, compact: { h: 48, w: 48 }, icon: { h: 36, w: 36 } },
};

const Logo = ({ variant = "full", size = "md", className = "" }: LogoProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const s = sizes[size];

  const accentColor = "#6C5CE7";
  const textColor = isDark ? "#FFFFFF" : "#1A1A2E";

  if (variant === "icon" || variant === "compact") {
    const dim = variant === "compact" ? s.compact : s.icon;
    const fontSize = dim.h * 0.48;
    return (
      <svg
        width={dim.w}
        height={dim.h}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <rect width="36" height="36" rx="8" fill={accentColor} />
        <text
          x="18"
          y="19"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#FFFFFF"
          fontFamily="Inter, sans-serif"
          fontWeight="800"
          fontSize={fontSize > 0 ? "16" : "16"}
          letterSpacing="-0.02em"
        >
          F6
        </text>
      </svg>
    );
  }

  // Full variant
  const h = s.full.h;
  const fs = s.full.fs;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="36" height="36" rx="8" fill={accentColor} />
        <text
          x="18"
          y="19"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#FFFFFF"
          fontFamily="Inter, sans-serif"
          fontWeight="800"
          fontSize="16"
          letterSpacing="-0.02em"
        >
          F6
        </text>
      </svg>
      <span
        style={{
          fontSize: `${fs}px`,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        <span style={{ color: accentColor }}>F6</span>
        <span style={{ color: textColor }}>GYM</span>
      </span>
    </div>
  );
};

export default Logo;
