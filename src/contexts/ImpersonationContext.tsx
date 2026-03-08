import React, { createContext, useContext, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImpersonatedStudent {
  id: string;
  fullName: string;
}

interface ImpersonationContextType {
  /** The student being impersonated, or null */
  impersonating: ImpersonatedStudent | null;
  /** Start viewing as a student (coach only) */
  startImpersonation: (student: ImpersonatedStudent) => Promise<void>;
  /** Stop impersonation and go back to coach space */
  stopImpersonation: () => void;
  /** Returns the effective user ID for student queries */
  effectiveStudentId: (realUserId: string) => string;
  /** True when a coach is viewing as a student */
  isImpersonating: boolean;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export const useImpersonation = () => {
  const ctx = useContext(ImpersonationContext);
  if (!ctx) throw new Error("useImpersonation must be used within ImpersonationProvider");
  return ctx;
};

export const ImpersonationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [impersonating, setImpersonating] = useState<ImpersonatedStudent | null>(null);

  const startImpersonation = useCallback(async (student: ImpersonatedStudent) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Non autorisé");
        return;
      }

      const { data, error } = await supabase
        .from("coach_students")
        .select("id")
        .eq("coach_id", user.id)
        .eq("student_id", student.id)
        .eq("status", "active")
        .maybeSingle();

      if (error || !data) {
        toast.error("Non autorisé");
        return;
      }

      setImpersonating(student);
    } catch {
      toast.error("Non autorisé");
    }
  }, []);

  const stopImpersonation = useCallback(() => {
    setImpersonating(null);
  }, []);

  const effectiveStudentId = useCallback(
    (realUserId: string) => impersonating?.id ?? realUserId,
    [impersonating]
  );

  return (
    <ImpersonationContext.Provider
      value={{
        impersonating,
        startImpersonation,
        stopImpersonation,
        effectiveStudentId,
        isImpersonating: !!impersonating,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
};
