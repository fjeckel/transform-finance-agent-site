import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const [publishDate, setPublishDate] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled' | 'archived'>('draft');
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
    title, slug, season, episodeNumber, description, content, publishDate, status,
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
          season,
          episode_number: episodeNumber,
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

      // Add show notes
      if (showNotes.length > 0) {
        const { error: notesError } = await supabase.from('show_notes').insert(
          showNotes.map((note, index) => ({
            episode_id: episode.id,
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
            episode_id: episode.id,
            guest_id: guest.id,
          }))
        );
        if (guestsError) console.error('Error adding guests:', guestsError);
      }

      // Add platform links
      if (platformLinks.length > 0) {
        const { error: linksError } = await supabase.from('episode_platforms').insert(
          platformLinks.map(link => ({
            episode_id: episode.id,
            platform_name: link.platform_name,
            platform_url: link.platform_url,
          }))
        );
        if (linksError) console.error('Error adding platform links:', linksError);
      }

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

              <div className="pt-4 border-t">
                <Button type="submit" className="bg-[#13B87B] hover:bg-[#0F9A6A]" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Episode'}
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
