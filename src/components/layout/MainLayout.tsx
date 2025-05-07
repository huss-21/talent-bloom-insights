
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { SidebarProvider } from "@/components/ui/sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  roles?: string[];
}

export const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  requireAuth = true,
  roles = [] 
}) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-corporate-teal border-t-corporate-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  // Redirect if auth required but not logged in
  if (requireAuth && !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect if role not allowed
  if (currentUser && roles.length > 0 && !roles.includes(currentUser.role)) {
    // Redirect to appropriate homepage based on role
    if (currentUser.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/applicant/dashboard" replace />;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SidebarProvider>
        <div className="flex min-h-screen">
          {currentUser && <AppSidebar />}
          <div className="flex flex-col flex-1 min-h-screen">
            {currentUser && <TopBar />}
            <main className="flex-1 p-6">
              <div className="mx-auto max-w-7xl">{children}</div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};
