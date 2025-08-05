import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Save, Send, FileText, AlertCircle } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImageUpload } from '@/components/ui/image-upload';
import { AudioUpload } from '@/components/ui/audio-upload';
import { ShowNotesManager } from '@/components/ui/show-notes-manager';
import { GuestManager } from '@/components/ui/guest-manager';
import { PlatformLinksManager } from '@/components/ui/platform-links-manager';
import { PreviewModal } from '@/components/ui/preview-modal';
import { FormFieldError, AutoSaveIndicator } from '@/components/ui/form-field-error';
import { TranslationPanel } from '@/components/ui/translation-panel';
import { useToast } from '@/hooks/use-toast';
import { useAutoSave } from '@/hooks/useAutoSave';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { episodeSchema } from '@/lib/validation';
import { z } from 'zod';
import { PostgrestError } from '@supabase/supabase-js';

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Helper function to parse Supabase errors
const parseSupabaseError = (error: PostgrestError): string => {
  // Handle common database constraint errors
  if (error.code === '23505') {
    if (error.message.includes('slug')) {
      return 'An episode with this slug already exists. Please use a different title or modify the slug.';
    }
    if (error.message.includes('episode_number') && error.message.includes('season')) {
      return 'An episode with this season and episode number already exists.';
    }
    return 'This record already exists. Please check for duplicates.';
  }
  
  if (error.code === '42501') {
    return 'You do not have permission to create episodes. Please contact an administrator.';
  }
  
  if (error.code === '23503') {
    return 'Invalid reference. Please check that all selected items exist.';
  }
  
  if (error.message.includes('violates row-level security policy')) {
    return 'You do not have permission to perform this action. Make sure you are logged in as an admin.';
  }
  
  // Generic error fallback
  return error.message || 'An unexpected database error occurred. Please try again.';
};

