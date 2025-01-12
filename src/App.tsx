// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RootLayout } from "@/components/layout/RootLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CreateBudget from "./pages/CreateBudget";
import BillReminders from "./pages/BillReminders";
import RevolutImport from "./pages/RevolutImport";
import EditBillReminder from "./pages/EditBillReminder";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return <div className="min-h-screen gradient-bg flex items-center justify-center">Loading...</div>;
  }

  return isAuthenticated ? <RootLayout>{children}</RootLayout> : <Navigate to="/auth" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename="/">
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-budget"
            element={
              <ProtectedRoute>
                <CreateBudget />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bill-reminders"
            element={
              <ProtectedRoute>
                <BillReminders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bill-reminders/edit/:id"
            element={
              <ProtectedRoute>
                <EditBillReminder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/revolut-import"
            element={
              <ProtectedRoute>
                <RevolutImport />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
