import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";

import CoachLayout from "./layouts/CoachLayout";
import CoachDashboard from "./pages/coach/CoachDashboard";
import CoachStudents from "./pages/coach/CoachStudents";
import CoachPrograms from "./pages/coach/CoachPrograms";
import CoachExercises from "./pages/coach/CoachExercises";
import StudentDetail from "./pages/coach/StudentDetail";
import ProgramEditor from "./pages/coach/ProgramEditor";

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
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<AuthPage />} />

          <Route path="/coach" element={<CoachLayout />}>
            <Route index element={<CoachDashboard />} />
            <Route path="students" element={<CoachStudents />} />
            <Route path="programs" element={<CoachPrograms />} />
            <Route path="exercises" element={<CoachExercises />} />
          </Route>

          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<StudentWeek />} />
            <Route path="progress" element={<StudentProgress />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