const NewEpisode = () => {
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
  const [imageUrl, setImageUrl] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [showNotes, setShowNotes] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [platformLinks, setPlatformLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>('');
  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null);
  const [episodeId, setEpisodeId] = useState<string | null>(null);

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

  // Debounce slug generation to prevent excessive re-renders
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (title.trim()) {
        setSlug(slugify(title));
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [title]);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdminUser(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdminUser(false);
        } else {
          setIsAdminUser(data?.role === 'admin');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdminUser(false);
      }
    };

    checkAdminStatus();
  }, [user]);

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
  }, [toast]);

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
      setGeneralError('');
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
    setGeneralError('');
    
    try {
      // Prepare insert data
      const insertData: any = {
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
      };

      // Only add content_format if using rich text editor (for backward compatibility)
      if (isUsingRichTextEditor) {
        insertData.content_format = 'html';
      }

      const { data: episode, error } = await supabase
        .from('episodes')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        setGeneralError(parseSupabaseError(error));
        throw error;
      }

      // Save related data...
      await saveRelatedData(episode.id);

      // Set episode ID for translations
      setEpisodeId(episode.id);

      toast({ 
        title: 'Draft Saved', 
        description: 'Your episode has been saved as a draft. You can now add translations.'
      });
      
      localStorage.removeItem('autosave_new-episode');
      navigate('/admin');
    } catch (err: any) {
      console.error('Error saving draft:', err);
      toast({ 
        title: 'Error', 
        description: generalError || 'Failed to save draft. Please check the error message above.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const saveRelatedData = async (episodeId: string) => {
    const errors: string[] = [];

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
      if (notesError) {
        console.error('Error creating show notes:', notesError);
        errors.push('Failed to save some show notes');
      }
    }

    // Add episode guests
    if (guests.length > 0) {
      const { error: guestsError } = await supabase.from('episode_guests').insert(
        guests.map(guest => ({
          episode_id: episodeId,
          guest_id: guest.id,
        }))
      );
      if (guestsError) {
        console.error('Error adding guests:', guestsError);
        errors.push('Failed to save some guest associations');
      }
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
      if (linksError) {
        console.error('Error adding platform links:', linksError);
        errors.push('Failed to save some platform links');
      }
    }

    if (errors.length > 0) {
      toast({
        title: 'Warning',
        description: `Episode created but: ${errors.join(', ')}`,
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    
    if (!validateForm()) {
      toast({ title: 'Validation Error', description: 'Please fix the errors below', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    try {
      // Prepare insert data
      const insertData: any = {
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
      };

      // Only add content_format if using rich text editor (for backward compatibility)
      if (isUsingRichTextEditor) {
        insertData.content_format = 'html';
      }

      // Create episode first
      const { data: episode, error: episodeError } = await supabase
        .from('episodes')
        .insert(insertData)
        .select()
        .single();

      if (episodeError) {
        setGeneralError(parseSupabaseError(episodeError));
        throw episodeError;
      }

      await saveRelatedData(episode.id);

      // Set episode ID for translations
      setEpisodeId(episode.id);

      toast({ title: 'Episode Created', description: 'New episode has been created successfully.' });
      
      // Clear auto-save data
      localStorage.removeItem('autosave_new-episode');
      
      navigate('/admin');
    } catch (err: any) {
      console.error('Error creating episode:', err);
      toast({ 
        title: 'Error', 
        description: generalError || 'Failed to create episode. Please check the error message above.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Show warning if user is not admin
  if (isAdminUser === false) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You do not have permission to create episodes. Please contact an administrator.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Link to="/admin" className="text-sm text-[#13B87B] hover:underline">
              &larr; Back to Admin
            </Link>
          </div>
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
        
        {/* Show general error if any */}
        {generalError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{generalError}</AlertDescription>
          </Alert>
        )}

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
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="media">Media</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  <TabsTrigger value="translations">Translations</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                  aria-invalid={!!validationErrors.title}
                  aria-describedby={validationErrors.title ? "title-error" : undefined}
                />
                <FormFieldError id="title-error" error={validationErrors.title} />
              </div>
              <div>
                <label htmlFor="slug" className="block text-sm font-medium mb-1">
                  Slug <span className="text-red-500">*</span>
                </label>
                <Input 
                  id="slug" 
                  value={slug} 
                  onChange={(e) => setSlug(e.target.value)} 
                  required 
                  aria-invalid={!!validationErrors.slug}
                  aria-describedby={validationErrors.slug ? "slug-error" : undefined}
                />
                <FormFieldError id="slug-error" error={validationErrors.slug} />
                <p className="text-xs text-muted-foreground mt-1">
                  URL-friendly version of the title. Must be unique.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="season" className="block text-sm font-medium mb-1">
                    Season <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="season"
                    type="number"
                    min="1"
                    value={season}
                    onChange={(e) => setSeason(Number(e.target.value) || 1)}
                    aria-invalid={!!validationErrors.season}
                    aria-describedby={validationErrors.season ? "season-error" : undefined}
                  />
                  <FormFieldError id="season-error" error={validationErrors.season} />
                </div>
                <div>
                  <label htmlFor="episodeNumber" className="block text-sm font-medium mb-1">
                    Episode Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="episodeNumber"
                    type="number"
                    min="1"
                    value={episodeNumber}
                    onChange={(e) => setEpisodeNumber(Number(e.target.value) || 1)}
                    aria-invalid={!!validationErrors['episode_number']}
                    aria-describedby={validationErrors['episode_number'] ? "episode-number-error" : undefined}
                  />
                  <FormFieldError id="episode-number-error" error={validationErrors['episode_number']} />
                  <p className="text-xs text-muted-foreground mt-1">
                    Season + Episode number must be unique.
                  </p>
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
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to publish immediately or set a future date for scheduling.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="series" className="block text-sm font-medium mb-1">
                    Podcast Series <span className="text-red-500">*</span>
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
                    Status <span className="text-red-500">*</span>
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
                    placeholder="Short episode preview for listings (max 1000 characters)..."
                    className="min-h-[80px]"
                    maxLength={1000}
                    disabled={loading}
                  />
                ) : (
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[80px]"
                    placeholder="Short episode preview for listings (max 1000 characters)..."
                    maxLength={1000}
                    aria-invalid={!!validationErrors.description}
                    aria-describedby={validationErrors.description ? "description-error" : undefined}
                  />
                )}
                <div className="flex justify-between mt-1">
                  <FormFieldError id="description-error" error={validationErrors.description} />
                  <span className="text-xs text-muted-foreground">{description.length}/1000</span>
                </div>
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
                    maxLength={2000}
                    disabled={loading}
                  />
                ) : (
                  <Textarea
                    id="summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="min-h-[100px]"
                    placeholder="Concise episode summary (500-2000 characters) highlighting key takeaways..."
                    maxLength={2000}
                  />
                )}
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-muted-foreground">
                    This summary will be displayed on the episode page to give listeners an overview of key points.
                  </p>
                  <span className="text-xs text-muted-foreground">{summary.length}/2000</span>
                </div>
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
                    <FormFieldError error={validationErrors.image_url} />
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
                    <FormFieldError error={validationErrors.audio_url} />
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
                        placeholder="Episode content, summary, and notes (max 10000 characters)..."
                        className="min-h-[120px]"
                        maxLength={10000}
                        disabled={loading}
                      />
                    ) : (
                      <Textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[120px]"
                        placeholder="Episode content, summary, and notes (max 10000 characters)..."
                        maxLength={10000}
                        aria-invalid={!!validationErrors.content}
                        aria-describedby={validationErrors.content ? "content-error" : undefined}
                      />
                    )}
                    <div className="flex justify-between mt-1">
                      <FormFieldError id="content-error" error={validationErrors.content} />
                      <span className="text-xs text-muted-foreground">{content.length}/10000</span>
                    </div>
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

                <TabsContent value="translations" className="space-y-4 mt-6">
                  {episodeId ? (
                    <TranslationPanel
                      contentId={episodeId}
                      contentType="episode"
                      currentLanguage="de"
                      fields={['title', 'description', 'content', 'summary']}
                      originalContent={{
                        title,
                        description,
                        content,
                        summary
                      }}
                      onTranslationUpdate={(language, translations) => {
                        toast({
                          title: "Translation Updated",
                          description: `Translation to ${language} has been updated successfully.`,
                        });
                      }}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">
                        Save the episode as a draft first to enable translations
                      </p>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleSaveAsDraft}
                        disabled={loading || !title}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Save as Draft
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    Fields marked with <span className="text-red-500">*</span> are required
                  </p>
                </div>
                <div className="flex gap-3">
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