import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Upload, Wand2, Eye, Globe, Search, RefreshCw, GitMerge, CheckSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface UploadRow {
  id?: string; // Episode ID for updates
  mode?: 'create' | 'update' | 'upsert'; // Operation mode
  title: string;
  description: string;
  content?: string;
  summary?: string;
  series: 'wtf' | 'finance_transformers' | 'cfo_memo';
  season: number;
  episode_number: number;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  publish_date?: string;
  duration?: string;
  image_url?: string;
  audio_url?: string;
  spotify?: string;
  apple?: string;
  google?: string;
  youtube?: string;
  // Existing episode data for comparison
  existing?: UploadRow;
  fieldsToUpdate?: string[]; // Which fields to update
}

interface ExistingEpisode {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  summary?: string;
  series: string;
  season: number;
  episode_number: number;
  status: string;
  publish_date?: string;
  duration?: string;
  image_url?: string;
  audio_url?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Content parsing patterns
const CONTENT_PATTERNS = {
  title: [
    /^#\s+(.+)$/m,                    // Markdown header
    /^Title:\s*(.+)$/mi,              // "Title: ..."
    /^Episode\s*\d*:?\s*(.+)$/mi,     // "Episode 1: ..."
    /^(.+)\s*-\s*Episode/mi,          // "Title - Episode"
    /^(.{10,80}?)(?:\n|\.|$)/m,       // First substantial line (10-80 chars)
  ],
  
  summary: [
    /Summary:\s*(.+?)(?=\n\n|\n[A-Z]|$)/mis,
    /Overview:\s*(.+?)(?=\n\n|\n[A-Z]|$)/mis,
    /Key Points:\s*(.+?)(?=\n\n|\n[A-Z]|$)/mis,
    /^(.{100,500}?)\.\s*(?:\n\n|\n[A-Z])/mis,  // First substantial paragraph
  ],
  
  description: [
    /Description:\s*(.+?)(?=\n\n|\n[A-Z]|$)/mis,
    /About this episode:\s*(.+?)(?=\n\n|\n[A-Z]|$)/mis,
    /In this episode:\s*(.+?)(?=\n\n|\n[A-Z]|$)/mis,
  ],
  
  content: [
    /Content:\s*(.+)$/mis,
    /Transcript:\s*(.+)$/mis,
    /Full Text:\s*(.+)$/mis,
    /^(.{500,})$/mis,  // Everything if substantial
  ]
};

// Parse unstructured content into episode fields
const parseUnstructuredContent = (rawContent: string): UploadRow => {
  const cleaned = rawContent
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  let title = '';
  let description = '';
  let summary = '';
  const content = cleaned;

  // Extract title
  for (const pattern of CONTENT_PATTERNS.title) {
    const match = cleaned.match(pattern);
    if (match && match[1] && !title) {
      title = match[1].trim();
      break;
    }
  }

  // Extract description
  for (const pattern of CONTENT_PATTERNS.description) {
    const match = cleaned.match(pattern);
    if (match && match[1] && !description) {
      description = match[1].trim().substring(0, 1000);
      break;
    }
  }

  // Extract summary
  for (const pattern of CONTENT_PATTERNS.summary) {
    const match = cleaned.match(pattern);
    if (match && match[1] && !summary) {
      summary = match[1].trim();
      break;
    }
  }

  // Fallbacks
  if (!title) {
    const firstLine = cleaned.split('\n')[0].trim();
    title = firstLine.length > 5 && firstLine.length < 100 
      ? firstLine 
      : 'Untitled Episode';
  }

  if (!description && content) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    description = sentences.slice(0, 2).join('. ').trim().substring(0, 500) + '.';
  }

  if (!summary && content) {
    const words = content.split(' ');
    summary = words.length > 50 
      ? words.slice(0, 30).join(' ') + '...'
      : content.substring(0, 300);
  }

  return {
    mode: 'create',
    title,
    description,
    content,
    series: 'finance_transformers',
    season: 1,
    episode_number: 1,
    status: 'draft',
    summary,
    fieldsToUpdate: ['title', 'description', 'content', 'summary']
  };
};

