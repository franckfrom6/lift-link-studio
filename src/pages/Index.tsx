import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, role, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (role === "coach") return <Navigate to="/coach" replace />;
  return <Navigate to="/student" replace />;
};

export default Index;
