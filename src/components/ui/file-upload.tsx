import React, { useState, useRef } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  disabled?: boolean;
  maxSize?: number; // in MB
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  accept = "*/*",
  disabled = false,
  maxSize = 10
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: 'Datei zu groß',
        description: `Bitte wählen Sie eine Datei kleiner als ${maxSize}MB`,
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    
    try {
      await onUpload(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload fehlgeschlagen',
        description: 'Datei konnte nicht hochgeladen werden. Bitte versuchen Sie es erneut.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
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

  return (
    <div className="space-y-4">
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
            <p className="text-sm font-medium">
              {uploading ? 'Datei wird hochgeladen...' : 'Datei hier ablegen oder klicken zum Durchsuchen'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Bis zu {maxSize}MB
            </p>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
};