
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
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
import { supabase } from "@/integrations/supabase/client";

// Configure query client with better error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000),
      staleTime: 30000,
      onError: (error) => {
        console.error("Query error:", error);
        // We don't want to show toasts for every query error as it could overwhelm the user
      },
    },
  },
});

const App = () => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  // Check connection status on app load
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Simple health check by trying to get the Supabase service version
        const { data, error } = await supabase.from('_anon_health_check').select('*').limit(1);
        
        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "No data found" which is expected for this check
          throw error;
        }
        
        setConnectionStatus('connected');
      } catch (error) {
        console.error("Database connection error:", error);
        setConnectionStatus('error');
        
        // Show toast only once when connection fails
        toast({
          title: "Connection Issue",
          description: "Using offline mode. Some features may be limited.",
          variant: "destructive",
        });
      }
    };
    
    checkConnection();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index connectionStatus={connectionStatus} />} />
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
};

export default App;
