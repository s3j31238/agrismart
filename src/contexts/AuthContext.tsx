import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "farmer" | "student" | "admin";
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string, role: "farmer" | "student") => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultUsers: (User & { password: string })[] = [
  { id: "admin-1", name: "Admin", email: "admin@agri.com", password: "admin123", role: "admin", createdAt: "2025-01-01" },
  { id: "farmer-1", name: "Rajesh Kumar", email: "rajesh@farm.com", password: "farmer123", role: "farmer", createdAt: "2025-06-15" },
  { id: "student-1", name: "Priya Sharma", email: "priya@univ.com", password: "student123", role: "student", createdAt: "2025-09-01" },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userStore, setUserStore] = useState<(User & { password: string })[]>(() => {
    const stored = localStorage.getItem("agri_users");
    return stored ? JSON.parse(stored) : defaultUsers;
  });

  useEffect(() => {
    const session = localStorage.getItem("agri_session");
    if (session) {
      const parsed = JSON.parse(session);
      setUser(parsed);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("agri_users", JSON.stringify(userStore));
  }, [userStore]);

  const login = (email: string, password: string): boolean => {
    const found = userStore.find(u => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...userData } = found;
      setUser(userData);
      localStorage.setItem("agri_session", JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const register = (name: string, email: string, password: string, role: "farmer" | "student"): boolean => {
    if (userStore.some(u => u.email === email)) return false;
    const newUser = { id: `user-${Date.now()}`, name, email, password, role, createdAt: new Date().toISOString().split("T")[0] };
    setUserStore(prev => [...prev, newUser]);
    const { password: _, ...userData } = newUser;
    setUser(userData);
    localStorage.setItem("agri_session", JSON.stringify(userData));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("agri_session");
  };

  return (
    <AuthContext.Provider value={{ user, users: userStore.map(({ password, ...u }) => u), login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
