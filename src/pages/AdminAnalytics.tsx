import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PageStat {
  page: string;
  count: number;
}

const AdminAnalytics = () => {
  const [stats, setStats] = useState<PageStat[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from('page_visit_logs')
      .select('page');

    if (!error && data) {
      // Group by page and count manually since Supabase doesn't support SQL GROUP BY in select
      const grouped = data.reduce((acc: Record<string, number>, item) => {
        acc[item.page] = (acc[item.page] || 0) + 1;
        return acc;
      }, {});
      
      const stats = Object.entries(grouped).map(([page, count]) => ({ page, count }));
      setStats(stats);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#13B87B]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-2xl font-bold text-gray-900">
                Finance Transformers
              </Link>
              <Badge variant="secondary">Admin</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/admin" className="text-sm text-gray-600 hover:text-[#13B87B]">
                Dashboard
              </Link>
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Page Analytics</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <Card key={stat.page}>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.page}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.count}</div>
              </CardContent>
            </Card>
          ))}
          {stats.length === 0 && (
            <div className="col-span-full text-center text-gray-500">
              No analytics data available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;

