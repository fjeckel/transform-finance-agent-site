import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Save, Send, FileText } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageUpload } from '@/components/ui/image-upload';
import { AudioUpload } from '@/components/ui/audio-upload';
import { ShowNotesManager } from '@/components/ui/show-notes-manager';
import { GuestManager } from '@/components/ui/guest-manager';
import { PlatformLinksManager } from '@/components/ui/platform-links-manager';
import { PreviewModal } from '@/components/ui/preview-modal';
import { FormFieldError, AutoSaveIndicator } from '@/components/ui/form-field-error';
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

const NewEpisode = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
  const [imageUrl, setImageUrl] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [showNotes, setShowNotes] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [platformLinks, setPlatformLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Auto-save functionality
  const formData = {
    title, slug, season, episodeNumber, description, content, summary, transcript, publishDate, status, series,
    imageUrl, audioUrl, duration, showNotes, guests, platformLinks
  };
  
  const { lastSaved, isSaving } = useAutoSave({
    key: 'new-episode',
    data: formData,
    enabled: true,
  });

  useEffect(() => {
    setSlug(slugify(title));
  }, [title]);

  // Load autosaved data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('autosave_new-episode');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const data = parsed.data;
        
        // Show confirmation dialog
        if (window.confirm('Found autosaved data. Would you like to restore it?')) {
          setTitle(data.title || '');
          setSlug(data.slug || '');
          setSeason(data.season || 1);
          setEpisodeNumber(data.episodeNumber || 1);
          setDescription(data.description || '');
          setContent(data.content || '');
          setSummary(data.summary || '');
          setTranscript(data.transcript || '');
          setPublishDate(data.publishDate || '');
          setStatus(data.status || 'draft');
          setSeries(data.series || 'finance_transformers');
          setImageUrl(data.imageUrl || '');
          setAudioUrl(data.audioUrl || '');
          setDuration(data.duration || '');
          setShowNotes(data.showNotes || []);
          setGuests(data.guests || []);
          setPlatformLinks(data.platformLinks || []);
          
          toast({
            title: 'Draft Restored',
            description: 'Your previous work has been restored.',
          });
        }
      } catch (error) {
        console.error('Failed to restore autosaved data:', error);
      }
    }
  }, []);

  const validateForm = () => {
    try {
      episodeSchema.parse({
        title,
        slug,
        season,
        episode_number: episodeNumber,
        description,
        content,
        status,
        series,
        publish_date: publishDate,
        duration,
        image_url: imageUrl,
        audio_url: audioUrl,
      });
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  const handleSaveAsDraft = async () => {
    setLoading(true);
    try {
      const { data: episode, error } = await supabase
        .from('episodes')
        .insert({
          title: title || 'Untitled Episode',
          slug: slug || slugify(title || 'untitled-episode'),
          description,
          content,
          summary: summary || null,
          transcript: transcript || null,
          season,
          episode_number: episodeNumber,
          series,
          publish_date: publishDate ? new Date(publishDate).toISOString() : null,
          status: 'draft',
          image_url: imageUrl || null,
          audio_url: audioUrl || null,
          duration: duration || null,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Save related data...
      await saveRelatedData(episode.id);

      toast({ 
        title: 'Draft Saved', 
        description: 'Your episode has been saved as a draft.'
      });
      
      localStorage.removeItem('autosave_new-episode');
      navigate('/admin');
    } catch (err) {
      console.error('Error saving draft:', err);
      toast({ 
        title: 'Error', 
        description: 'Failed to save draft', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const saveRelatedData = async (episodeId: string) => {
    // Add show notes
    if (showNotes.length > 0) {
      const { error: notesError } = await supabase.from('show_notes').insert(
        showNotes.map((note, index) => ({
          episode_id: episodeId,
          timestamp: note.timestamp,
          title: note.title,
          content: note.content || null,
          sort_order: index,
        }))
      );
      if (notesError) console.error('Error creating show notes:', notesError);
    }

    // Add episode guests
    if (guests.length > 0) {
      const { error: guestsError } = await supabase.from('episode_guests').insert(
        guests.map(guest => ({
          episode_id: episodeId,
          guest_id: guest.id,
        }))
      );
      if (guestsError) console.error('Error adding guests:', guestsError);
    }

    // Add platform links
    if (platformLinks.length > 0) {
      const { error: linksError } = await supabase.from('episode_platforms').insert(
        platformLinks.map(link => ({
          episode_id: episodeId,
          platform_name: link.platform_name,
          platform_url: link.platform_url,
        }))
      );
      if (linksError) console.error('Error adding platform links:', linksError);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({ title: 'Validation Error', description: 'Please fix the errors below', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    try {
      // Create episode first
      const { data: episode, error: episodeError } = await supabase
        .from('episodes')
        .insert({
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
          image_url: imageUrl || null,
          audio_url: audioUrl || null,
          duration: duration || null,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (episodeError) throw episodeError;

      await saveRelatedData(episode.id);

      toast({ title: 'Episode Created', description: 'New episode has been created with all content.' });
      
      // Clear auto-save data
      localStorage.removeItem('autosave_new-episode');
      
      navigate('/admin');
    } catch (err) {
      console.error('Error creating episode:', err);
      toast({ title: 'Error', description: 'Failed to create episode', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

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
            <div className="flex justify-between items-center">
              <CardTitle>Create New Episode</CardTitle>
              <div className="flex items-center gap-4">
                <AutoSaveIndicator lastSaved={lastSaved} isSaving={isSaving} />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPreview(true)}
                  disabled={!title}
                >
                  Preview
                </Button>
              </div>
            </div>
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
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <FormFieldError error={validationErrors.title} />
              </div>
              <div>
                <label htmlFor="slug" className="block text-sm font-medium mb-1">
                  Slug
                </label>
                <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
                <FormFieldError error={validationErrors.slug} />
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
                    onChange={(e) => setSeason(Number(e.target.value) || 1)}
                  />
                  <FormFieldError error={validationErrors.season} />
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
                    onChange={(e) => setEpisodeNumber(Number(e.target.value) || 1)}
                  />
                  <FormFieldError error={validationErrors['episode_number']} />
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
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[80px]"
                  placeholder="Short episode preview for listings..."
                />
              </div>
              <div>
                <label htmlFor="summary" className="block text-sm font-medium mb-1">
                  Episode Summary
                </label>
                <Textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="min-h-[100px]"
                  placeholder="Concise episode summary (500-2000 characters) highlighting key takeaways..."
                />
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
                      disabled={loading}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="content" className="space-y-4 mt-6">
                  <div>
                    <label htmlFor="content" className="block text-sm font-medium mb-1">
                      Episode Content
                    </label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[120px]"
                      placeholder="Episode content, summary, and notes..."
                    />
                  </div>
                  <div>
                    <label htmlFor="transcript" className="block text-sm font-medium mb-1">
                      Episode Transcript
                    </label>
                    <Textarea
                      id="transcript"
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      className="min-h-[200px]"
                      placeholder="Full episode transcript..."
                    />
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

              <div className="pt-4 border-t flex gap-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleSaveAsDraft}
                  disabled={loading || !title}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save as Draft'}
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#13B87B] hover:bg-[#0F9A6A]" 
                  disabled={loading}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? 'Creating...' : status === 'published' ? 'Publish Episode' : 'Create Episode'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <PreviewModal
          open={showPreview}
          onOpenChange={setShowPreview}
          episode={{
            title,
            description,
            content,
            season,
            episode_number: episodeNumber,
            series,
            publish_date: publishDate,
            duration,
            status,
            image_url: imageUrl,
            audio_url: audioUrl,
          }}
          showNotes={showNotes}
          guests={guests}
          platformLinks={platformLinks}
        />
      </div>
    </div>
  );
};

export default NewEpisode;
