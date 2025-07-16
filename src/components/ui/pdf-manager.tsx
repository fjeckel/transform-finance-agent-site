import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Download, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PDF {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  image_url?: string | null;
  file_size: number | null;
  download_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface PDFFormData {
  title: string;
  description: string;
  is_public: boolean;
  file: File | null;
  image: File | null;
}

const PDFManager = () => {
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPdf, setEditingPdf] = useState<PDF | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<PDFFormData>({
    title: '',
    description: '',
    is_public: true,
    file: null,
    image: null
  });

  useEffect(() => {
    fetchPDFs();
  }, []);

  const fetchPDFs = async () => {
    try {
      const { data, error } = await supabase
        .from('downloadable_pdfs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPdfs(data || []);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
      toast({
        title: "Error",
        description: "Failed to load PDFs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid File",
          description: "Please select a PDF file",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast({
          title: "File Too Large",
          description: "PDF must be less than 50MB",
          variant: "destructive",
        });
        return;
      }
      setFormData(prev => ({ ...prev, file }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit for images
        toast({
          title: "File Too Large",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setFormData(prev => ({ ...prev, image: file }));
    }
  };

  const uploadFile = async (file: File, isImage = false): Promise<string> => {
    const fileName = `${Date.now()}-${file.name}`;
    const bucket = isImage ? 'pdf-downloads' : 'pdf-downloads';
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || (!formData.file && !editingPdf)) return;

    setUploading(true);
    try {
      let fileUrl = editingPdf?.file_url || '';
      let fileSize = editingPdf?.file_size || null;
      let imageUrl = editingPdf?.image_url || null;

      if (formData.file) {
        fileUrl = await uploadFile(formData.file, false);
        fileSize = formData.file.size;
      }

      if (formData.image) {
        imageUrl = await uploadFile(formData.image, true);
      }

      const pdfData = {
        title: formData.title,
        description: formData.description || null,
        file_url: fileUrl,
        image_url: imageUrl,
        file_size: fileSize,
        is_public: formData.is_public,
        ...(editingPdf ? {} : { created_by: (await supabase.auth.getUser()).data.user?.id })
      };

      let error;
      if (editingPdf) {
        const { error: updateError } = await supabase
          .from('downloadable_pdfs')
          .update(pdfData)
          .eq('id', editingPdf.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('downloadable_pdfs')
          .insert([pdfData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: editingPdf ? "PDF Updated" : "PDF Uploaded",
        description: `${formData.title} has been ${editingPdf ? 'updated' : 'uploaded'} successfully.`,
      });

      setIsDialogOpen(false);
      setEditingPdf(null);
      setFormData({ title: '', description: '', is_public: true, file: null, image: null });
      fetchPDFs();
    } catch (error) {
      console.error('Error saving PDF:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingPdf ? 'update' : 'upload'} PDF`,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (pdf: PDF) => {
    setEditingPdf(pdf);
    setFormData({
      title: pdf.title,
      description: pdf.description || '',
      is_public: pdf.is_public,
      file: null,
      image: null
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (pdf: PDF) => {
    if (window.confirm(`Are you sure you want to delete "${pdf.title}"?`)) {
      try {
        const { error } = await supabase
          .from('downloadable_pdfs')
          .delete()
          .eq('id', pdf.id);

        if (error) throw error;

        toast({
          title: "PDF Deleted",
          description: `"${pdf.title}" has been deleted successfully.`,
        });
        
        fetchPDFs();
      } catch (error) {
        console.error('Error deleting PDF:', error);
        toast({
          title: "Error",
          description: "Failed to delete PDF",
          variant: "destructive",
        });
      }
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  if (loading) {
    return <div className="text-center py-8">Loading PDFs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">PDF Downloads</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#13B87B] hover:bg-[#0F9A6A]">
              <Plus size={16} className="mr-2" />
              Upload PDF
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingPdf ? 'Edit PDF' : 'Upload New PDF'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter PDF title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter PDF description"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
                />
                <Label htmlFor="is_public">Make PDF public</Label>
              </div>

              <div>
                <Label htmlFor="image">Cover Image {editingPdf && '(leave empty to keep current image)'}</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>

              <div>
                <Label htmlFor="file">PDF File {editingPdf && '(leave empty to keep current file)'}</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  required={!editingPdf}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingPdf(null);
                    setFormData({ title: '', description: '', is_public: true, file: null, image: null });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Upload size={16} className="mr-2 animate-spin" />
                      {editingPdf ? 'Updating...' : 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="mr-2" />
                      {editingPdf ? 'Update' : 'Upload'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {pdfs.map((pdf) => (
          <Card key={pdf.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="text-red-600" size={24} />
                  <div>
                    <h3 className="font-semibold">{pdf.title}</h3>
                    {pdf.description && (
                      <p className="text-sm text-gray-600">{pdf.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <span>Size: {formatFileSize(pdf.file_size)}</span>
                      <span>Downloads: {pdf.download_count}</span>
                      <span>{pdf.is_public ? 'Public' : 'Private'}</span>
                      <span>Created: {new Date(pdf.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(pdf.file_url, '_blank')}
                  >
                    <Download size={14} className="mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(pdf)}
                  >
                    <Edit size={14} className="mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(pdf)}
                  >
                    <Trash2 size={14} className="mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {pdfs.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No PDFs uploaded yet.</p>
              <p className="text-sm text-gray-400">Upload your first PDF to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PDFManager;