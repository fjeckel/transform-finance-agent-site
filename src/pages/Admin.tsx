
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Calendar, Users, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BulkActions } from '@/components/ui/bulk-actions';
import { EpisodeListSkeleton, StatsSkeleton } from '@/components/ui/loading-skeleton';
import MainPageSectionsManager from '@/components/admin/MainPageSectionsManager';
import { HeroVideoManager } from '@/components/ui/hero-video-manager';

interface AdminEpisode {
  id: string;
  title: string;
  slug: string;
  season: number;
  episode_number: number;
  status: 'draft' | 'published' | 'archived' | 'scheduled';
  series: 'wtf' | 'finance_transformers' | 'cfo_memo';
  publish_date: string;
  created_at: string;
  duration: string | null;
  guest_count?: number;
  platform_count?: number;
}

const Admin = () => {
  const [episodes, setEpisodes] = useState<AdminEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEpisodes, setSelectedEpisodes] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [seriesFilter, setSeriesFilter] = useState<string>('all');
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchEpisodes();
  }, []);

  const fetchEpisodes = async () => {
    try {
      const { data, error } = await supabase
        .from('episodes')
        .select(`
          id, title, slug, season, episode_number, status, series, publish_date, created_at, duration,
          episode_guests(count),
          episode_platforms(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedEpisodes = (data || []).map(episode => ({
        ...episode,
        guest_count: episode.episode_guests?.[0]?.count || 0,
        platform_count: episode.episode_platforms?.[0]?.count || 0
      }));
      
      setEpisodes(formattedEpisodes);
    } catch (error) {
      console.error('Error fetching episodes:', error);
      toast({
        title: "Error",
        description: "Failed to load episodes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeriesColor = (series: string) => {
    switch (series) {
      case 'wtf': return 'bg-purple-100 text-purple-800';
      case 'finance_transformers': return 'bg-blue-100 text-blue-800';
      case 'cfo_memo': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeriesName = (series: string) => {
    switch (series) {
      case 'wtf': return 'WTF?!';
      case 'finance_transformers': return 'Finance Transformers';
      case 'cfo_memo': return 'CFO Memo';
      default: return series;
    }
  };

  const filteredEpisodes = episodes.filter(episode => 
    seriesFilter === 'all' || episode.series === seriesFilter
  );

  const handleDelete = async (episodeId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('episodes')
          .delete()
          .eq('id', episodeId);

        if (error) throw error;

        toast({
          title: "Episode Deleted",
          description: `"${title}" has been deleted successfully.`,
        });
        
        fetchEpisodes(); // Refresh the list
      } catch (error) {
        console.error('Error deleting episode:', error);
        toast({
          title: "Error",
          description: "Failed to delete episode",
          variant: "destructive",
        });
      }
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedEpisodes(checked ? episodes.map(e => e.id) : []);
  };

  const handleSelectEpisode = (episodeId: string, checked: boolean) => {
    setSelectedEpisodes(prev => 
      checked 
        ? [...prev, episodeId]
        : prev.filter(id => id !== episodeId)
    );
  };

  const handleBulkAction = async (action: string, episodeIds: string[]) => {
    setBulkActionLoading(true);
    try {
      let updateData: any = {};
      
      switch (action) {
        case 'publish':
          updateData = { status: 'published' };
          break;
        case 'archive':
          updateData = { status: 'archived' };
          break;
        case 'delete':
          const { error: deleteError } = await supabase
            .from('episodes')
            .delete()
            .in('id', episodeIds);
          
          if (deleteError) throw deleteError;
          
          toast({
            title: 'Episodes Deleted',
            description: `${episodeIds.length} episode${episodeIds.length > 1 ? 's' : ''} deleted successfully.`,
          });
          
          setSelectedEpisodes([]);
          fetchEpisodes();
          return;
        default:
          return;
      }

      const { error } = await supabase
        .from('episodes')
        .update(updateData)
        .in('id', episodeIds);

      if (error) throw error;

      toast({
        title: 'Episodes Updated',
        description: `${episodeIds.length} episode${episodeIds.length > 1 ? 's' : ''} updated successfully.`,
      });
      
      setSelectedEpisodes([]);
      fetchEpisodes();
    } catch (error) {
      console.error('Bulk action error:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform bulk action',
        variant: 'destructive',
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Link to="/" className="text-2xl font-bold text-gray-900 font-cooper">
                  Finance Transformers
                </Link>
                <Badge variant="secondary">Admin</Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <StatsSkeleton />
          <EpisodeListSkeleton />
        </div>
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
              <Link to="/" className="text-2xl font-bold text-gray-900 font-cooper">
                Finance Transformers
              </Link>
              <Badge variant="secondary">Admin</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/admin/insights" className="text-sm text-gray-600 hover:text-[#13B87B]">
                Insights
              </Link>
              <Link to="/admin/analytics" className="text-sm text-gray-600 hover:text-[#13B87B]">
                Analytics
              </Link>
              <Link to="/admin/pdfs" className="text-sm text-gray-600 hover:text-[#13B87B]">
                PDF Library
              </Link>
              <Link to="/admin/rss-feeds" className="text-sm text-gray-600 hover:text-[#13B87B]">
                RSS Feeds
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
        {/* Dashboard Stats */}
        <div className="grid md:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Episodes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{episodes.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">WTF?!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {episodes.filter(e => e.series === 'wtf').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Finance Transformers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {episodes.filter(e => e.series === 'finance_transformers').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">CFO Memo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {episodes.filter(e => e.series === 'cfo_memo').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {episodes.filter(e => e.status === 'published').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {episodes.filter(e => e.status === 'draft').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Management Tabs */}
        <Tabs defaultValue="episodes" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="episodes">Episodes</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="main-page">Main Page</TabsTrigger>
          </TabsList>
          
          <TabsContent value="episodes">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <CardTitle>Episodes</CardTitle>
                    <select 
                      value={seriesFilter} 
                      onChange={(e) => setSeriesFilter(e.target.value)}
                      className="px-3 py-1 border rounded-md text-sm"
                    >
                      <option value="all">All Series</option>
                      <option value="wtf">WTF?!</option>
                      <option value="finance_transformers">Finance Transformers</option>
                      <option value="cfo_memo">CFO Memo</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/admin/episodes/new">
                      <Button className="bg-[#13B87B] hover:bg-[#0F9A6A]">
                        <Plus size={16} className="mr-2" />
                        New Episode
                      </Button>
                    </Link>
                    <Link to="/admin/episodes/upload">
                      <Button variant="outline">Enhanced Bulk Upload</Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <BulkActions
                  selectedItems={selectedEpisodes}
                  allItems={filteredEpisodes.map(e => e.id)}
                  onSelectAll={handleSelectAll}
                  onSelectItem={handleSelectEpisode}
                  onBulkAction={handleBulkAction}
                  disabled={bulkActionLoading}
                />
                
                <div className="space-y-4">
                  {filteredEpisodes.map((episode) => (
                    <div key={episode.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedEpisodes.includes(episode.id)}
                          onCheckedChange={(checked) => handleSelectEpisode(episode.id, !!checked)}
                          disabled={bulkActionLoading}
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium">{episode.title}</h3>
                            <Badge className={getSeriesColor(episode.series)}>
                              {getSeriesName(episode.series)}
                            </Badge>
                            <Badge className={getStatusColor(episode.status)}>
                              {episode.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-4">
                            <span>Season {episode.season}, Episode {episode.episode_number}</span>
                            {episode.duration && <span>Duration: {episode.duration}</span>}
                            <span>Guests: {episode.guest_count || 0}</span>
                            <span>Platforms: {episode.platform_count || 0}</span>
                          </div>
                          {episode.publish_date && (
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <Calendar size={14} className="mr-1" />
                              {new Date(episode.publish_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Link to={`/episode/${episode.slug}`}>
                          <Button variant="outline" size="sm">
                            <Eye size={14} className="mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link to={`/admin/episodes/${episode.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit size={14} className="mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(episode.id, episode.title)}
                          disabled={bulkActionLoading}
                        >
                          <Trash2 size={14} className="mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {filteredEpisodes.length === 0 && episodes.length > 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No episodes found for the selected series.
                    </div>
                  )}
                  
                  {episodes.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No episodes yet. Create your first episode to get started.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="insights">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Insights Management</CardTitle>
                  <Link to="/admin/insights">
                    <Button className="bg-[#13B87B] hover:bg-[#0F9A6A]">
                      <Plus size={16} className="mr-2" />
                      Manage Insights
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Manage your insights, book summaries, and blog-style articles. 
                  Click "Manage Insights" to access the full insights management interface.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Quick Actions</h4>
                    <div className="space-y-2">
                      <Link to="/admin/insights/new" className="block">
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Plus size={14} className="mr-2" />
                          Create New Insight
                        </Button>
                      </Link>
                      <Link to="/insights" className="block">
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Eye size={14} className="mr-2" />
                          View Public Insights
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Content Types</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Book Summaries</li>
                      <li>• Blog Articles</li>
                      <li>• Market Analysis</li>
                      <li>• Industry Reports</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Overview Tab Management</CardTitle>
                  <Link to="/overview">
                    <Button variant="outline">
                      <Eye size={16} className="mr-2" />
                      View Live Overview
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Overview Tab Content</h4>
                  <p className="text-blue-800 text-sm mb-3">
                    The Overview tab explains "World of Finance Transformers", "What is WTF?!", 
                    "What is CFO Memo", and "What is Tool Time by WTF?!"
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Current Sections</h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-gray-50 rounded border">
                        <h5 className="font-medium text-sm">World of Finance Transformers</h5>
                        <p className="text-xs text-gray-600 mt-1">Main mission and vision statement</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border">
                        <h5 className="font-medium text-sm">What is WTF?!</h5>
                        <p className="text-xs text-gray-600 mt-1">Podcast series description</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border">
                        <h5 className="font-medium text-sm">What is CFO Memo</h5>
                        <p className="text-xs text-gray-600 mt-1">CFO Memo series explanation</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border">
                        <h5 className="font-medium text-sm">Tool Time by WTF?!</h5>
                        <p className="text-xs text-gray-600 mt-1">Tool review segment description</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Management Actions</h4>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start" disabled>
                        <Edit size={14} className="mr-2" />
                        Edit Overview Content (Coming Soon)
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start" disabled>
                        <FileText size={14} className="mr-2" />
                        Manage Sections (Coming Soon)
                      </Button>
                      <Link to="/overview" className="block">
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Eye size={14} className="mr-2" />
                          Preview Overview Page
                        </Button>
                      </Link>
                    </div>
                    
                    <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                      <p className="text-xs text-yellow-800">
                        💡 <strong>Note:</strong> Full CMS integration for Overview content coming soon. 
                        Currently managed through static content.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="main-page" className="space-y-6">
            {/* Temporarily disable HeroVideoManager to test if it's causing the crash */}
            {/* <HeroVideoManager onUpdate={() => {}} /> */}
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 mb-6">
              <p className="text-sm text-yellow-800">
                📹 <strong>Hero Video Manager:</strong> Temporarily disabled for troubleshooting. Will be re-enabled once stable.
              </p>
            </div>
            <MainPageSectionsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
