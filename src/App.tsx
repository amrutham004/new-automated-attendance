/**
 * App.tsx - Main Application Component
 * 
 * This is the root component that sets up:
 * - React Query for data management
 * - Toast notifications for user feedback
 * - All application routes
 * 
 * Routes are public (no authentication required):
 * - / : Home page
 * - /mark-attendance : Student QR code generation
 * - /student : Student dashboard
 * - /admin : Admin dashboard
 * - /scan-student : Teacher QR scanner with face capture
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import MarkAttendance from "./pages/MarkAttendance";
import ScanStudent from "./pages/ScanStudent";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import NotFound from "./pages/NotFound";

// Create a React Query client for data fetching/caching
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* Toast notifications */}
      <Toaster />
      <Sonner />
      
      <BrowserRouter>
        <Routes>
          {/* Student routes - accessible by all */}
          <Route path="/" element={<Index />} />
          <Route path="/mark-attendance" element={<MarkAttendance />} />
          <Route path="/student" element={<StudentDashboard />} />

          {/* Admin/Teacher routes - accessible by all */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/scan-student" element={<ScanStudent />} />

          {/* 404 page for unknown routes */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
