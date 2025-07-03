import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  episodeId?: string;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  episodeId,
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileName = `episodes/${episodeId || 'temp'}/cover-${Date.now()}.${file.name.split('.').pop()}`;
      
      const { data, error } = await supabase.storage
        .from('episode-media')
        .upload(fileName, file, {
          upsert: true,
          cacheControl: '3600',
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('episode-media')
        .getPublicUrl(fileName);

      onChange(publicUrl);
      setUploadProgress(100);
      toast({
        title: 'Image uploaded',
        description: 'Cover image uploaded successfully',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
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

  const removeImage = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt="Episode cover"
            className="w-full max-w-xs h-48 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={removeImage}
            disabled={disabled}
          >
            <X size={16} />
          </Button>
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
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">Drop image here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, JPEG up to 5MB
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
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
};