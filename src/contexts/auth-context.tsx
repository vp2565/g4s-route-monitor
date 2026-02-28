"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { DemoUser, UserRole, DEMO_USERS, isDarkRole } from "@/types";

interface AuthContextType {
  user: DemoUser | null;
  login: (user: DemoUser) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  isSOCOperator: boolean;
  isDarkTheme: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);

  const login = useCallback((user: DemoUser) => {
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    const newUser = DEMO_USERS.find((u) => u.role === role);
    if (newUser) {
      setUser(newUser);
    }
  }, []);

  const isSOCOperator = user?.role === "soc_operator";
  const isDarkTheme = user ? isDarkRole(user.role) : false;

  return (
    <AuthContext.Provider
      value={{ user, login, logout, switchRole, isSOCOperator, isDarkTheme }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
