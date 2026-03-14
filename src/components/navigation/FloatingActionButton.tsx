import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  className?: string;
}

function triggerHaptic() {
  if ("vibrate" in navigator) navigator.vibrate(10);
}

const FloatingActionButton = ({
  icon: Icon,
  label,
  onClick,
  className,
}: FloatingActionButtonProps) => {
  return (
    <motion.button
      onClick={() => {
        triggerHaptic();
        onClick();
      }}
      className={cn(
        "md:hidden fixed z-50 right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))]",
        "flex items-center gap-2 px-4 py-3 rounded-full",
        "bg-primary text-primary-foreground shadow-lg shadow-primary/25",
        "active:shadow-md",
        className,
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      aria-label={label}
    >
      <Icon className="w-5 h-5" strokeWidth={2} />
      <span className="text-sm font-semibold">{label}</span>
    </motion.button>
  );
};

export default FloatingActionButton;
