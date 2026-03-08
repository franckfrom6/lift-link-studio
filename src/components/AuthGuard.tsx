import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  role?: "coach" | "student";
  requireAdmin?: boolean;
}

const AuthGuard = ({ children, role, requireAdmin }: AuthGuardProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    // Not authenticated
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    // No profile yet (shouldn't happen but safety)
    if (!profile) return;

    // Onboarding not completed
    if (!profile.onboarding_completed) {
      navigate("/onboarding", { replace: true });
      return;
    }

    // Role mismatch
    if (role && profile.role !== role) {
      const dest = profile.role === "coach" ? "/coach" : "/student";
      navigate(dest, { replace: true });
      return;
    }

    // Admin required
    if (requireAdmin && !profile.is_admin) {
      const dest = profile.role === "coach" ? "/coach" : "/student";
      navigate(dest, { replace: true });
      return;
    }
  }, [user, profile, loading, role, requireAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !profile) return null;

  return <>{children}</>;
};

export default AuthGuard;
