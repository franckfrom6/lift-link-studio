import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/** Redirects already-authenticated users away from /auth to their dashboard */
const AuthRedirect = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user || !profile) return;

    if (!profile.onboarding_completed) {
      navigate("/onboarding", { replace: true });
      return;
    }

    const dest = profile.role === "coach" ? "/coach" : "/student";
    navigate(dest, { replace: true });
  }, [user, profile, loading, navigate]);

  return <>{children}</>;
};

export default AuthRedirect;
