import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";

import CoachLayout from "./layouts/CoachLayout";
import CoachDashboard from "./pages/coach/CoachDashboard";
import CoachStudents from "./pages/coach/CoachStudents";
import CoachPrograms from "./pages/coach/CoachPrograms";
import CoachExercises from "./pages/coach/CoachExercises";

import StudentLayout from "./layouts/StudentLayout";
import StudentWeek from "./pages/student/StudentWeek";
import StudentProgress from "./pages/student/StudentProgress";
import StudentProfile from "./pages/student/StudentProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* Coach routes */}
            <Route
              path="/coach"
              element={
                <ProtectedRoute requiredRole="coach">
                  <CoachLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<CoachDashboard />} />
              <Route path="students" element={<CoachStudents />} />
              <Route path="programs" element={<CoachPrograms />} />
              <Route path="exercises" element={<CoachExercises />} />
            </Route>

            {/* Student routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<StudentWeek />} />
              <Route path="progress" element={<StudentProgress />} />
              <Route path="profile" element={<StudentProfile />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
