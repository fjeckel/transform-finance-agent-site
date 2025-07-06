import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UploadRow {
  title: string;
  description: string;
  spotify: string;
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
  const fileInput = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split(/\r?\n/).filter(Boolean);
      const data: UploadRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const [title = '', description = '', spotify = ''] = lines[i].split(',');
        if (title.trim()) {
          data.push({
            title: title.trim(),
            description: description.replace(/^"|"$/g, '').trim(),
            spotify: spotify.replace(/^"|"$/g, '').trim(),
          });
        }
      }
      setRows(data);
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (rows.length === 0) return;
    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from('episodes')
        .select('episode_number')
        .order('episode_number', { ascending: false })
        .limit(1);
      const start = existing && existing.length > 0 ? existing[0].episode_number : 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const slug = slugify(row.title);
        const episodeNumber = start + i + 1;
        const { data: episode, error: epError } = await supabase
          .from('episodes')
          .insert({
            title: row.title,
            slug,
            description: row.description,
            season: 1,
            episode_number: episodeNumber,
            status: 'draft',
          })
          .select()
          .single();
        if (epError) throw epError;

        if (row.spotify) {
          const { error: linkError } = await supabase.from('episode_platforms').insert({
            episode_id: episode.id,
            platform_name: 'Spotify',
            platform_url: row.spotify,
          });
          if (linkError) throw linkError;
        }
      }

      toast({ title: 'Upload Complete', description: `${rows.length} episodes created.` });
      navigate('/admin');
    } catch (err) {
      console.error('Bulk upload error:', err);
      toast({ title: 'Error', description: 'Failed to upload episodes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4 flex justify-between items-center">
          <Link to="/admin" className="text-sm text-[#13B87B] hover:underline">
            &larr; Back to Admin
          </Link>
          <a
            href="/templates/episode_upload_template.csv"
            download
            className="text-sm text-[#13B87B] hover:underline"
          >
            Download Template
          </a>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Bulk Upload Episodes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input type="file" accept=".csv" ref={fileInput} onChange={handleFileChange} />

            {rows.length > 0 && (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Spotify Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{r.title}</TableCell>
                        <TableCell>{r.description}</TableCell>
                        <TableCell>{r.spotify}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <Button onClick={handleUpload} disabled={loading || rows.length === 0} className="bg-[#13B87B] hover:bg-[#0F9A6A]">
              {loading ? 'Uploading...' : 'Upload Episodes'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BulkUploadEpisodes;
