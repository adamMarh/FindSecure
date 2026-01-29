import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SubmitInquiry from "./pages/SubmitInquiry";
import TrackInquiries from "./pages/TrackInquiries";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Overview from "./pages/admin/Overview";
import AdminInquiries from "./pages/admin/Inquiries";
import AdminInventory from "./pages/admin/Inventory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/submit" element={<SubmitInquiry />} />
            <Route path="/track" element={<TrackInquiries />} />
            <Route path="/admin" element={<AdminDashboard />}>
              <Route index element={<Overview />} />
              <Route path="inquiries" element={<AdminInquiries />} />
              <Route path="inventory" element={<AdminInventory />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
