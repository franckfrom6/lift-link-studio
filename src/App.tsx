import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PlanProvider } from "@/providers/PlanProvider";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import { DisplayModeProvider } from "@/contexts/DisplayModeContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import AuthGuard from "@/components/AuthGuard";
import AuthRedirect from "@/components/AuthRedirect";
import LandingPage from "./pages/LandingPage";
import LegalPage from "./pages/LegalPage";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PricingPage from "./pages/PricingPage";
import JoinRedirect from "./pages/JoinRedirect";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminFeatures from "./pages/admin/AdminFeatures";
import AdminOverrides from "./pages/admin/AdminOverrides";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminKB from "./pages/admin/AdminKB";
import AdminVideoSuggestions from "./pages/admin/AdminVideoSuggestions";
import AdminPilotRequests from "./pages/admin/AdminPilotRequests";

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
import AthleteProgramEditor from "./pages/student/AthleteProgramEditor";
import StudentNutrition from "./pages/student/StudentNutrition";
import StudentRecommendations from "./pages/student/StudentRecommendations";

import SupportLayout from "./layouts/SupportLayout";
import SupportPage from "./pages/support/SupportPage";
import TicketForm from "./pages/support/TicketForm";
import TicketDetail from "./pages/support/TicketDetail";
import KBLayout from "./pages/support/KBLayout";
import KBHome from "./pages/support/KBHome";
import KBArticle from "./pages/support/KBArticle";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ImpersonationProvider>
            <DisplayModeProvider>
            <OnboardingProvider>
            <PlanProvider>
              <ErrorBoundary>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthRedirect><AuthPage /></AuthRedirect>} />
                <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
                <Route path="/legal/:slug" element={<LegalPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/join/:code" element={<JoinRedirect />} />
                <Route path="/onboarding" element={<OnboardingPage />} />

                <Route path="/admin" element={<AuthGuard requireAdmin><AdminLayout /></AuthGuard>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="features" element={<AdminFeatures />} />
                  <Route path="overrides" element={<AdminOverrides />} />
                  <Route path="support" element={<AdminSupport />} />
                  <Route path="kb" element={<AdminKB />} />
                  <Route path="videos" element={<AdminVideoSuggestions />} />
                  <Route path="pilot" element={<AdminPilotRequests />} />
                </Route>

                <Route path="/coach" element={<AuthGuard role="coach"><CoachLayout /></AuthGuard>}>
                  <Route index element={<CoachDashboard />} />
                  <Route path="students" element={<CoachStudents />} />
                  <Route path="students/:studentId" element={<StudentDetail />} />
                  <Route path="students/:studentId/program/new" element={<ProgramEditor />} />
                  <Route path="students/:studentId/program/:programId/edit" element={<ProgramEditor />} />
                  <Route path="students/:studentId/program/:programId" element={<CoachProgramDetail />} />
                  <Route path="students/:studentId/bilan" element={<StudentBilan />} />
                  <Route path="programs" element={<CoachPrograms />} />
                  <Route path="exercises" element={<CoachExercises />} />
                  <Route path="recommendations" element={<CoachRecommendations />} />
                </Route>

                <Route path="/student" element={<AuthGuard role="student"><StudentLayout /></AuthGuard>}>
                  <Route index element={<StudentWeek />} />
                  <Route path="session/:sessionId" element={<LiveSession />} />
                  <Route path="program/edit" element={<AthleteProgramEditor />} />
                  <Route path="progress" element={<StudentProgress />} />
                  <Route path="profile" element={<StudentProfile />} />
                  <Route path="nutrition" element={<StudentNutrition />} />
                  <Route path="recommendations" element={<StudentRecommendations />} />
                </Route>

                <Route path="/support" element={<AuthGuard><SupportLayout /></AuthGuard>}>
                  <Route index element={<SupportPage />} />
                  <Route path="new" element={<TicketForm />} />
                  <Route path="ticket/:ticketId" element={<TicketDetail />} />
                  <Route path="help" element={<KBLayout />}>
                    <Route index element={<KBHome />} />
                    <Route path=":slug" element={<KBArticle />} />
                  </Route>
                </Route>
                {/* Public /aide alias for KB */}
                <Route path="/aide" element={<KBLayout />}>
                  <Route index element={<KBHome />} />
                  <Route path=":slug" element={<KBArticle />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
              </ErrorBoundary>
            </PlanProvider>
            </OnboardingProvider>
            </DisplayModeProvider>
            </ImpersonationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
