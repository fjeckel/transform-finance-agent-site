import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Save, Send, FileText, BookOpen } from 'lucide-react';
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
import { FormSkeleton } from '@/components/ui/loading-skeleton';
import { TranslationPanel } from '@/components/ui/translation-panel';
import { useToast } from '@/hooks/use-toast';
import { useAutoSave } from '@/hooks/useAutoSave';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { InsightType, InsightStatus, DifficultyLevel } from '@/hooks/useInsights';
import { Checkbox } from '@/components/ui/checkbox';

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const EditInsight = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
  const [initialLoading, setInitialLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<any[]>([]);

  // Auto-save functionality
  const formData = {
    title, slug, subtitle, description, summary, content, insightType, status, difficultyLevel,
    categoryId, featured, readingTimeMinutes, publishDate, imageUrl, thumbnailUrl, tags, keywords,
    bookTitle, bookAuthor, bookIsbn, bookPublicationYear
  };
  
  const { lastSaved, isSaving } = useAutoSave({
    key: `edit-insight-${id}`,
    data: formData,
    enabled: !initialLoading,
  });

  useEffect(() => {
    if (id) {
      fetchInsight();
      fetchCategories();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('insights_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchInsight = async () => {
    try {
      const { data, error } = await supabase
        .from('insights')
        .select(`
          *,
          insights_categories (
            id,
            name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setTitle(data.title);
        setSlug(data.slug);
        setSubtitle(data.subtitle || '');
        setDescription(data.description || '');
        setSummary(data.summary || '');
        setContent(data.content || '');
        setInsightType(data.insight_type);
        setStatus(data.status);
        setDifficultyLevel(data.difficulty_level || 'none');
        setCategoryId(data.category_id || 'none');
        setFeatured(data.featured || false);
        setReadingTimeMinutes(data.reading_time_minutes || '');
        setPublishDate(data.published_at ? new Date(data.published_at).toISOString().split('T')[0] : '');
        setImageUrl(data.image_url || '');
        setThumbnailUrl(data.thumbnail_url || '');
        setTags(data.tags ? data.tags.join(', ') : '');
        setKeywords(data.keywords ? data.keywords.join(', ') : '');
        setBookTitle(data.book_title || '');
        setBookAuthor(data.book_author || '');
        setBookIsbn(data.book_isbn || '');
        setBookPublicationYear(data.book_publication_year || '');
      }
    } catch (error) {
      console.error('Error fetching insight:', error);
      toast({
        title: "Error",
        description: "Failed to load insight",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({ title: 'Validation Error', description: 'Please fix the errors below', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    try {
      const publishedAt = status === 'published' && !publishDate ? new Date().toISOString() : 
                          publishDate ? new Date(publishDate).toISOString() : null;

      const { error: insightError } = await supabase
        .from('insights')
        .update({
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
        })
        .eq('id', id);

      if (insightError) throw insightError;

      toast({ title: 'Insight Updated', description: 'Insight has been updated successfully.' });
      
      // Clear auto-save data
      localStorage.removeItem(`autosave_edit-insight-${id}`);
      
      navigate('/admin/insights');
    } catch (err) {
      console.error('Error updating insight:', err);
      toast({ title: 'Error', description: 'Failed to update insight', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <FormSkeleton />
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
              <CardTitle>Edit Insight</CardTitle>
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
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="media">Media</TabsTrigger>
                  <TabsTrigger value="book">Book Details</TabsTrigger>
                  <TabsTrigger value="translations">Translations</TabsTrigger>
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

                <TabsContent value="translations" className="space-y-4 mt-6">
                  <TranslationPanel
                    contentId={id!}
                    contentType="insight"
                    currentLanguage="de"
                    fields={['title', 'subtitle', 'description', 'content', 'summary', 'book_title']}
                    originalContent={{
                      title,
                      subtitle,
                      description,
                      content,
                      summary,
                      book_title: bookTitle
                    }}
                    onTranslationUpdate={(language, translations) => {
                      toast({
                        title: "Translation Updated",
                        description: `Translation to ${language} has been updated successfully.`,
                      });
                    }}
                  />
                </TabsContent>
              </Tabs>

              <div className="pt-4 border-t flex gap-3">
                <Button 
                  type="submit" 
                  className="bg-[#13B87B] hover:bg-[#0F9A6A]" 
                  disabled={loading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Updating...' : 'Update Insight'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview Modal - simplified for now */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Preview</h2>
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
              </div>
              <div className="space-y-4">
                <h1 className="text-2xl font-bold">{title}</h1>
                {subtitle && <p className="text-lg text-gray-600">{subtitle}</p>}
                {description && <p className="text-gray-700">{description}</p>}
                {summary && (
                  <div className="border-l-4 border-[#13B87B] pl-4">
                    <h3 className="font-semibold mb-2">Summary</h3>
                    <p className="text-gray-700">{summary}</p>
                  </div>
                )}
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap">{content}</pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditInsight;