import { Toaster } from "@/component/ui/toaster";
import { Toaster as Sonner } from "@/component/ui/sonner";
import { TooltipProvider } from "@/component/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LangProvider } from "@/contexts/LangContext";
import Login from "@/component/pages/Login";
import Register from "@/component/pages/Register";
import Dashboard from "@/component/pages/Dashboard";
import CropDatabase from "@/component/pages/CropDatabase";
import CropRecommendation from "@/component/pages/CropRecommendation";
import CropProblemSolver from "@/component/pages/CropProblemSolver";
import DailyPlanner from "@/component/pages/DailyPlanner";
import AdminPanel from "@/component/pages/AdminPanel";
import NotFound from "@/component/pages/NotFound";
import Index from "@/component/pages/Index";

const queryClient = new QueryClient();

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/crops" element={<ProtectedRoute><CropDatabase /></ProtectedRoute>} />
    <Route path="/recommend" element={<ProtectedRoute><CropRecommendation /></ProtectedRoute>} />
    <Route path="/problems" element={<ProtectedRoute><CropProblemSolver /></ProtectedRoute>} />
    <Route path="/planner" element={<ProtectedRoute><DailyPlanner /></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LangProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </LangProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
