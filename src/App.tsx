
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminDashboard from "./pages/admin/Dashboard";
import JobManagement from "./pages/admin/JobManagement";
import JobApplicants from "./pages/admin/JobApplicants";
import ApplicationReview from "./pages/admin/ApplicationReview";
import ApplicantDashboard from "./pages/applicant/Dashboard";
import JobBrowse from "./pages/applicant/JobBrowse";
import ResumeUpload from "./pages/applicant/ResumeUpload";
import ApplicationStatus from "./pages/applicant/ApplicationStatus";
import Applicants from "./pages/admin/Applicants";
import LLMConfig from "./pages/admin/LLMConfig";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/jobs" element={<JobManagement />} />
            <Route path="/admin/jobs/:jobId/applicants" element={<JobApplicants />} />
            <Route path="/admin/applications" element={<ApplicationReview />} />
            <Route path="/admin/applicants" element={<Applicants />} />
            <Route path="/admin/llm-config" element={<LLMConfig />} />
            
            {/* Applicant Routes */}
            <Route path="/applicant/dashboard" element={<ApplicantDashboard />} />
            <Route path="/applicant/jobs" element={<JobBrowse />} />
            <Route path="/applicant/upload" element={<ResumeUpload />} />
            <Route path="/applicant/applications" element={<ApplicationStatus />} />
            
            {/* Catch-all 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
