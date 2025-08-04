import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Save, Send, FileText, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
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
import { FormFieldError, AutoSaveIndicator } from '@/components/ui/form-field-error';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useAutoSave } from '@/hooks/useAutoSave';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { InsightType, InsightStatus, DifficultyLevel } from '@/hooks/useInsights';
import { Checkbox } from '@/components/ui/checkbox';
import { useRichTextEditor, useSimplifiedForms, FeatureFlagDebugPanel } from '@/hooks/useFeatureFlags';
import AdaptiveRichTextEditor from '@/components/ui/adaptive-rich-text-editor';

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const NewInsight = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Add error boundary for component initialization
  const [componentError, setComponentError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [insightType, setInsightType] = useState<InsightType>('blog_article');
  const [status, setStatus] = useState<InsightStatus>('draft');
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel | 'none'>('none');
  const [categoryId, setCategoryId] = useState('none');
  const [featured, setFeatured] = useState(false);
  const [readingTimeMinutes, setReadingTimeMinutes] = useState<number | ''>('');
  const [publishDate, setPublishDate] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [tags, setTags] = useState('');
  const [keywords, setKeywords] = useState('');
  
  // Book-specific fields
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookIsbn, setBookIsbn] = useState('');
  const [bookPublicationYear, setBookPublicationYear] = useState<number | ''>('');
  
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Feature flags
  const useRichEditor = useRichTextEditor('insights');
  const useSimplified = useSimplifiedForms();

  // Auto-save functionality
  const formData = {
    title, slug, subtitle, description, summary, content, insightType, status, difficultyLevel,
    categoryId, featured, readingTimeMinutes, publishDate, imageUrl, thumbnailUrl, tags, keywords,
    bookTitle, bookAuthor, bookIsbn, bookPublicationYear
  };
  
  const { lastSaved, isSaving } = useAutoSave({
    key: 'new-insight',
    data: formData,
    enabled: true,
  });

  useEffect(() => {
    setSlug(slugify(title));
  }, [title]);

  useEffect(() => {
    try {
      fetchCategories();
    } catch (error: any) {
      console.error('Error in useEffect:', error);
      setComponentError(`Component initialization failed: ${error.message}`);
    }
  }, []);

  // Load autosaved data on component mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('autosave_new-insight');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          const data = parsed.data;
          
          // Show confirmation dialog
          if (window.confirm('Found autosaved data. Would you like to restore it?')) {
          setTitle(data.title || '');
          setSlug(data.slug || '');
          setSubtitle(data.subtitle || '');
          setDescription(data.description || '');
          setSummary(data.summary || '');
          setContent(data.content || '');
          setInsightType(data.insightType || 'blog_article');
          setStatus(data.status || 'draft');
          setDifficultyLevel(data.difficultyLevel || 'none');
          setCategoryId(data.categoryId || 'none');
          setFeatured(data.featured || false);
          setReadingTimeMinutes(data.readingTimeMinutes || '');
          setPublishDate(data.publishDate || '');
          setImageUrl(data.imageUrl || '');
          setThumbnailUrl(data.thumbnailUrl || '');
          setTags(data.tags || '');
          setKeywords(data.keywords || '');
          setBookTitle(data.bookTitle || '');
          setBookAuthor(data.bookAuthor || '');
          setBookIsbn(data.bookIsbn || '');
          setBookPublicationYear(data.bookPublicationYear || '');
          
          toast({
            title: 'Draft Restored',
            description: 'Your previous work has been restored.',
          });
          }
        } catch (parseError) {
          console.error('Failed to parse autosaved data:', parseError);
          localStorage.removeItem('autosave_new-insight'); // Remove corrupted data
        }
      }
    } catch (error: any) {
      console.error('Error loading autosaved data:', error);
      setComponentError(`Failed to load autosaved data: ${error.message}`);
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('insights_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: 'Warning',
          description: 'Could not load categories. You can still create insights.',
          variant: 'destructive',
        });
        return;
      }
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Warning', 
        description: 'Could not load categories. You can still create insights.',
        variant: 'destructive',
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!title.trim()) errors.title = 'Title is required';
    if (!slug.trim()) errors.slug = 'Slug is required';
    if (!content.trim()) errors.content = 'Content is required';
    
    if (insightType === 'book_summary') {
      if (!bookTitle.trim()) errors.bookTitle = 'Book title is required for book summaries';
      if (!bookAuthor.trim()) errors.bookAuthor = 'Book author is required for book summaries';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAsDraft = async () => {
    if (!title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data: insight, error } = await supabase
        .from('insights')
        .insert({
          title: title || 'Untitled Insight',
          slug: slug || slugify(title || 'untitled-insight'),
          subtitle: subtitle || null,
          description: description || null,
          summary: summary || null,
          content: content || 'Draft content...',
          insight_type: insightType,
          status: 'draft',
          difficulty_level: difficultyLevel === 'none' ? null : difficultyLevel || null,
          category_id: categoryId === 'none' ? null : categoryId || null,
          featured: featured,
          reading_time_minutes: readingTimeMinutes || null,
          published_at: null,
          image_url: imageUrl || null,
          thumbnail_url: thumbnailUrl || null,
          tags: tags ? tags.split(',').map(t => t.trim()) : null,
          keywords: keywords ? keywords.split(',').map(k => k.trim()) : null,
          book_title: insightType === 'book_summary' ? bookTitle || null : null,
          book_author: insightType === 'book_summary' ? bookAuthor || null : null,
          book_isbn: insightType === 'book_summary' ? bookIsbn || null : null,
          book_publication_year: insightType === 'book_summary' ? bookPublicationYear || null : null,
          created_by: user?.id || null,
          content_format: useRichEditor ? 'html' : 'markdown',
        })
        .select()
        .single();

      if (error) throw error;

      toast({ 
        title: 'Draft Saved', 
        description: 'Your insight has been saved as a draft.'
      });
      
      localStorage.removeItem('autosave_new-insight');
      navigate('/admin/insights');
    } catch (err: any) {
      console.error('Error saving draft:', err);
      const errorMessage = err?.message || 'Unknown error occurred';
      toast({ 
        title: 'Error Saving Draft', 
        description: `Failed to save draft: ${errorMessage}`, 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
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
      const publishedAt = status === 'published' ? new Date().toISOString() : 
                          publishDate ? new Date(publishDate).toISOString() : null;

      const { data: insight, error: insightError } = await supabase
        .from('insights')
        .insert({
          title,
          slug,
          subtitle: subtitle || null,
          description: description || null,
          summary: summary || null,
          content,
          insight_type: insightType,
          status,
          difficulty_level: difficultyLevel === 'none' ? null : difficultyLevel || null,
          category_id: categoryId === 'none' ? null : categoryId || null,
          featured: featured,
          reading_time_minutes: readingTimeMinutes || null,
          published_at: publishedAt,
          image_url: imageUrl || null,
          thumbnail_url: thumbnailUrl || null,
          tags: tags ? tags.split(',').map(t => t.trim()) : null,
          keywords: keywords ? keywords.split(',').map(k => k.trim()) : null,
          book_title: insightType === 'book_summary' ? bookTitle || null : null,
          book_author: insightType === 'book_summary' ? bookAuthor || null : null,
          book_isbn: insightType === 'book_summary' ? bookIsbn || null : null,
          book_publication_year: insightType === 'book_summary' ? bookPublicationYear || null : null,
          created_by: user?.id || null,
          content_format: useRichEditor ? 'html' : 'markdown',
        })
        .select()
        .single();

      if (insightError) throw insightError;

      toast({ title: 'Insight Created', description: 'New insight has been created successfully.' });
      
      // Clear auto-save data
      localStorage.removeItem('autosave_new-insight');
      
      navigate('/admin/insights');
    } catch (err: any) {
      console.error('Error creating insight:', err);
      const errorMessage = err?.message || 'Unknown error occurred';
      toast({ 
        title: 'Error Creating Insight', 
        description: `Failed to create insight: ${errorMessage}`, 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Check authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">You need to be logged in to create new insights.</p>
              <Button onClick={() => navigate('/auth')}>
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show error state if component failed to initialize
  if (componentError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4">
            <Link to="/admin/insights" className="text-sm text-[#13B87B] hover:underline">
              &larr; Back to Insights
            </Link>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Error Loading New Insight Form</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-4">{componentError}</p>
              <Button onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <Link to="/admin/insights" className="text-sm text-[#13B87B] hover:underline">
            &larr; Back to Insights
          </Link>
        </div>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Create New Insight</CardTitle>
              <div className="flex items-center gap-4">
                <AutoSaveIndicator lastSaved={lastSaved} isSaving={isSaving} />
                {/* Preview functionality temporarily disabled */}
                <Button
                  type="button"
                  variant="outline"
                  disabled={true}
                  className="opacity-50"
                >
                  Preview (Coming Soon)
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Simplified Form (when feature flags are enabled) */}
              {useSimplified ? (
                <div className="space-y-6">
                  {/* Essential Fields */}
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium mb-1">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <Input 
                        id="title" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        required 
                        placeholder="Enter a compelling title..."
                      />
                      <FormFieldError error={validationErrors.title} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="insightType" className="block text-sm font-medium mb-1">
                          Type <span className="text-red-500">*</span>
                        </label>
                        <Select value={insightType} onValueChange={(v) => setInsightType(v as InsightType)}>
                          <SelectTrigger id="insightType">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="book_summary">Book Summary</SelectItem>
                            <SelectItem value="blog_article">Article</SelectItem>
                            <SelectItem value="guide">Guide</SelectItem>
                            <SelectItem value="case_study">Case Study</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label htmlFor="status" className="block text-sm font-medium mb-1">
                          Status <span className="text-red-500">*</span>
                        </label>
                        <Select value={status} onValueChange={(v) => setStatus(v as InsightStatus)}>
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

                    {/* Rich Text Editor or Textarea based on feature flag */}
                    <div>
                      <label htmlFor="content" className="block text-sm font-medium mb-1">
                        Content <span className="text-red-500">*</span>
                      </label>
                      <div className="text-xs text-muted-foreground mb-2">
                        Start with a brief description, then add your main content. Use headings to structure your content.
                      </div>
                      {useRichEditor ? (
                        <AdaptiveRichTextEditor
                          content={content}
                          onChange={setContent}
                          placeholder="Start with a brief description, then add your main content..."
                          minHeight="300px"
                          maxLength={50000}
                        />
                      ) : (
                        <Textarea
                          id="content"
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          className="min-h-[300px]"
                          placeholder="Write your insight content here. Markdown is supported..."
                          required
                        />
                      )}
                      <FormFieldError error={validationErrors.content} />
                    </div>
                  </div>

                  {/* Progressive Disclosure for Advanced Options */}
                  <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-sm font-medium bg-muted/50 rounded-lg hover:bg-muted">
                      <span>Advanced Options</span>
                      {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 mt-4">
                      <div>
                        <label htmlFor="subtitle" className="block text-sm font-medium mb-1">
                          Subtitle
                        </label>
                        <Input 
                          id="subtitle" 
                          value={subtitle} 
                          onChange={(e) => setSubtitle(e.target.value)}
                          placeholder="Optional subtitle"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="difficultyLevel" className="block text-sm font-medium mb-1">
                            Difficulty Level
                          </label>
                          <Select value={difficultyLevel} onValueChange={(v) => setDifficultyLevel(v as DifficultyLevel | 'none')}>
                            <SelectTrigger id="difficultyLevel">
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label htmlFor="categoryId" className="block text-sm font-medium mb-1">
                            Category
                          </label>
                          <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger id="categoryId">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Category</SelectItem>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="readingTime" className="block text-sm font-medium mb-1">
                            Reading Time (minutes)
                          </label>
                          <Input
                            id="readingTime"
                            type="number"
                            value={readingTimeMinutes}
                            onChange={(e) => setReadingTimeMinutes(e.target.value ? parseInt(e.target.value) : '')}
                            placeholder="5"
                          />
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
                      </div>

                      <div>
                        <label htmlFor="tags" className="block text-sm font-medium mb-1">
                          Tags (comma-separated)
                        </label>
                        <Input
                          id="tags"
                          value={tags}
                          onChange={(e) => setTags(e.target.value)}
                          placeholder="finance, transformation, leadership"
                        />
                      </div>

                      <div>
                        <label htmlFor="keywords" className="block text-sm font-medium mb-1">
                          SEO Keywords (comma-separated)
                        </label>
                        <Input
                          id="keywords"
                          value={keywords}
                          onChange={(e) => setKeywords(e.target.value)}
                          placeholder="finance transformation, digital finance, CFO"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="featured"
                          checked={featured}
                          onCheckedChange={(checked) => setFeatured(!!checked)}
                        />
                        <label htmlFor="featured" className="text-sm font-medium">
                          Mark as featured content
                        </label>
                      </div>

                      {/* Book-specific fields for book summaries */}
                      {insightType === 'book_summary' && (
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                          <h3 className="text-sm font-medium">Book Information</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="bookTitle" className="block text-sm font-medium mb-1">
                                Book Title <span className="text-red-500">*</span>
                              </label>
                              <Input
                                id="bookTitle"
                                value={bookTitle}
                                onChange={(e) => setBookTitle(e.target.value)}
                                placeholder="The Finance Book"
                                required={insightType === 'book_summary'}
                              />
                              <FormFieldError error={validationErrors.bookTitle} />
                            </div>
                            <div>
                              <label htmlFor="bookAuthor" className="block text-sm font-medium mb-1">
                                Book Author <span className="text-red-500">*</span>
                              </label>
                              <Input
                                id="bookAuthor"
                                value={bookAuthor}
                                onChange={(e) => setBookAuthor(e.target.value)}
                                placeholder="Author Name"
                                required={insightType === 'book_summary'}
                              />
                              <FormFieldError error={validationErrors.bookAuthor} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="bookIsbn" className="block text-sm font-medium mb-1">
                                ISBN (Optional)
                              </label>
                              <Input
                                id="bookIsbn"
                                value={bookIsbn}
                                onChange={(e) => setBookIsbn(e.target.value)}
                                placeholder="978-0123456789"
                              />
                            </div>
                            <div>
                              <label htmlFor="bookPublicationYear" className="block text-sm font-medium mb-1">
                                Publication Year
                              </label>
                              <Input
                                id="bookPublicationYear"
                                type="number"
                                value={bookPublicationYear}
                                onChange={(e) => setBookPublicationYear(e.target.value ? parseInt(e.target.value) : '')}
                                placeholder="2023"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Image Upload */}
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Cover Image
                        </label>
                        <ImageUpload
                          onUpload={setImageUrl}
                          currentImageUrl={imageUrl}
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ) : (
                // Original Tab-based Form
                <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="media">Media</TabsTrigger>
                  <TabsTrigger value="book">Book Details</TabsTrigger>
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

                  <div>
                    <label htmlFor="subtitle" className="block text-sm font-medium mb-1">
                      Subtitle (Optional)
                    </label>
                    <Input id="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="insightType" className="block text-sm font-medium mb-1">
                        Type
                      </label>
                      <Select value={insightType} onValueChange={(v) => setInsightType(v as InsightType)}>
                        <SelectTrigger id="insightType">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="book_summary">Book Summary</SelectItem>
                          <SelectItem value="blog_article">Article</SelectItem>
                          <SelectItem value="guide">Guide</SelectItem>
                          <SelectItem value="case_study">Case Study</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium mb-1">
                        Status
                      </label>
                      <Select value={status} onValueChange={(v) => setStatus(v as InsightStatus)}>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="difficultyLevel" className="block text-sm font-medium mb-1">
                        Difficulty Level
                      </label>
                      <Select value={difficultyLevel} onValueChange={(v) => setDifficultyLevel(v as DifficultyLevel | 'none')}>
                        <SelectTrigger id="difficultyLevel">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label htmlFor="categoryId" className="block text-sm font-medium mb-1">
                        Category
                      </label>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger id="categoryId">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Category</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="readingTime" className="block text-sm font-medium mb-1">
                        Reading Time (minutes)
                      </label>
                      <Input 
                        id="readingTime" 
                        type="number" 
                        min="1" 
                        value={readingTimeMinutes} 
                        onChange={(e) => setReadingTimeMinutes(e.target.value ? parseInt(e.target.value) : '')} 
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="publishDate" className="block text-sm font-medium mb-1">
                        Publish Date (Optional)
                      </label>
                      <Input
                        id="publishDate"
                        type="date"
                        value={publishDate}
                        onChange={(e) => setPublishDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="featured" 
                      checked={featured} 
                      onCheckedChange={setFeatured} 
                    />
                    <label htmlFor="featured" className="text-sm font-medium">
                      Featured Insight
                    </label>
                  </div>
                </TabsContent>

                <TabsContent value="content" className="space-y-4 mt-6">
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-1">
                      Description
                    </label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[80px]"
                      placeholder="Short description for previews and SEO..."
                    />
                  </div>

                  <div>
                    <label htmlFor="summary" className="block text-sm font-medium mb-1">
                      Summary
                    </label>
                    <Textarea
                      id="summary"
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="min-h-[100px]"
                      placeholder="Key takeaways and summary points..."
                    />
                  </div>

                  <div>
                    <label htmlFor="content" className="block text-sm font-medium mb-1">
                      Main Content (Markdown supported)
                    </label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[300px]"
                      placeholder="Write your insight content here. Markdown is supported..."
                      required
                    />
                    <FormFieldError error={validationErrors.content} />
                  </div>

                  <div>
                    <label htmlFor="tags" className="block text-sm font-medium mb-1">
                      Tags (comma-separated)
                    </label>
                    <Input
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="finance, transformation, leadership"
                    />
                  </div>

                  <div>
                    <label htmlFor="keywords" className="block text-sm font-medium mb-1">
                      SEO Keywords (comma-separated)
                    </label>
                    <Input
                      id="keywords"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="finance transformation, digital finance, CFO"
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
                      Thumbnail Image
                    </label>
                    <ImageUpload
                      value={thumbnailUrl}
                      onChange={(url) => setThumbnailUrl(url || '')}
                      disabled={loading}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="book" className="space-y-4 mt-6">
                  {insightType === 'book_summary' ? (
                    <>
                      <div>
                        <label htmlFor="bookTitle" className="block text-sm font-medium mb-1">
                          Book Title
                        </label>
                        <Input 
                          id="bookTitle" 
                          value={bookTitle} 
                          onChange={(e) => setBookTitle(e.target.value)}
                          placeholder="The original book title"
                        />
                        <FormFieldError error={validationErrors.bookTitle} />
                      </div>

                      <div>
                        <label htmlFor="bookAuthor" className="block text-sm font-medium mb-1">
                          Book Author
                        </label>
                        <Input 
                          id="bookAuthor" 
                          value={bookAuthor} 
                          onChange={(e) => setBookAuthor(e.target.value)}
                          placeholder="Author name"
                        />
                        <FormFieldError error={validationErrors.bookAuthor} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="bookIsbn" className="block text-sm font-medium mb-1">
                            ISBN (Optional)
                          </label>
                          <Input 
                            id="bookIsbn" 
                            value={bookIsbn} 
                            onChange={(e) => setBookIsbn(e.target.value)}
                            placeholder="978-0-123456-78-9"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="bookYear" className="block text-sm font-medium mb-1">
                            Publication Year (Optional)
                          </label>
                          <Input 
                            id="bookYear" 
                            type="number" 
                            min="1800" 
                            max={new Date().getFullYear()}
                            value={bookPublicationYear} 
                            onChange={(e) => setBookPublicationYear(e.target.value ? parseInt(e.target.value) : '')}
                            placeholder="2023"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>Book details are only available for Book Summary insights.</p>
                      <p>Change the insight type to "Book Summary" to add book information.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              )}

              {/* Form Action Buttons */}
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
                  {loading ? 'Creating...' : status === 'published' ? 'Publish Insight' : 'Create Insight'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview functionality will be added in future update */}
        
        {/* Feature Flag Debug Panel (development only) */}
        <FeatureFlagDebugPanel />
      </div>
    </div>
  );
};

export default NewInsight;