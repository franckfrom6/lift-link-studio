import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { bumpPendingCount } from "@/lib/offline-queue";
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
import UnsubscribePage from "./pages/UnsubscribePage";

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
import StudentNutritionPlan from "./pages/coach/StudentNutritionPlan";
import AthleteNutritionPlan from "./pages/student/StudentNutritionPlan";
import ProgramEditor from "./pages/coach/ProgramEditor";
import StudentBilan from "./pages/coach/StudentBilan";
import CoachRecommendations from "./pages/coach/CoachRecommendations";
import CoachProgramDetail from "./pages/coach/CoachProgramDetail";

import StudentLayout from "./layouts/StudentLayout";
import StudentWeek from "./pages/student/StudentWeek";
import StudentProgress from "./pages/student/StudentProgress";
import StudentProfile from "./pages/student/StudentProfile";
import LiveSession from "./pages/student/LiveSession";
import SessionPreview from "./pages/student/SessionPreview";
import RunningLiveSession from "./pages/student/RunningLiveSession";
import AthleteProgramEditor from "./pages/student/AthleteProgramEditor";
import StudentNutrition from "./pages/student/StudentNutrition";
import StudentRecommendations from "./pages/student/StudentRecommendations";
import ExerciseDetailPage from "./pages/ExerciseDetailPage";

import SupportLayout from "./layouts/SupportLayout";
import SupportPage from "./pages/support/SupportPage";
import TicketForm from "./pages/support/TicketForm";
import TicketDetail from "./pages/support/TicketDetail";
import KBLayout from "./pages/support/KBLayout";
import KBHome from "./pages/support/KBHome";
import KBArticle from "./pages/support/KBArticle";

/**
 * MutationCache instrumentation (PR3 nutrition offline queue).
 *
 * - When a mutation is queued while offline, `onMutate` increments the
 *   "pending" counter exposed by the OfflineQueueBadge.
 * - On `onSettled`, we decrement. Errors keep the counter intact (the
 *   user retries). This is intentionally simple: TanStack Query already
 *   handles pause/resume of mutations across reconnects.
 */
const mutationCache = new MutationCache({
  onMutate: () => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      void bumpPendingCount(1);
    }
  },
  onSettled: (_data, error) => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      // Will be replayed on reconnect; counter stays.
      return;
    }
    if (!error) void bumpPendingCount(-1);
  },
});

const queryClient = new QueryClient({
  mutationCache,
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 60 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
      networkMode: "offlineFirst",
    },
    mutations: {
      networkMode: "offlineFirst",
      retry: 1,
    },
  },
});

const persister = typeof window !== "undefined"
  ? createSyncStoragePersister({
      storage: window.localStorage,
      key: "f6gym-query-cache",
      throttleTime: 1000,
    })
  : undefined;

const PERSISTED_QUERY_KEYS = new Set([
  "student-program",
  "week-free-sessions",
  "week-external-sessions",
  "week-checkin",
  "exercises",
  "student-profile",
]);

const App = () => (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{
      persister: persister!,
      maxAge: 24 * 60 * 60 * 1000,
      dehydrateOptions: {
        shouldDehydrateQuery: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && PERSISTED_QUERY_KEYS.has(key);
        },
      },
    }}
  >
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
                <Route path="/unsubscribe" element={<UnsubscribePage />} />

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
                  <Route path="students/:studentId/nutrition-plan" element={<StudentNutritionPlan />} />
                  <Route path="students/:studentId/exercise/:exerciseId" element={<ExerciseDetailPage />} />
                  <Route path="programs" element={<CoachPrograms />} />
                  <Route path="exercises" element={<CoachExercises />} />
                  <Route path="recommendations" element={<CoachRecommendations />} />
                </Route>

                <Route path="/student" element={<AuthGuard role="student"><StudentLayout /></AuthGuard>}>
                  <Route index element={<StudentWeek />} />
                  <Route path="session/:sessionId/preview" element={<SessionPreview />} />
                  <Route path="session/:sessionId" element={<LiveSession />} />
                  <Route path="run/:sessionId" element={<RunningLiveSession />} />
                  <Route path="program/edit" element={<AthleteProgramEditor />} />
                  <Route path="progress" element={<StudentProgress />} />
                  <Route path="profile" element={<StudentProfile />} />
                  <Route path="nutrition" element={<StudentNutrition />} />
                  <Route path="nutrition-plan" element={<AthleteNutritionPlan />} />
                  <Route path="recommendations" element={<StudentRecommendations />} />
                  <Route path="exercise/:exerciseId" element={<ExerciseDetailPage />} />
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
  </PersistQueryClientProvider>
);

export default App;
