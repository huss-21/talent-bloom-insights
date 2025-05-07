
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  User,
  Briefcase,
  FileText,
  BarChart,
  Settings,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  if (!currentUser) return null;
  
  const isActive = (path: string) => location.pathname.startsWith(path);
  
  const adminMenuItems = [
    { title: "Dashboard", icon: BarChart, path: "/admin/dashboard" },
    { title: "Job Openings", icon: Briefcase, path: "/admin/jobs" },
    { title: "Applications", icon: FileText, path: "/admin/applications" },
    { title: "Applicants", icon: Users, path: "/admin/applicants" },
    { title: "Settings", icon: Settings, path: "/admin/settings" },
  ];
  
  const applicantMenuItems = [
    { title: "Dashboard", icon: BarChart, path: "/applicant/dashboard" },
    { title: "Job Openings", icon: Briefcase, path: "/applicant/jobs" },
    { title: "My Applications", icon: FileText, path: "/applicant/applications" },
    { title: "Upload Resume", icon: Upload, path: "/applicant/upload" },
  ];
  
  const menuItems = currentUser.role === "admin" ? adminMenuItems : applicantMenuItems;
  
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center p-2">
          <div className="w-10 h-10 rounded-md bg-corporate-gold flex items-center justify-center text-white font-bold text-lg mr-2">
            HR
          </div>
          <h1 className="text-xl font-bold text-white">HRMS Portal</h1>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{currentUser.role === "admin" ? "Admin" : "Applicant"} Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    className={isActive(item.path) ? "bg-corporate-teal" : ""}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate(item.path)}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      <span>{item.title}</span>
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-4">
          <div className="flex items-center space-x-3 bg-corporate-blue-light p-2 rounded-md">
            <div className="bg-corporate-gold rounded-full p-1">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{currentUser.name}</p>
              <p className="text-xs text-gray-300">{currentUser.email}</p>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
