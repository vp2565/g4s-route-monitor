"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { DemoUser, UserRole, DEMO_USERS, isDarkRole } from "@/types";

interface AuthContextType {
  user: DemoUser | null;
  login: (user: DemoUser) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  isSOCOperator: boolean;
  isDarkTheme: boolean;
}

const AUTH_STORAGE_KEY = "g4s-demo-user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) return JSON.parse(stored) as DemoUser;
    } catch {
      // ignore
    }
    return null;
  });

  // Persist user to sessionStorage on change
  useEffect(() => {
    if (user) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

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