const BulkUploadEpisodes = () => {
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [fileType, setFileType] = useState<'csv' | 'excel'>('excel');
  const [rawTextContent, setRawTextContent] = useState('');
  const [parsedContent, setParsedContent] = useState<UploadRow | null>(null);
  // New state for episode enrichment
  const [operationMode, setOperationMode] = useState<'create' | 'update' | 'upsert'>('create');
  const [existingEpisodes, setExistingEpisodes] = useState<ExistingEpisode[]>([]);
  const [searchingEpisodes, setSearchingEpisodes] = useState(false);
  const [matchingStrategy, setMatchingStrategy] = useState<'slug' | 'title' | 'season_episode'>('slug');
  const [processingText, setProcessingText] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load existing episodes for matching
  const loadExistingEpisodes = async () => {
    setSearchingEpisodes(true);
    try {
      const { data: episodes, error } = await supabase
        .from('episodes')
        .select('id, title, slug, description, content, summary, series, season, episode_number, status, publish_date, duration, image_url, audio_url')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setExistingEpisodes(episodes || []);
    } catch (error) {
      console.error('Failed to load existing episodes:', error);
      toast({ title: 'Error', description: 'Failed to load existing episodes', variant: 'destructive' });
    } finally {
      setSearchingEpisodes(false);
    }
  };

  // Find matching episode based on strategy
  const findMatchingEpisode = (row: UploadRow): ExistingEpisode | null => {
    if (!existingEpisodes.length) return null;

    switch (matchingStrategy) {
      case 'slug':
        const slug = slugify(row.title);
        return existingEpisodes.find(ep => ep.slug === slug) || null;
      case 'title':
        return existingEpisodes.find(ep => 
          ep.title.toLowerCase().trim() === row.title.toLowerCase().trim()
        ) || null;
      case 'season_episode':
        return existingEpisodes.find(ep => 
          ep.series === row.series && 
          ep.season === row.season && 
          ep.episode_number === row.episode_number
        ) || null;
      default:
        return null;
    }
  };

  // Auto-detect matches and set mode
  const detectAndSetMatches = () => {
    const updatedRows = rows.map(row => {
      const existing = findMatchingEpisode(row);
      if (existing && operationMode !== 'create') {
        return {
          ...row,
          id: existing.id,
          mode: operationMode,
          existing: {
            title: existing.title,
            description: existing.description || '',
            content: existing.content || '',
            summary: existing.summary || '',
            series: existing.series as any,
            season: existing.season,
            episode_number: existing.episode_number,
            status: existing.status as any,
            publish_date: existing.publish_date,
            duration: existing.duration,
            image_url: existing.image_url,
            audio_url: existing.audio_url
          }
        };
      }
      return { ...row, mode: operationMode };
    });
    setRows(updatedRows);
  };

  // Load existing episodes when component mounts or mode changes
  React.useEffect(() => {
    if (operationMode !== 'create') {
      loadExistingEpisodes();
    }
  }, [operationMode]);

  // Auto-detect matches when episodes or strategy changes
  React.useEffect(() => {
    if (existingEpisodes.length > 0 && rows.length > 0) {
      detectAndSetMatches();
    }
  }, [existingEpisodes, matchingStrategy, operationMode]);

  // Handle text content processing
  const handleTextProcessing = () => {
    if (!rawTextContent.trim()) {
      toast({ title: 'Error', description: 'Please paste some content first', variant: 'destructive' });
      return;
    }

    setProcessingText(true);
    try {
      const parsed = parseUnstructuredContent(rawTextContent);
      setParsedContent(parsed);
      toast({ title: 'Content Parsed', description: 'Your content has been successfully parsed!' });
    } catch (error) {
      console.error('Error parsing content:', error);
      toast({ title: 'Error', description: 'Failed to parse content', variant: 'destructive' });
    } finally {
      setProcessingText(false);
    }
  };

  // Add parsed content to upload queue
  const addParsedToQueue = () => {
    if (!parsedContent) return;
    
    const newRows = [...rows, parsedContent];
    setRows(newRows);
    
    // Validate the new content
    const allErrors: ValidationError[] = [];
    newRows.forEach((row, index) => {
      allErrors.push(...validateRow(row, index));
    });
    setValidationErrors(allErrors);
    
    // Clear the text area and parsed content
    setRawTextContent('');
    setParsedContent(null);
    
    toast({ title: 'Added to Queue', description: 'Episode added to upload queue' });
  };

  // Handle AI translation after upload
  const handleAutoTranslation = async (episodeId: string) => {
    if (!autoTranslate) return;

    try {
      const { data, error } = await supabase.functions.invoke('translate-content', {
        body: {
          contentId: episodeId,
          contentType: 'episode',
          targetLanguage: 'en',
          fields: ['title', 'description', 'content', 'summary'],
          priority: 'medium'
        }
      });

      if (error) {
        console.warn('Auto-translation failed:', error);
        toast({ 
          title: 'Translation Warning', 
          description: 'Episode uploaded but auto-translation failed', 
          variant: 'destructive' 
        });
      } else {
        toast({ title: 'Translated', description: 'Episode auto-translated to English using AI' });
      }
    } catch (error) {
      console.warn('Auto-translation error:', error);
    }
  };

  const validateRow = (row: UploadRow, index: number): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (!row.title?.trim()) {
      errors.push({ row: index + 1, field: 'title', message: 'Title is required' });
    }
    if (!row.series) {
      errors.push({ row: index + 1, field: 'series', message: 'Series is required' });
    }
    if (!row.season || row.season < 1) {
      errors.push({ row: index + 1, field: 'season', message: 'Valid season number is required' });
    }
    if (!row.episode_number || row.episode_number < 1) {
      errors.push({ row: index + 1, field: 'episode_number', message: 'Valid episode number is required' });
    }
    
    // Additional validation for update mode
    if (row.mode === 'update' && !row.id) {
      errors.push({ row: index + 1, field: 'id', message: 'Episode ID is required for updates' });
    }
    
    if (row.mode === 'update' && (!row.fieldsToUpdate || row.fieldsToUpdate.length === 0)) {
      errors.push({ row: index + 1, field: 'fieldsToUpdate', message: 'At least one field must be selected for update' });
    }
    
    return errors;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    
    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
          
          const formattedData: UploadRow[] = jsonData.map(row => ({
            title: row.title || '',
            description: row.description || '',
            content: row.content || '',
            series: row.series || 'wtf',
            season: parseInt(row.season) || 1,
            episode_number: parseInt(row.episode_number) || 1,
            status: row.status || 'draft',
            publish_date: row.publish_date || '',
            duration: row.duration || '',
            image_url: row.image_url || '',
            audio_url: row.audio_url || '',
            spotify: row.spotify || '',
            apple: row.apple || '',
            google: row.google || '',
            youtube: row.youtube || ''
          }));
          
          // Validate data
          const allErrors: ValidationError[] = [];
          formattedData.forEach((row, index) => {
            allErrors.push(...validateRow(row, index));
          });
          
          setValidationErrors(allErrors);
          setRows(formattedData);
        } catch (error) {
          toast({ title: 'Error', description: 'Failed to parse Excel file', variant: 'destructive' });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV parsing
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/).filter(Boolean);
        const data: UploadRow[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const [title = '', description = '', series = 'wtf', season = '1', episode_number = '1', status = 'draft'] = lines[i].split(',');
          if (title.trim()) {
            data.push({
              mode: operationMode,
              title: title.trim(),
              description: description.replace(/^"|"$/g, '').trim(),
              series: (series.replace(/^"|"$/g, '').trim() as any) || 'wtf',
              season: parseInt(season.replace(/^"|"$/g, '').trim()) || 1,
              episode_number: parseInt(episode_number.replace(/^"|"$/g, '').trim()) || 1,
              status: (status.replace(/^"|"$/g, '').trim() as any) || 'draft',
              fieldsToUpdate: ['title', 'description', 'content', 'summary']
            });
          }
        }
        
        const allErrors: ValidationError[] = [];
        data.forEach((row, index) => {
          allErrors.push(...validateRow(row, index));
        });
        
        setValidationErrors(allErrors);
        setRows(data);
      };
      reader.readAsText(file);
    }
  };

  const handleUpload = async () => {
    if (rows.length === 0 || validationErrors.length > 0) return;
    
    setLoading(true);
    try {
      let successCount = 0;
      let errorCount = 0;
      let updateCount = 0;

      for (let i = 0; i < rows.length; i++) {
        try {
          const row = rows[i];
          const slug = slugify(row.title);
          let episode: any;
          let epError: any;

          if (row.mode === 'create' || !row.id) {
            // Create new episode
            const { data, error } = await supabase
              .from('episodes')
              .insert({
                title: row.title,
                slug,
                description: row.description,
                content: row.content,
                summary: row.summary || null,
                series: row.series,
                season: row.season,
                episode_number: row.episode_number,
                status: row.status,
                publish_date: row.publish_date ? new Date(row.publish_date).toISOString() : null,
                duration: row.duration,
                image_url: row.image_url,
                audio_url: row.audio_url
              })
              .select()
              .single();
            episode = data;
            epError = error;
          } else if (row.mode === 'update' && row.id) {
            // Update existing episode
            const updateData: Record<string, any> = {};
            if (row.fieldsToUpdate?.includes('title')) updateData.title = row.title;
            if (row.fieldsToUpdate?.includes('description')) updateData.description = row.description;
            if (row.fieldsToUpdate?.includes('content')) updateData.content = row.content;
            if (row.fieldsToUpdate?.includes('summary')) updateData.summary = row.summary || null;
            if (row.fieldsToUpdate?.includes('series')) updateData.series = row.series;
            if (row.fieldsToUpdate?.includes('season')) updateData.season = row.season;
            if (row.fieldsToUpdate?.includes('episode_number')) updateData.episode_number = row.episode_number;
            if (row.fieldsToUpdate?.includes('status')) updateData.status = row.status;
            if (row.fieldsToUpdate?.includes('publish_date')) updateData.publish_date = row.publish_date ? new Date(row.publish_date).toISOString() : null;
            if (row.fieldsToUpdate?.includes('duration')) updateData.duration = row.duration;
            if (row.fieldsToUpdate?.includes('image_url')) updateData.image_url = row.image_url;
            if (row.fieldsToUpdate?.includes('audio_url')) updateData.audio_url = row.audio_url;
            
            updateData.updated_at = new Date().toISOString();

            const { data, error } = await supabase
              .from('episodes')
              .update(updateData)
              .eq('id', row.id)
              .select()
              .single();
            episode = data;
            epError = error;
            updateCount++;
          } else if (row.mode === 'upsert') {
            // Upsert episode
            const { data, error } = await supabase
              .from('episodes')
              .upsert({
                id: row.id,
                title: row.title,
                slug,
                description: row.description,
                content: row.content,
                summary: row.summary || null,
                series: row.series,
                season: row.season,
                episode_number: row.episode_number,
                status: row.status,
                publish_date: row.publish_date ? new Date(row.publish_date).toISOString() : null,
                duration: row.duration,
                image_url: row.image_url,
                audio_url: row.audio_url,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'id'
              })
              .select()
              .single();
            episode = data;
            epError = error;
          }
            
          if (epError) throw epError;

          // Add platform links
          const platforms = [
            { name: 'Spotify', url: row.spotify },
            { name: 'Apple Podcasts', url: row.apple },
            { name: 'Google Podcasts', url: row.google },
            { name: 'YouTube', url: row.youtube }
          ].filter(p => p.url?.trim());

          if (platforms.length > 0) {
            const { error: linkError } = await supabase
              .from('episode_platforms')
              .insert(platforms.map(p => ({
                episode_id: episode.id,
                platform_name: p.name,
                platform_url: p.url
              })));
            if (linkError) throw linkError;
          }
          
          // Handle auto-translation if enabled
          if (autoTranslate) {
            handleAutoTranslation(episode.id);
          }
          
          successCount++;
        } catch (err) {
          console.error(`Error uploading row ${i + 1}:`, err);
          errorCount++;
        }
      }

      if (successCount > 0 || updateCount > 0) {
        const createMsg = successCount > 0 ? `${successCount} episodes created` : '';
        const updateMsg = updateCount > 0 ? `${updateCount} episodes updated` : '';
        const messages = [createMsg, updateMsg].filter(Boolean).join(', ');
        
        toast({ 
          title: 'Operation Complete', 
          description: `${messages}${errorCount > 0 ? `, ${errorCount} failed` : ''}.` 
        });
      }
      
      if (errorCount === 0) {
        navigate('/admin');
      }
    } catch (err) {
      console.error('Bulk upload error:', err);
      toast({ title: 'Error', description: 'Failed to upload episodes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = (type: 'excel' | 'csv') => {
    const templateData = [
      {
        title: 'Example Episode 1',
        description: 'This is an example episode description',
        content: 'Full episode content here...',
        series: 'finance_transformers',
        season: 1,
        episode_number: 1,
        status: 'draft',
        publish_date: '2024-01-15',
        duration: '45:30',
        image_url: 'https://example.com/image.jpg',
        audio_url: 'https://example.com/audio.mp3',
        spotify: 'https://open.spotify.com/episode/example',
        apple: 'https://podcasts.apple.com/episode/example',
        google: 'https://podcasts.google.com/episode/example',
        youtube: 'https://youtube.com/watch?v=example'
      },
      {
        title: 'Example Episode 2',
        description: 'Another example episode',
        content: 'More episode content...',
        series: 'wtf',
        season: 1,
        episode_number: 2,
        status: 'published',
        publish_date: '2024-01-22',
        duration: '32:15',
        image_url: '',
        audio_url: '',
        spotify: 'https://open.spotify.com/episode/example2',
        apple: '',
        google: '',
        youtube: ''
      }
    ];

    if (type === 'excel') {
      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Episodes');
      XLSX.writeFile(wb, 'episode_upload_template.xlsx');
    } else {
      const headers = Object.keys(templateData[0]).join(',');
      const rows = templateData.map(row => Object.values(row).map(v => `"${v}"`).join(','));
      const csv = [headers, ...rows].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'episode_upload_template.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4 flex justify-between items-center">
          <Link to="/admin" className="text-sm text-[#13B87B] hover:underline">
            &larr; Back to Admin
          </Link>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => downloadTemplate('excel')}
              className="text-sm"
            >
              Download Excel Template
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadTemplate('csv')}
              className="text-sm"
            >
              Download CSV Template
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Enhanced Bulk Upload Episodes</CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload episodes from Excel/CSV files or paste unstructured content (Word docs, transcripts, etc.)
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Operation Mode Selection */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <GitMerge className="w-5 h-5 text-blue-600" />
                  Operation Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="create"
                      name="operationMode"
                      value="create"
                      checked={operationMode === 'create'}
                      onChange={(e) => setOperationMode(e.target.value as any)}
                      className="text-blue-600"
                    />
                    <label htmlFor="create" className="text-sm font-medium">
                      Create New Episodes
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="update"
                      name="operationMode"
                      value="update"
                      checked={operationMode === 'update'}
                      onChange={(e) => setOperationMode(e.target.value as any)}
                      className="text-blue-600"
                    />
                    <label htmlFor="update" className="text-sm font-medium">
                      Update Existing Episodes
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="upsert"
                      name="operationMode"
                      value="upsert"
                      checked={operationMode === 'upsert'}
                      onChange={(e) => setOperationMode(e.target.value as any)}
                      className="text-blue-600"
                    />
                    <label htmlFor="upsert" className="text-sm font-medium">
                      Create or Update (Upsert)
                    </label>
                  </div>
                </div>
                
                {operationMode !== 'create' && (
                  <div className="flex items-center gap-4 p-3 bg-white rounded border">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-gray-500" />
                      <label className="text-sm font-medium">Matching Strategy:</label>
                    </div>
                    <Select value={matchingStrategy} onValueChange={(v) => setMatchingStrategy(v as any)}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slug">By Slug (URL)</SelectItem>
                        <SelectItem value="title">By Title</SelectItem>
                        <SelectItem value="season_episode">By Series/Season/Episode</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={loadExistingEpisodes}
                      disabled={searchingEpisodes}
                      size="sm"
                      variant="outline"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${searchingEpisodes ? 'animate-spin' : ''}`} />
                      {searchingEpisodes ? 'Loading...' : 'Refresh Episodes'}
                    </Button>
                    <Badge variant="outline">
                      {existingEpisodes.length} episodes loaded
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Text Content
                </TabsTrigger>
                <TabsTrigger value="file" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  File Upload
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Paste Episode Content
                    </label>
                    <Textarea
                      placeholder="Paste your Word document text, transcript, or any episode content here...

Examples of supported formats:
- Word document content
- Episode transcripts  
- Markdown formatted text
- Plain text with title and content

The system will automatically extract:
- Episode title
- Description
- Summary
- Full content"
                      value={rawTextContent}
                      onChange={(e) => setRawTextContent(e.target.value)}
                      className="min-h-[200px] font-mono text-sm"
                      disabled={processingText || loading}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-muted-foreground">
                        {rawTextContent.length} characters
                      </span>
                      <Button
                        onClick={handleTextProcessing}
                        disabled={!rawTextContent.trim() || processingText}
                        size="sm"
                        variant="outline"
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        {processingText ? 'Processing...' : 'Parse Content'}
                      </Button>
                    </div>
                  </div>

                  {parsedContent && (
                    <Card className="border-2 border-green-200 bg-green-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Eye className="w-5 h-5 text-green-600" />
                          Parsed Content Preview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Title:</label>
                          <p className="text-sm bg-white p-2 rounded border">{parsedContent.title}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Description:</label>
                          <p className="text-sm bg-white p-2 rounded border">{parsedContent.description}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Summary:</label>
                          <p className="text-sm bg-white p-2 rounded border">{parsedContent.summary}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Content Preview:</label>
                          <p className="text-sm bg-white p-2 rounded border max-h-24 overflow-y-auto">
                            {parsedContent.content?.substring(0, 300)}...
                          </p>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={addParsedToQueue}
                            className="bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            Add to Upload Queue
                          </Button>
                          <Button
                            onClick={() => setParsedContent(null)}
                            variant="outline"
                            size="sm"
                          >
                            Clear
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <input
                      type="checkbox"
                      id="autoTranslate"
                      checked={autoTranslate}
                      onChange={(e) => setAutoTranslate(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="autoTranslate" className="text-sm font-medium flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Auto-translate to English after upload
                    </label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="file" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Select value={fileType} onValueChange={(v) => setFileType(v as any)}>
                      <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                  </SelectContent>
                </Select>
                <Input 
                  type="file" 
                  accept={fileType === 'excel' ? '.xlsx,.xls' : '.csv'} 
                  ref={fileInput} 
                  onChange={handleFileChange} 
                  className="flex-1"
                />
              </div>
              
              {validationErrors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="font-medium text-red-800 mb-2">Validation Errors:</h4>
                  <div className="space-y-1">
                    {validationErrors.slice(0, 10).map((error, idx) => (
                      <div key={idx} className="text-sm text-red-700">
                        Row {error.row}, {error.field}: {error.message}
                      </div>
                    ))}
                    {validationErrors.length > 10 && (
                      <div className="text-sm text-red-700 font-medium">
                        And {validationErrors.length - 10} more errors...
                      </div>
                    )}
                  </div>
                </div>
              )}
                </div>
              </TabsContent>
            </Tabs>

            {rows.length > 0 && (
              <Tabs defaultValue="preview" className="w-full">
                <TabsList>
                  <TabsTrigger value="preview">Preview ({rows.length} episodes)</TabsTrigger>
                  <TabsTrigger value="details">Detailed View</TabsTrigger>
                </TabsList>
                
                <TabsContent value="preview" className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Series</TableHead>
                        <TableHead>Season/Episode</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Platforms</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{r.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {r.series === 'wtf' ? 'WTF?!' : 
                               r.series === 'finance_transformers' ? 'Finance Transformers' : 'CFO Memo'}
                            </Badge>
                          </TableCell>
                          <TableCell>S{r.season}E{r.episode_number}</TableCell>
                          <TableCell>
                            <Badge variant={r.status === 'published' ? 'default' : 'secondary'}>
                              {r.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {r.spotify && <Badge variant="outline" className="text-xs">Spotify</Badge>}
                              {r.apple && <Badge variant="outline" className="text-xs">Apple</Badge>}
                              {r.google && <Badge variant="outline" className="text-xs">Google</Badge>}
                              {r.youtube && <Badge variant="outline" className="text-xs">YouTube</Badge>}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
                
                {operationMode !== 'create' && (
                  <TabsContent value="diff" className="space-y-4">
                    {rows.map((row, idx) => {
                      const hasExisting = row.existing && row.id;
                      if (!hasExisting && operationMode === 'update') return null;
                      
                      return (
                        <Card key={idx} className="border-2 border-orange-200">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center justify-between">
                              <span>{row.title}</span>
                              <Badge variant={row.mode === 'update' ? 'secondary' : 'outline'}>
                                {row.mode?.toUpperCase()}
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {hasExisting ? (
                              <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                  <CheckSquare className="w-4 h-4" />
                                  <span className="font-medium">Select fields to update:</span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  {['title', 'description', 'content', 'summary', 'series', 'season', 'episode_number', 'status'].map(field => {
                                    const isSelected = row.fieldsToUpdate?.includes(field) || false;
                                    const hasChanged = row[field as keyof UploadRow] !== row.existing?.[field as keyof UploadRow];
                                    
                                    return (
                                      <div key={field} className={`p-3 rounded border ${
                                        hasChanged ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                                      }`}>
                                        <div className="flex items-center space-x-2 mb-2">
                                          <input
                                            type="checkbox"
                                            id={`${idx}-${field}`}
                                            checked={isSelected}
                                            onChange={(e) => {
                                              const updatedRows = [...rows];
                                              if (!updatedRows[idx].fieldsToUpdate) {
                                                updatedRows[idx].fieldsToUpdate = [];
                                              }
                                              if (e.target.checked) {
                                                updatedRows[idx].fieldsToUpdate!.push(field);
                                              } else {
                                                updatedRows[idx].fieldsToUpdate = updatedRows[idx].fieldsToUpdate!.filter(f => f !== field);
                                              }
                                              setRows(updatedRows);
                                            }}
                                          />
                                          <label htmlFor={`${idx}-${field}`} className="font-medium capitalize">
                                            {field.replace('_', ' ')}
                                          </label>
                                          {hasChanged && <Badge variant="outline" className="text-orange-600">Changed</Badge>}
                                        </div>
                                        
                                        {hasChanged && (
                                          <div className="space-y-2">
                                            <div className="text-xs">
                                              <span className="font-medium text-red-600">Current:</span>
                                              <p className="text-red-600 bg-red-50 p-1 rounded mt-1 max-h-20 overflow-y-auto">
                                                {String(row.existing?.[field as keyof UploadRow] || '').substring(0, 200)}
                                                {String(row.existing?.[field as keyof UploadRow] || '').length > 200 && '...'}
                                              </p>
                                            </div>
                                            <div className="text-xs">
                                              <span className="font-medium text-green-600">New:</span>
                                              <p className="text-green-600 bg-green-50 p-1 rounded mt-1 max-h-20 overflow-y-auto">
                                                {String(row[field as keyof UploadRow] || '').substring(0, 200)}
                                                {String(row[field as keyof UploadRow] || '').length > 200 && '...'}
                                              </p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                <div className="flex justify-between items-center pt-4 border-t">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const updatedRows = [...rows];
                                      updatedRows[idx].fieldsToUpdate = ['title', 'description', 'content', 'summary'];
                                      setRows(updatedRows);
                                    }}
                                  >
                                    Select Common Fields
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const updatedRows = [...rows];
                                      updatedRows[idx].fieldsToUpdate = [];
                                      setRows(updatedRows);
                                    }}
                                  >
                                    Clear All
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <p>No existing episode found. This will be created as new.</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </TabsContent>
                )}
                
                <TabsContent value="details" className="overflow-auto">
                  <div className="space-y-4">
                    {rows.map((r, idx) => (
                      <Card key={idx} className="p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><strong>Title:</strong> {r.title}</div>
                          <div><strong>Series:</strong> {r.series}</div>
                          <div><strong>Season:</strong> {r.season}</div>
                          <div><strong>Episode:</strong> {r.episode_number}</div>
                          <div><strong>Status:</strong> {r.status}</div>
                          <div><strong>Duration:</strong> {r.duration || 'Not set'}</div>
                          <div className="col-span-2"><strong>Description:</strong> {r.description}</div>
                          {r.content && <div className="col-span-2"><strong>Content:</strong> {r.content}</div>}
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {rows.length > 0 && (
                  <span>
                    {rows.length} episodes ready to upload
                    {validationErrors.length > 0 && (
                      <span className="text-red-600 ml-2">
                        ({validationErrors.length} validation errors)
                      </span>
                    )}
                  </span>
                )}
              </div>
              <Button 
                onClick={handleUpload} 
                disabled={loading || rows.length === 0 || validationErrors.length > 0} 
                className="bg-[#13B87B] hover:bg-[#0F9A6A]"
              >
                {loading ? 'Uploading...' : 'Upload Episodes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BulkUploadEpisodes;
