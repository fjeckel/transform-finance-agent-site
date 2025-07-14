import { usePageTracking } from "../hooks/usePageTracking";
import { Routes, Route } from "react-router-dom";
import AdminRoute from "./AdminRoute";
import Index from "../pages/Index";
import DynamicEpisode from "./DynamicEpisode";
import Episodes from "../pages/Episodes";
import Auth from "../pages/Auth";
import Admin from "../pages/Admin";
import AdminAnalytics from "../pages/AdminAnalytics";
import NewEpisode from "../pages/NewEpisode";
import EditEpisode from "../pages/EditEpisode";
import BulkUploadEpisodes from "../pages/BulkUploadEpisodes";
import Legal from "../pages/Legal";
import NotFound from "../pages/NotFound";

const RouterWithTracking = () => {
  usePageTracking();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/episode/:slug" element={<DynamicEpisode />} />
      <Route path="/episodes" element={<Episodes />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/legal" element={<Legal />} />
      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
      <Route path="/admin/episodes/new" element={<AdminRoute><NewEpisode /></AdminRoute>} />
      <Route path="/admin/episodes/upload" element={<AdminRoute><BulkUploadEpisodes /></AdminRoute>} />
      <Route path="/admin/episodes/:id/edit" element={<AdminRoute><EditEpisode /></AdminRoute>} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default RouterWithTracking;