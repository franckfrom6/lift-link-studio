interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "coach" | "student";
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  return <>{children}</>;
};

export default ProtectedRoute;
