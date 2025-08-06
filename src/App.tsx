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
import { AppLayout } from "./components/layouts/AppLayout";
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
const AdminOverview = lazy(() => import("./pages/AdminOverview"));
const AdminTranslations = lazy(() => import("./pages/AdminTranslations"));
const AIResearchComparator = lazy(() => import("./components/research/ResearchWizard"));

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
                  {/* Routes with sidebar layout */}
                  <Route path="/" element={<AppLayout><Index /></AppLayout>} />
                  <Route path="/overview" element={<AppLayout><Overview /></AppLayout>} />
                  <Route path="/episode/:slug" element={<AppLayout><DynamicEpisode /></AppLayout>} />
                  <Route path="/episodes" element={<AppLayout><Episodes /></AppLayout>} />
                  <Route path="/insights" element={<AppLayout><Insights /></AppLayout>} />
                  <Route path="/insights/:slug" element={<AppLayout><InsightDetail /></AppLayout>} />
                  <Route path="/report/:id" element={<AppLayout><PremiumReport /></AppLayout>} />
                  <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
                  <Route path="/test-checkout" element={<AppLayout><TestCheckout /></AppLayout>} />
                  <Route path="/thank-you" element={<AppLayout><ThankYou /></AppLayout>} />
                  
                  {/* Admin routes with sidebar */}
                  <Route path="/admin" element={<AppLayout><AdminRoute><Admin /></AdminRoute></AppLayout>} />
                  <Route path="/admin/analytics" element={<AppLayout><AdminRoute><AdminAnalytics /></AdminRoute></AppLayout>} />
                  <Route path="/admin/pdfs" element={<AppLayout><AdminRoute><AdminPdfs /></AdminRoute></AppLayout>} />
                  <Route path="/admin/rss-feeds" element={<AppLayout><AdminRoute><AdminRssFeeds /></AdminRoute></AppLayout>} />
                  <Route path="/admin/episodes/new" element={<AppLayout><AdminRoute><NewEpisode /></AdminRoute></AppLayout>} />
                  <Route path="/admin/episodes/upload" element={<AppLayout><AdminRoute><BulkUploadEpisodes /></AdminRoute></AppLayout>} />
                  <Route path="/admin/episodes/:id/edit" element={<AppLayout><AdminRoute><EditEpisode /></AdminRoute></AppLayout>} />
                  <Route path="/admin/insights" element={<AppLayout><AdminRoute><AdminInsights /></AdminRoute></AppLayout>} />
                  <Route path="/admin/insights/new" element={<AppLayout><AdminRoute><NewInsight /></AdminRoute></AppLayout>} />
                  <Route path="/admin/insights/:id/edit" element={<AppLayout><AdminRoute><EditInsight /></AdminRoute></AppLayout>} />
                  <Route path="/admin/overview" element={<AppLayout><AdminRoute><AdminOverview /></AdminRoute></AppLayout>} />
                  <Route path="/admin/translations" element={<AppLayout><AdminRoute><AdminTranslations /></AdminRoute></AppLayout>} />
                  <Route path="/admin/ai-research" element={<AdminRoute><AIResearchComparator /></AdminRoute>} />
                  
                  {/* Routes without sidebar (standalone pages) */}
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/legal" element={<Legal />} />
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<AppLayout showSidebar={false}><NotFound /></AppLayout>} />
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
