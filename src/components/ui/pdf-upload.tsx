import React, { useState, useRef } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PDFUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export const PDFUpload: React.FC<PDFUploadProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please select a PDF file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select a PDF smaller than 25MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileId = crypto.randomUUID();
      const fileName = `${fileId}/${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('pdf-downloads')
        .upload(fileName, file, {
          upsert: true,
          cacheControl: '3600',
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('pdf-downloads')
        .getPublicUrl(fileName);

      onChange(publicUrl);
      setUploadProgress(100);
      toast({
        title: 'PDF uploaded',
        description: 'PDF file uploaded successfully',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const removeFile = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {value ? (
        <div className="relative group">
          <div className="flex items-center space-x-3 p-4 border rounded-lg bg-muted/50">
            <FileText className="w-8 h-8 text-red-600" />
            <div className="flex-1">
              <p className="font-medium">PDF uploaded</p>
              <p className="text-sm text-muted-foreground">
                {value.split('/').pop()?.split('?')[0]}
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={removeFile}
              disabled={disabled}
            >
              <X size={16} />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-muted rounded-full">
              {uploading ? (
                <Upload className="w-8 h-8 text-muted-foreground animate-pulse" />
              ) : (
                <FileText className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">Drop PDF here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF files up to 25MB
              </p>
            </div>
          </div>
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-xs text-muted-foreground text-center">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
};