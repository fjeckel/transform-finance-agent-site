import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AdaptiveRichTextEditor } from '@/components/ui/adaptive-rich-text-editor';
import { useRichTextEditor } from '@/hooks/useFeatureFlags';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageUpload } from '@/components/ui/image-upload';
import { AudioUpload } from '@/components/ui/audio-upload';
import { ShowNotesManager } from '@/components/ui/show-notes-manager';
import { GuestManager } from '@/components/ui/guest-manager';
import { PlatformLinksManager } from '@/components/ui/platform-links-manager';
import { PreviewModal } from '@/components/ui/preview-modal';
import { FormFieldError, AutoSaveIndicator } from '@/components/ui/form-field-error';
import { FormSkeleton } from '@/components/ui/loading-skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAutoSave } from '@/hooks/useAutoSave';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { episodeSchema } from '@/lib/validation';
import { z } from 'zod';

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
  const isUsingRichTextEditor = useRichTextEditor('episodes');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [season, setSeason] = useState(1);
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [transcript, setTranscript] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled' | 'archived'>('draft');
  const [series, setSeries] = useState<'wtf' | 'finance_transformers' | 'cfo_memo'>('finance_transformers');
  const [audioUrl, setAudioUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [duration, setDuration] = useState('');
  const [showNotes, setShowNotes] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [platformLinks, setPlatformLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [applyAllLoading, setApplyAllLoading] = useState(false);

  // Auto-save functionality
  const formData = {
    title, slug, season, episodeNumber, description, content, summary, transcript, publishDate, status, series,
    audioUrl, imageUrl, duration, showNotes, guests, platformLinks
  };
  
  const { lastSaved, isSaving } = useAutoSave({
    key: `edit-episode-${id}`,
    data: formData,
    enabled: !initialLoading,
  });

  const applyCoverToAllEpisodes = async () => {
    if (!imageUrl) return;
    if (!window.confirm('Set this image as cover art for all episodes?')) return;

    try {
      setApplyAllLoading(true);
      const { error } = await supabase
        .from('episodes')
        .update({ image_url: imageUrl });

      if (error) throw error;

      toast({ title: 'Cover Art Updated', description: 'Cover art applied to all episodes.' });
    } catch (err) {
      console.error('Error applying cover to all episodes:', err);
      toast({ title: 'Error', description: 'Failed to apply cover to all episodes', variant: 'destructive' });
    } finally {
      setApplyAllLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEpisode();
    }
  }, [id]);

  const fetchEpisode = async () => {
    try {
      // Fetch episode with related data
      const { data, error } = await supabase
        .from('episodes')
        .select(`
          *,
          show_notes (
            id,
            timestamp,
            title,
            content,
            sort_order
          ),
          episode_guests (
            guests (
              id,
              name,
              bio,
              image_url
            )
          ),
          episode_platforms (
            id,
            platform_name,
            platform_url
          )
        `)
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
        setSummary(data.summary || '');
        setTranscript(data.transcript || '');
        setPublishDate(data.publish_date ? new Date(data.publish_date).toISOString().split('T')[0] : '');
        setStatus(data.status || 'draft');
        setSeries(data.series || 'finance_transformers');
        setAudioUrl(data.audio_url || '');
        setImageUrl(data.image_url || '');
        setDuration(data.duration || '');
        
        // Set related data
        setShowNotes(data.show_notes || []);
        setGuests(data.episode_guests?.map((eg: any) => eg.guests) || []);
        setPlatformLinks(data.episode_platforms || []);
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
      // Prepare update data
      const updateData: any = {
        title,
        slug,
        description,
        content,
        summary: summary || null,
        transcript: transcript || null,
        season,
        episode_number: episodeNumber,
        series,
        publish_date: publishDate ? new Date(publishDate).toISOString() : null,
        status,
        audio_url: audioUrl || null,
        image_url: imageUrl || null,
        duration: duration || null,
        updated_at: new Date().toISOString(),
      };

      // Only add content_format if using rich text editor (for backward compatibility)
      if (isUsingRichTextEditor) {
        updateData.content_format = 'html';
      }

      // Update episode
      const { error: episodeError } = await supabase
        .from('episodes')
        .update(updateData)
        .eq('id', id);

      if (episodeError) throw episodeError;

      // Update show notes
      await supabase.from('show_notes').delete().eq('episode_id', id);
      if (showNotes.length > 0) {
        const { error: notesError } = await supabase.from('show_notes').insert(
          showNotes.map((note, index) => ({
            episode_id: id,
            timestamp: note.timestamp,
            title: note.title,
            content: note.content || null,
            sort_order: index,
          }))
        );
        if (notesError) console.error('Error updating show notes:', notesError);
      }

      // Update episode guests
      await supabase.from('episode_guests').delete().eq('episode_id', id);
      if (guests.length > 0) {
        const { error: guestsError } = await supabase.from('episode_guests').insert(
          guests.map(guest => ({
            episode_id: id,
            guest_id: guest.id,
          }))
        );
        if (guestsError) console.error('Error updating guests:', guestsError);
      }

      // Update platform links
      await supabase.from('episode_platforms').delete().eq('episode_id', id);
      if (platformLinks.length > 0) {
        const { error: linksError } = await supabase.from('episode_platforms').insert(
          platformLinks.map(link => ({
            episode_id: id,
            platform_name: link.platform_name,
            platform_url: link.platform_url,
          }))
        );
        if (linksError) console.error('Error updating platform links:', linksError);
      }

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
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4">
            <Link to="/admin" className="text-sm text-[#13B87B] hover:underline">
              &larr; Back to Admin
            </Link>
          </div>
          <FormSkeleton />
        </div>
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="media">Media</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-6">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="series" className="block text-sm font-medium mb-1">
                    Podcast Series
                  </label>
                  <Select value={series} onValueChange={(v) => setSeries(v as any)}>
                    <SelectTrigger id="series">
                      <SelectValue placeholder="Select series" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wtf">WTF?!</SelectItem>
                      <SelectItem value="finance_transformers">Finance Transformers</SelectItem>
                      <SelectItem value="cfo_memo">CFO Memo</SelectItem>
                    </SelectContent>
                  </Select>
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
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Description
                </label>
                {isUsingRichTextEditor ? (
                  <AdaptiveRichTextEditor
                    content={description}
                    onChange={setDescription}
                    placeholder="Short episode preview for listings..."
                    className="min-h-[80px]"
                    disabled={loading}
                  />
                ) : (
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[80px]"
                    placeholder="Short episode preview for listings..."
                  />
                )}
              </div>
              <div>
                <label htmlFor="summary" className="block text-sm font-medium mb-1">
                  Episode Summary
                </label>
                {isUsingRichTextEditor ? (
                  <AdaptiveRichTextEditor
                    content={summary}
                    onChange={setSummary}
                    placeholder="Concise episode summary (500-2000 characters) highlighting key takeaways..."
                    className="min-h-[100px]"
                    disabled={loading}
                  />
                ) : (
                  <Textarea
                    id="summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="min-h-[100px]"
                    placeholder="Concise episode summary (500-2000 characters) highlighting key takeaways..."
                  />
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  This summary will be displayed on the episode page to give listeners an overview of key points.
                </p>
              </div>
                </TabsContent>

                <TabsContent value="media" className="space-y-4 mt-6">
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
                    <div className="mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={applyCoverToAllEpisodes}
                        disabled={applyAllLoading || !imageUrl}
                      >
                        {applyAllLoading ? 'Applying...' : 'Set as cover art for all episodes'}
                      </Button>
                    </div>
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
                </TabsContent>

                <TabsContent value="content" className="space-y-4 mt-6">
                  <div>
                    <label htmlFor="content" className="block text-sm font-medium mb-1">
                      Episode Content
                    </label>
                    {isUsingRichTextEditor ? (
                      <AdaptiveRichTextEditor
                        content={content}
                        onChange={setContent}
                        placeholder="Episode content, summary, and notes..."
                        className="min-h-[120px]"
                        disabled={loading}
                      />
                    ) : (
                      <Textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[120px]"
                        placeholder="Episode content, summary, and notes..."
                      />
                    )}
                  </div>
                  <div>
                    <label htmlFor="transcript" className="block text-sm font-medium mb-1">
                      Episode Transcript
                    </label>
                    {isUsingRichTextEditor ? (
                      <AdaptiveRichTextEditor
                        content={transcript}
                        onChange={setTranscript}
                        placeholder="Full episode transcript..."
                        className="min-h-[200px]"
                        disabled={loading}
                      />
                    ) : (
                      <Textarea
                        id="transcript"
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        className="min-h-[200px]"
                        placeholder="Full episode transcript..."
                      />
                    )}
                  </div>
                  <ShowNotesManager
                    value={showNotes}
                    onChange={setShowNotes}
                    disabled={loading}
                  />
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4 mt-6">
                  <GuestManager
                    value={guests}
                    onChange={setGuests}
                    disabled={loading}
                  />
                  <PlatformLinksManager
                    value={platformLinks}
                    onChange={setPlatformLinks}
                    disabled={loading}
                  />
                </TabsContent>
              </Tabs>

              <div className="pt-4 border-t flex gap-2">
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