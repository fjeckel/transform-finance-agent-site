import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Calendar, Star, BookOpen, FileText, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BulkActions } from '@/components/ui/bulk-actions';
import { EpisodeListSkeleton, StatsSkeleton } from '@/components/ui/loading-skeleton';
import { InsightType, DifficultyLevel, InsightStatus } from '@/hooks/useInsights';

interface AdminInsight {
  id: string;
  title: string;
  slug: string;
  insight_type: InsightType;
  status: InsightStatus;
  difficulty_level?: DifficultyLevel;
  featured: boolean;
  view_count: number;
  published_at?: string;
  created_at: string;
  book_title?: string;
  book_author?: string;
  insights_categories?: {
    id: string;
    name: string;
  };
}

const AdminInsights = () => {
  const [insights, setInsights] = useState<AdminInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInsights, setSelectedInsights] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('insights')
        .select(`
          id, title, slug, insight_type, status, difficulty_level, featured, view_count, published_at, created_at,
          book_title, book_author,
          insights_categories (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setInsights(data || []);
    } catch (error) {
      console.error('Error fetching insights:', error);
      toast({
        title: "Error",
        description: "Failed to load insights",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: InsightStatus) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: InsightType) => {
    switch (type) {
      case 'book_summary': return 'bg-purple-100 text-purple-800';
      case 'blog_article': return 'bg-blue-100 text-blue-800';
      case 'guide': return 'bg-green-100 text-green-800';
      case 'case_study': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: InsightType) => {
    switch (type) {
      case 'book_summary': return BookOpen;
      case 'blog_article': return FileText;
      case 'guide': return Users;
      case 'case_study': return TrendingUp;
      default: return FileText;
    }
  };

  const getTypeName = (type: InsightType) => {
    switch (type) {
      case 'book_summary': return 'Book Summary';
      case 'blog_article': return 'Article';
      case 'guide': return 'Guide';
      case 'case_study': return 'Case Study';
      default: return type;
    }
  };

  const getDifficultyColor = (level?: DifficultyLevel) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredInsights = insights.filter(insight => {
    const typeMatch = typeFilter === 'all' || insight.insight_type === typeFilter;
    const statusMatch = statusFilter === 'all' || insight.status === statusFilter;
    return typeMatch && statusMatch;
  });

  const handleDelete = async (insightId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('insights')
          .delete()
          .eq('id', insightId);

        if (error) throw error;

        toast({
          title: "Insight Deleted",
          description: `"${title}" has been deleted successfully.`,
        });
        
        fetchInsights(); // Refresh the list
      } catch (error) {
        console.error('Error deleting insight:', error);
        toast({
          title: "Error",
          description: "Failed to delete insight",
          variant: "destructive",
        });
      }
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedInsights(checked ? filteredInsights.map(i => i.id) : []);
  };

  const handleSelectInsight = (insightId: string, checked: boolean) => {
    setSelectedInsights(prev => 
      checked 
        ? [...prev, insightId]
        : prev.filter(id => id !== insightId)
    );
  };

  const handleBulkAction = async (action: string, insightIds: string[]) => {
    setBulkActionLoading(true);
    try {
      let updateData: any = {};
      
      switch (action) {
        case 'publish':
          updateData = { status: 'published', published_at: new Date().toISOString() };
          break;
        case 'archive':
          updateData = { status: 'archived' };
          break;
        case 'feature':
          updateData = { featured: true };
          break;
        case 'unfeature':
          updateData = { featured: false };
          break;
        case 'delete':
          const { error: deleteError } = await supabase
            .from('insights')
            .delete()
            .in('id', insightIds);
          
          if (deleteError) throw deleteError;
          
          toast({
            title: 'Insights Deleted',
            description: `${insightIds.length} insight${insightIds.length > 1 ? 's' : ''} deleted successfully.`,
          });
          
          setSelectedInsights([]);
          fetchInsights();
          return;
        default:
          return;
      }

      const { error } = await supabase
        .from('insights')
        .update(updateData)
        .in('id', insightIds);

      if (error) throw error;

      toast({
        title: 'Insights Updated',
        description: `${insightIds.length} insight${insightIds.length > 1 ? 's' : ''} updated successfully.`,
      });
      
      setSelectedInsights([]);
      fetchInsights();
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
              <Link to="/admin" className="text-sm text-gray-600 hover:text-[#13B87B]">
                Episodes
              </Link>
              <Link to="/admin/analytics" className="text-sm text-gray-600 hover:text-[#13B87B]">
                Analytics
              </Link>
              <Link to="/admin/pdfs" className="text-sm text-gray-600 hover:text-[#13B87B]">
                PDF Library
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
              <CardTitle className="text-sm font-medium text-gray-600">Total Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Book Summaries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {insights.filter(i => i.insight_type === 'book_summary').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {insights.filter(i => i.insight_type === 'blog_article').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Guides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {insights.filter(i => i.insight_type === 'guide').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {insights.filter(i => i.status === 'published').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Featured</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {insights.filter(i => i.featured).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights Management */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <CardTitle>Insights Management</CardTitle>
                <div className="flex gap-3">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="book_summary">Book Summaries</SelectItem>
                      <SelectItem value="blog_article">Articles</SelectItem>
                      <SelectItem value="guide">Guides</SelectItem>
                      <SelectItem value="case_study">Case Studies</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Link to="/admin/insights/new">
                <Button className="bg-[#13B87B] hover:bg-[#0F9A6A]">
                  <Plus size={16} className="mr-2" />
                  New Insight
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <BulkActions
              selectedItems={selectedInsights}
              allItems={filteredInsights.map(i => i.id)}
              onSelectAll={handleSelectAll}
              onSelectItem={handleSelectInsight}
              onBulkAction={handleBulkAction}
              disabled={bulkActionLoading}
              customActions={[
                { value: 'feature', label: 'Mark as Featured' },
                { value: 'unfeature', label: 'Remove Featured' }
              ]}
            />
            
            <div className="space-y-4">
              {filteredInsights.map((insight) => {
                const TypeIcon = getTypeIcon(insight.insight_type);
                return (
                  <div key={insight.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedInsights.includes(insight.id)}
                        onCheckedChange={(checked) => handleSelectInsight(insight.id, !!checked)}
                        disabled={bulkActionLoading}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium">{insight.title}</h3>
                          <div className="flex items-center gap-1">
                            <TypeIcon size={14} />
                            <Badge className={getTypeColor(insight.insight_type)}>
                              {getTypeName(insight.insight_type)}
                            </Badge>
                          </div>
                          <Badge className={getStatusColor(insight.status)}>
                            {insight.status}
                          </Badge>
                          {insight.featured && (
                            <Badge className="bg-yellow-500 text-white">
                              <Star size={12} className="mr-1" />
                              Featured
                            </Badge>
                          )}
                          {insight.difficulty_level && (
                            <Badge className={getDifficultyColor(insight.difficulty_level)}>
                              {insight.difficulty_level}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-4">
                          {insight.book_title && <span>Book: {insight.book_title}</span>}
                          {insight.book_author && <span>Author: {insight.book_author}</span>}
                          {insight.insights_categories && <span>Category: {insight.insights_categories.name}</span>}
                          <span>Views: {insight.view_count}</span>
                        </div>
                        {insight.published_at && (
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Calendar size={14} className="mr-1" />
                            Published: {new Date(insight.published_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {insight.status === 'published' && (
                        <Link to={`/insights/${insight.slug}`}>
                          <Button variant="outline" size="sm">
                            <Eye size={14} className="mr-1" />
                            View
                          </Button>
                        </Link>
                      )}
                      <Link to={`/admin/insights/${insight.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit size={14} className="mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(insight.id, insight.title)}
                        disabled={bulkActionLoading}
                      >
                        <Trash2 size={14} className="mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
              
              {filteredInsights.length === 0 && insights.length > 0 && (
                <div className="text-center py-8 text-gray-500">
                  No insights found for the selected filters.
                </div>
              )}
              
              {insights.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No insights yet. Create your first insight to get started.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminInsights;