import { Outlet, NavLink, useNavigate, Navigate } from "react-router-dom";
import { Dumbbell, Calendar, BarChart3, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

const StudentLayout = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  if (!loading && !user) return <Navigate to="/auth" replace />;

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const navItems = [
    { to: "/student", icon: Calendar, label: "Semaine", end: true },
    { to: "/student/progress", icon: BarChart3, label: "Progrès" },
    { to: "/student/profile", icon: User, label: "Profil" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-primary-foreground" strokeWidth={1.5} />
          </div>
          <span className="font-bold">FitForge</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Élève
          </span>
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="flex items-center justify-around border-t border-border bg-background py-2 px-4 safe-area-bottom">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-4 text-xs font-medium transition-colors ${
                isActive ? "text-foreground" : "text-muted-foreground"
              }`
            }
          >
            <item.icon className="w-5 h-5" strokeWidth={1.5} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default StudentLayout;
