import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PlanProvider } from "@/providers/PlanProvider";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import AuthGuard from "@/components/AuthGuard";
import AuthRedirect from "@/components/AuthRedirect";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PricingPage from "./pages/PricingPage";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminFeatures from "./pages/admin/AdminFeatures";
import AdminOverrides from "./pages/admin/AdminOverrides";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminKB from "./pages/admin/AdminKB";

import CoachLayout from "./layouts/CoachLayout";
import CoachDashboard from "./pages/coach/CoachDashboard";
import CoachStudents from "./pages/coach/CoachStudents";
import CoachPrograms from "./pages/coach/CoachPrograms";
import CoachExercises from "./pages/coach/CoachExercises";
import StudentDetail from "./pages/coach/StudentDetail";
import ProgramEditor from "./pages/coach/ProgramEditor";
import StudentBilan from "./pages/coach/StudentBilan";
import CoachRecommendations from "./pages/coach/CoachRecommendations";
import CoachProgramDetail from "./pages/coach/CoachProgramDetail";

import StudentLayout from "./layouts/StudentLayout";
import StudentWeek from "./pages/student/StudentWeek";
import StudentProgress from "./pages/student/StudentProgress";
import StudentProfile from "./pages/student/StudentProfile";
import LiveSession from "./pages/student/LiveSession";
import StudentNutrition from "./pages/student/StudentNutrition";
import StudentRecommendations from "./pages/student/StudentRecommendations";

import SupportPage from "./pages/support/SupportPage";
import TicketForm from "./pages/support/TicketForm";
import TicketDetail from "./pages/support/TicketDetail";
import KBHome from "./pages/support/KBHome";
import KBArticle from "./pages/support/KBArticle";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ImpersonationProvider>
            <PlanProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthRedirect><AuthPage /></AuthRedirect>} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />

                <Route path="/admin" element={<AuthGuard requireAdmin><AdminLayout /></AuthGuard>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="features" element={<AdminFeatures />} />
                  <Route path="overrides" element={<AdminOverrides />} />
                  <Route path="support" element={<AdminSupport />} />
                  <Route path="kb" element={<AdminKB />} />
                </Route>

                <Route path="/coach" element={<AuthGuard role="coach"><CoachLayout /></AuthGuard>}>
                  <Route index element={<CoachDashboard />} />
                  <Route path="students" element={<CoachStudents />} />
                  <Route path="students/:studentId" element={<StudentDetail />} />
                  <Route path="students/:studentId/program/new" element={<ProgramEditor />} />
                  <Route path="students/:studentId/program/:programId" element={<CoachProgramDetail />} />
                  <Route path="students/:studentId/bilan" element={<StudentBilan />} />
                  <Route path="programs" element={<CoachPrograms />} />
                  <Route path="exercises" element={<CoachExercises />} />
                  <Route path="recommendations" element={<CoachRecommendations />} />
                </Route>

                <Route path="/student" element={<AuthGuard role="student"><StudentLayout /></AuthGuard>}>
                  <Route index element={<StudentWeek />} />
                  <Route path="session" element={<LiveSession />} />
                  <Route path="progress" element={<StudentProgress />} />
                  <Route path="profile" element={<StudentProfile />} />
                  <Route path="nutrition" element={<StudentNutrition />} />
                  <Route path="recommendations" element={<StudentRecommendations />} />
                </Route>

                <Route path="/support" element={<SupportPage />} />
                <Route path="/support/new" element={<TicketForm />} />
                <Route path="/support/ticket/:ticketId" element={<TicketDetail />} />
                <Route path="/support/help" element={<KBHome />} />
                <Route path="/support/help/:slug" element={<KBArticle />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </PlanProvider>
            </ImpersonationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
