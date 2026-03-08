import React, { createContext, useContext, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface ImpersonatedStudent {
  id: string;
  fullName: string;
}

interface ImpersonationContextType {
  /** The student being impersonated, or null */
  impersonating: ImpersonatedStudent | null;
  /** Start viewing as a student (coach only) */
  startImpersonation: (student: ImpersonatedStudent) => void;
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

  const startImpersonation = useCallback((student: ImpersonatedStudent) => {
    setImpersonating(student);
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
