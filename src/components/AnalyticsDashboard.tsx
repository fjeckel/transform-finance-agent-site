import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, LineChart, PieChart, TrendingUp, Users, Eye, Clock, Share2, Download, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  totalEvents: number;
  uniqueUsers: number;
  uniqueSessions: number;
  topInsights: Array<{
    insight_id: string;
    title: string;
    views: number;
    shares: number;
    downloads: number;
  }>;
  eventsByType: Array<{
    event_type: string;
    count: number;
  }>;
  dailyStats: Array<{
    date: string;
    events: number;
    users: number;
    sessions: number;
  }>;
}

export const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90));

      // Fetch basic stats
      const { data: events, error: eventsError } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (eventsError) throw eventsError;

      // Process analytics data
      const totalEvents = events?.length || 0;
      const uniqueUsers = new Set(events?.map(e => e.user_id).filter(Boolean)).size;
      const uniqueSessions = new Set(events?.map(e => e.session_id)).size;

      // Group events by type
      const eventsByType = events?.reduce((acc: Record<string, number>, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      }, {}) || {};

      // Extract insight interactions
      const insightEvents = events?.filter(e => e.event_type === 'insight_interaction') || [];
      const insightStats: Record<string, { views: number; shares: number; downloads: number; title: string }> = {};

      insightEvents.forEach(event => {
        const insightId = event.event_data?.insight_id;
        const action = event.event_data?.action;
        const title = event.event_data?.insight_title || 'Unknown';

        if (insightId) {
          if (!insightStats[insightId]) {
            insightStats[insightId] = { views: 0, shares: 0, downloads: 0, title };
          }

          if (action === 'view') insightStats[insightId].views++;
          if (action === 'share') insightStats[insightId].shares++;
          if (action === 'download') insightStats[insightId].downloads++;
        }
      });

      // Group events by day
      const dailyStats: Record<string, { events: number; users: Set<string>; sessions: Set<string> }> = {};
      
      events?.forEach(event => {
        const date = new Date(event.created_at).toDateString();
        if (!dailyStats[date]) {
          dailyStats[date] = { events: 0, users: new Set(), sessions: new Set() };
        }
        
        dailyStats[date].events++;
        if (event.user_id) dailyStats[date].users.add(event.user_id);
        dailyStats[date].sessions.add(event.session_id);
      });

      setAnalytics({
        totalEvents,
        uniqueUsers,
        uniqueSessions,
        topInsights: Object.entries(insightStats)
          .map(([id, stats]) => ({
            insight_id: id,
            title: stats.title,
            views: stats.views,
            shares: stats.shares,
            downloads: stats.downloads,
          }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 10),
        eventsByType: Object.entries(eventsByType).map(([type, count]) => ({ event_type: type, count })),
        dailyStats: Object.entries(dailyStats).map(([date, stats]) => ({
          date,
          events: stats.events,
          users: stats.users.size,
          sessions: stats.sessions.size,
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      });
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Keine Analytics-Daten verfügbar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as '7d' | '30d' | '90d')}>
          <TabsList>
            <TabsTrigger value="7d">7 Tage</TabsTrigger>
            <TabsTrigger value="30d">30 Tage</TabsTrigger>
            <TabsTrigger value="90d">90 Tage</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Events</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalEvents.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.uniqueUsers.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.uniqueSessions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Events/Session</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.uniqueSessions > 0 ? (analytics.totalEvents / analytics.uniqueSessions).toFixed(1) : '0'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Top Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topInsights.slice(0, 5).map((insight, index) => (
              <div key={insight.insight_id} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium truncate">{insight.title}</div>
                  <div className="text-sm text-muted-foreground">#{index + 1}</div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {insight.views}
                  </div>
                  <div className="flex items-center gap-1">
                    <Share2 className="h-3 w-3" />
                    {insight.shares}
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    {insight.downloads}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Event Types */}
      <Card>
        <CardHeader>
          <CardTitle>Event Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.eventsByType.map((item) => (
              <div key={item.event_type} className="flex items-center justify-between">
                <Badge variant="outline">{item.event_type}</Badge>
                <span className="font-medium">{item.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Tägliche Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.dailyStats.slice(-7).map((day) => (
              <div key={day.date} className="flex items-center justify-between text-sm">
                <span>{new Date(day.date).toLocaleDateString('de-DE')}</span>
                <div className="flex gap-4">
                  <span>{day.events} Events</span>
                  <span>{day.users} Users</span>
                  <span>{day.sessions} Sessions</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};