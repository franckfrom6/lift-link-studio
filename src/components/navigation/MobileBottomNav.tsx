import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback } from "react";

export interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  end?: boolean;
}

interface MobileBottomNavProps {
  items: NavItem[];
}

function triggerHaptic(style: "light" | "medium" = "light") {
  if ("vibrate" in navigator) {
    navigator.vibrate(style === "light" ? 6 : 12);
  }
}

const springTransition = {
  type: "spring" as const,
  stiffness: 500,
  damping: 30,
  mass: 0.8,
};

const MobileBottomNav = ({ items }: MobileBottomNavProps) => {
  const location = useLocation();

  const isActive = useCallback(
    (to: string, end?: boolean) => {
      if (end) return location.pathname === to;
      return location.pathname.startsWith(to);
    },
    [location.pathname],
  );

  return (
    <nav
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-40",
        "border-t border-border/50",
        "bg-background/80 backdrop-blur-xl backdrop-saturate-150",
        "safe-area-bottom",
      )}
    >
      <div className="flex items-center overflow-x-auto scrollbar-hide px-2 py-1.5 gap-1">
        {items.map((item) => {
          const active = isActive(item.to, item.end);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => triggerHaptic(active ? "light" : "medium")}
              className="flex-shrink-0"
            >
              <motion.div
                className={cn(
                  "relative flex items-center justify-center rounded-2xl transition-colors",
                  "min-w-[48px] min-h-[48px]",
                  active
                    ? "text-primary"
                    : "text-muted-foreground active:text-foreground",
                )}
                whileTap={{ scale: 0.9 }}
                transition={springTransition}
              >
                {/* Active pill background */}
                <AnimatePresence>
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-2xl bg-primary/10"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={springTransition}
                    />
                  )}
                </AnimatePresence>

                <div
                  className={cn(
                    "relative z-10 flex items-center gap-1.5",
                    active ? "px-3 py-1.5" : "p-1.5",
                  )}
                >
                  <motion.div
                    animate={active ? { scale: 1.05 } : { scale: 1 }}
                    transition={springTransition}
                  >
                    <item.icon
                      className="w-5 h-5"
                      strokeWidth={active ? 2.2 : 1.5}
                      fill={active ? "currentColor" : "none"}
                    />
                  </motion.div>

                  <AnimatePresence mode="wait">
                    {active && (
                      <motion.span
                        key={item.to}
                        className="text-xs font-semibold whitespace-nowrap leading-none"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "auto", opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ ...springTransition, stiffness: 400 }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
