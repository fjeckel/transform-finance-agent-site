import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import AdminRoute from "./components/AdminRoute";
import CookieConsent from "./components/CookieConsent";
import ErrorBoundary from "./components/ui/error-boundary";
import { useServiceWorker } from "./hooks/useServiceWorker";
import { usePerformanceMonitoring } from "./hooks/usePerformanceMonitoring";
import { NetworkIndicator } from "./components/ui/network-indicator";
import "./i18n";
import { PageLoadingSkeleton } from "./components/ui/loading-skeleton";

// Eager load critical pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy load non-critical pages
const Overview = lazy(() => import("./pages/Overview"));
const DynamicEpisode = lazy(() => import("./components/DynamicEpisode"));
const Episodes = lazy(() => import("./pages/Episodes"));
const Insights = lazy(() => import("./pages/Insights"));
const InsightDetail = lazy(() => import("./pages/InsightDetail"));
const Auth = lazy(() => import("./pages/Auth"));
const Legal = lazy(() => import("./pages/Legal"));
const PremiumReport = lazy(() => import("./pages/PremiumReport"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const TestCheckout = lazy(() => import("./pages/TestCheckout"));
const ThankYou = lazy(() => import("./pages/ThankYou"));

// Lazy load admin pages (heavy components)
const Admin = lazy(() => import("./pages/Admin"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminPdfs = lazy(() => import("./pages/AdminPdfs"));
const AdminRssFeeds = lazy(() => import("./pages/AdminRssFeeds"));
const NewEpisode = lazy(() => import("./pages/NewEpisode"));
const EditEpisode = lazy(() => import("./pages/EditEpisode"));
const BulkUploadEpisodes = lazy(() => import("./pages/BulkUploadEpisodes"));
const AdminInsights = lazy(() => import("./pages/AdminInsights"));
const NewInsight = lazy(() => import("./pages/NewInsight"));
const EditInsight = lazy(() => import("./pages/EditInsight"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});


const getCookie = (name: string) => {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : undefined;
};

const App = () => {
  useServiceWorker();
  const performanceMetrics = usePerformanceMonitoring();

  useEffect(() => {
    const logVisit = async () => {
      if (getCookie('cookieConsent')) {
        const count = parseInt(getCookie('visitCount') ?? '0', 10) || 0;
        const newCount = count + 1;
        const oneYear = 60 * 60 * 24 * 365;
        document.cookie = `visitCount=${newCount}; path=/; max-age=${oneYear}`;

        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('page_visit_logs').insert({
          page: window.location.pathname,
          user_id: user?.id ?? null,
        });
      }
    };
    logVisit();
  }, []);

  // Log performance metrics in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && performanceMetrics) {
      console.log('Performance Metrics:', performanceMetrics);
    }
  }, [performanceMetrics]);

  return (
    <ErrorBoundary>
      <NetworkIndicator />
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider>
            <CookieConsent />
            <Toaster />
            <Sonner />
            <AuthProvider>
              <BrowserRouter>
              <Suspense fallback={<PageLoadingSkeleton />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/overview" element={<Overview />} />
                  <Route path="/episode/:slug" element={<DynamicEpisode />} />
                  <Route path="/episodes" element={<Episodes />} />
                  <Route path="/insights" element={<Insights />} />
                  <Route path="/insights/:slug" element={<InsightDetail />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/legal" element={<Legal />} />
                  <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                  <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
                  <Route path="/admin/pdfs" element={<AdminRoute><AdminPdfs /></AdminRoute>} />
                  <Route path="/admin/rss-feeds" element={<AdminRoute><AdminRssFeeds /></AdminRoute>} />
                  <Route path="/admin/episodes/new" element={<AdminRoute><NewEpisode /></AdminRoute>} />
                  <Route path="/admin/episodes/upload" element={<AdminRoute><BulkUploadEpisodes /></AdminRoute>} />
                  <Route path="/admin/episodes/:id/edit" element={<AdminRoute><EditEpisode /></AdminRoute>} />
                  <Route path="/admin/insights" element={<AdminRoute><AdminInsights /></AdminRoute>} />
                  <Route path="/admin/insights/new" element={<AdminRoute><NewInsight /></AdminRoute>} />
                  <Route path="/admin/insights/:id/edit" element={<AdminRoute><EditInsight /></AdminRoute>} />
                  <Route path="/report/:id" element={<PremiumReport />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/test-checkout" element={<TestCheckout />} />
                  <Route path="/thank-you" element={<ThankYou />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              </BrowserRouter>
            </AuthProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
