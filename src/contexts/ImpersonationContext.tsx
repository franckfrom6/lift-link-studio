import React, { createContext, useContext, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface ImpersonatedStudent {
  id: string;
  fullName: string;
}

interface ImpersonationContextType {
  impersonating: ImpersonatedStudent | null;
  startImpersonation: (student: ImpersonatedStudent) => Promise<void>;
  stopImpersonation: () => void;
  effectiveStudentId: (realUserId: string) => string;
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
  const { t } = useTranslation("common");

  const startImpersonation = useCallback(async (student: ImpersonatedStudent) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t("error_occurred"));
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
        toast.error(t("error_occurred"));
        return;
      }

      // Server-side audit trail
      await supabase.from("impersonation_audit").insert({
        coach_id: user.id,
        student_id: student.id,
        event: "start",
      });

      setImpersonating(student);
    } catch {
      toast.error(t("error_occurred"));
    }
  }, [t]);

  const stopImpersonation = useCallback(() => {
    const target = impersonating;
    if (target) {
      void supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          void supabase.from("impersonation_audit").insert({
            coach_id: user.id,
            student_id: target.id,
            event: "stop",
          });
        }
      });
    }
    setImpersonating(null);
  }, [impersonating]);

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
