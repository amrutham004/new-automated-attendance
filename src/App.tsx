import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import MarkAttendance from "./pages/MarkAttendance";
import ScanStudent from "./pages/ScanStudent";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public route */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Student routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Index />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mark-attendance" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <MarkAttendance />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Teacher routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/scan-student" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <ScanStudent />
                </ProtectedRoute>
              } 
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
