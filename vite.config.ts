import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'query-vendor': ['@tanstack/react-query'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'i18n-vendor': ['react-i18next', 'i18next', 'i18next-browser-languagedetector'],
          'markdown-vendor': ['react-markdown'],
          
          // Separate research services to prevent dynamic import issues
          'research-services': [
            './src/services/research/researchService.ts',
            './src/services/researchService.ts'
          ],
          
          // Separate admin components
          'admin': [
            './src/pages/Admin.tsx',
            './src/pages/AdminAnalytics.tsx',
            './src/pages/AdminPdfs.tsx',
            './src/pages/AdminRssFeeds.tsx',
            './src/pages/AdminInsights.tsx'
          ],
          'admin-forms': [
            './src/pages/NewEpisode.tsx',
            './src/pages/EditEpisode.tsx',
            './src/pages/NewInsight.tsx',
            './src/pages/EditInsight.tsx',
            './src/pages/BulkUploadEpisodes.tsx'
          ],
          
          // Separate insights components
          'insights': [
            './src/pages/Insights.tsx',
            './src/pages/InsightDetail.tsx'
          ],
          
          // Separate episode components  
          'episodes': [
            './src/pages/Episodes.tsx',
            './src/components/DynamicEpisode.tsx'
          ]
        }
      }
    },
    // Increase chunk size warning limit since we're now splitting properly
    chunkSizeWarningLimit: 1000,
    // Enable source maps for better debugging
    sourcemap: mode === 'development',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'react-i18next',
      'i18next'
    ]
  }
}));
