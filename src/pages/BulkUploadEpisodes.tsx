import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface UploadRow {
  title: string;
  description: string;
  content?: string;
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

const BulkUploadEpisodes = () => {
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [fileType, setFileType] = useState<'csv' | 'excel'>('excel');
  const fileInput = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

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
              title: title.trim(),
              description: description.replace(/^"|"$/g, '').trim(),
              series: (series.replace(/^"|"$/g, '').trim() as any) || 'wtf',
              season: parseInt(season.replace(/^"|"$/g, '').trim()) || 1,
              episode_number: parseInt(episode_number.replace(/^"|"$/g, '').trim()) || 1,
              status: (status.replace(/^"|"$/g, '').trim() as any) || 'draft'
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

      for (let i = 0; i < rows.length; i++) {
        try {
          const row = rows[i];
          const slug = slugify(row.title);
          
          const { data: episode, error: epError } = await supabase
            .from('episodes')
            .insert({
              title: row.title,
              slug,
              description: row.description,
              content: row.content,
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
          
          successCount++;
        } catch (err) {
          console.error(`Error uploading row ${i + 1}:`, err);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({ 
          title: 'Upload Complete', 
          description: `${successCount} episodes created successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}.` 
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
          </CardHeader>
          <CardContent className="space-y-6">
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
