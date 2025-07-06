
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BulkActions } from '@/components/ui/bulk-actions';
import { EpisodeListSkeleton, StatsSkeleton } from '@/components/ui/loading-skeleton';

interface AdminEpisode {
  id: string;
  title: string;
  slug: string;
  season: number;
  episode_number: number;
  status: 'draft' | 'published' | 'archived' | 'scheduled';
  publish_date: string;
  created_at: string;
}

const Admin = () => {
  const [episodes, setEpisodes] = useState<AdminEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEpisodes, setSelectedEpisodes] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchEpisodes();
  }, []);

  const fetchEpisodes = async () => {
    try {
      const { data, error } = await supabase
        .from('episodes')
        .select('id, title, slug, season, episode_number, status, publish_date, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEpisodes(data || []);
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
              <Link to="/admin/analytics" className="text-sm text-gray-600 hover:text-[#13B87B]">
                Analytics
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
        <div className="grid md:grid-cols-4 gap-6 mb-8">
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
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Scheduled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {episodes.filter(e => e.status === 'scheduled').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Episodes Management */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Episodes</CardTitle>
              <Link to="/admin/episodes/new">
                <Button className="bg-[#13B87B] hover:bg-[#0F9A6A]">
                  <Plus size={16} className="mr-2" />
                  New Episode
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <BulkActions
              selectedItems={selectedEpisodes}
              allItems={episodes.map(e => e.id)}
              onSelectAll={handleSelectAll}
              onSelectItem={handleSelectEpisode}
              onBulkAction={handleBulkAction}
              disabled={bulkActionLoading}
            />
            
            <div className="space-y-4">
              {episodes.map((episode) => (
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
                        <Badge className={getStatusColor(episode.status)}>
                          {episode.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        Season {episode.season}, Episode {episode.episode_number}
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
              
              {episodes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No episodes yet. Create your first episode to get started.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
