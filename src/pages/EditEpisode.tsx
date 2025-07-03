import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import { AudioUpload } from '@/components/ui/audio-upload';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const EditEpisode = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [season, setSeason] = useState(1);
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled' | 'archived'>('draft');
  const [audioUrl, setAudioUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchEpisode();
    }
  }, [id]);

  const fetchEpisode = async () => {
    try {
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setTitle(data.title);
        setSlug(data.slug);
        setSeason(data.season || 1);
        setEpisodeNumber(data.episode_number);
        setDescription(data.description || '');
        setContent(data.content || '');
        setPublishDate(data.publish_date ? new Date(data.publish_date).toISOString().split('T')[0] : '');
        setStatus(data.status || 'draft');
        setAudioUrl(data.audio_url || '');
        setImageUrl(data.image_url || '');
        setDuration(data.duration || '');
      }
    } catch (err) {
      console.error('Error fetching episode:', err);
      toast({ title: 'Error', description: 'Failed to load episode', variant: 'destructive' });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('episodes')
        .update({
          title,
          slug,
          description,
          content,
          season,
          episode_number: episodeNumber,
          publish_date: publishDate ? new Date(publishDate).toISOString() : null,
          status,
          audio_url: audioUrl || null,
          image_url: imageUrl || null,
          duration: duration || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Episode Updated', description: 'Episode has been updated successfully.' });
      navigate('/admin');
    } catch (err) {
      console.error('Error updating episode:', err);
      toast({ title: 'Error', description: 'Failed to update episode', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#13B87B]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <Link to="/admin" className="text-sm text-[#13B87B] hover:underline">
            &larr; Back to Admin
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Edit Episode</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">
                  Title
                </label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setSlug(slugify(e.target.value));
                  }} 
                  required 
                />
              </div>
              <div>
                <label htmlFor="slug" className="block text-sm font-medium mb-1">
                  Slug
                </label>
                <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="season" className="block text-sm font-medium mb-1">
                    Season
                  </label>
                  <Input
                    id="season"
                    type="number"
                    min="1"
                    value={season}
                    onChange={(e) => setSeason(parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label htmlFor="episodeNumber" className="block text-sm font-medium mb-1">
                    Episode Number
                  </label>
                  <Input
                    id="episodeNumber"
                    type="number"
                    min="1"
                    value={episodeNumber}
                    onChange={(e) => setEpisodeNumber(parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="publishDate" className="block text-sm font-medium mb-1">
                  Publish Date
                </label>
                <Input
                  id="publishDate"
                  type="date"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium mb-1">
                  Status
                </label>
                <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Description
                </label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              <div>
                <label htmlFor="content" className="block text-sm font-medium mb-1">
                  Content
                </label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[120px]"
                  placeholder="Episode content/notes..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Cover Image
                </label>
                <ImageUpload
                  value={imageUrl}
                  onChange={(url) => setImageUrl(url || '')}
                  episodeId={id}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Audio File
                </label>
                <AudioUpload
                  value={audioUrl}
                  onChange={(url, extractedDuration) => {
                    setAudioUrl(url || '');
                    if (extractedDuration) setDuration(extractedDuration);
                  }}
                  episodeId={id}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="duration" className="block text-sm font-medium mb-1">
                  Duration
                </label>
                <Input
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 45:30"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-[#13B87B] hover:bg-[#0F9A6A]" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Episode'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/admin')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditEpisode;