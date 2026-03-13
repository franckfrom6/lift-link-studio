import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type DisplayMode = "simple" | "advanced";

interface DisplayModeContextType {
  mode: DisplayMode;
  toggle: () => void;
  isAdvanced: boolean;
}

const DisplayModeContext = createContext<DisplayModeContextType>({
  mode: "simple",
  toggle: () => {},
  isAdvanced: false,
});

export const useDisplayMode = () => useContext(DisplayModeContext);
export const useIsAdvanced = () => useContext(DisplayModeContext).isAdvanced;

const STORAGE_KEY = "display_mode";

export const DisplayModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, user } = useAuth();

  // Determine initial mode: profile DB value > localStorage > role-based default
  const getInitialMode = (): DisplayMode => {
    if (profile?.display_mode === "advanced" || profile?.display_mode === "simple") {
      return profile.display_mode as DisplayMode;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "advanced" || stored === "simple") return stored;
    // Coaches default to advanced, students to simple
    return profile?.role === "coach" ? "advanced" : "simple";
  };

  const [mode, setMode] = useState<DisplayMode>(getInitialMode);

  // Sync when profile loads
  useEffect(() => {
    setMode(getInitialMode());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.display_mode, profile?.role]);

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next: DisplayMode = prev === "simple" ? "advanced" : "simple";
      localStorage.setItem(STORAGE_KEY, next);
      // Persist to DB if logged in
      if (user) {
        supabase
          .from("profiles")
          .update({ display_mode: next } as any)
          .eq("user_id", user.id)
          .then();
      }
      return next;
    });
  }, [user]);

  return (
    <DisplayModeContext.Provider value={{ mode, toggle, isAdvanced: mode === "advanced" }}>
      {children}
    </DisplayModeContext.Provider>
  );
};
