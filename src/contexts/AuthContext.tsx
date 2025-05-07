
import React, { createContext, useState, useContext, useEffect } from "react";
import { User, Role } from "@/types";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string, role: Role) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data - would be replaced with actual authentication
const MOCK_USERS: User[] = [
  {
    id: "1",
    email: "admin@example.com",
    name: "Admin User",
    role: "admin"
  },
  {
    id: "2",
    email: "applicant@example.com",
    name: "John Applicant",
    role: "applicant"
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user in local storage
    const storedUser = localStorage.getItem("hrms_user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // In a real app, this would make an API request
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user = MOCK_USERS.find(u => u.email === email);
      if (!user) {
        throw new Error("Invalid credentials");
      }
      
      // Store in local storage
      localStorage.setItem("hrms_user", JSON.stringify(user));
      setCurrentUser(user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("hrms_user");
    setCurrentUser(null);
  };

  const register = async (email: string, password: string, name: string, role: Role) => {
    // In a real app, this would make an API request
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if email is already used
      if (MOCK_USERS.some(u => u.email === email)) {
        throw new Error("Email already in use");
      }
      
      const newUser: User = {
        id: `${MOCK_USERS.length + 1}`,
        email,
        name,
        role
      };
      
      // Store in local storage
      localStorage.setItem("hrms_user", JSON.stringify(newUser));
      setCurrentUser(newUser);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
    register
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
