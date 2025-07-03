import React, { useState, useRef } from 'react';
import { Upload, X, Music, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AudioUploadProps {
  value?: string;
  onChange: (url: string | null, duration?: string) => void;
  episodeId?: string;
  disabled?: boolean;
}

export const AudioUpload: React.FC<AudioUploadProps> = ({
  value,
  onChange,
  episodeId,
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleFile = async (file: File) => {
    const allowedTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an audio file (MP3, WAV, M4A)',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an audio file smaller than 100MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Extract duration from audio file
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      audio.src = url;
      
      await new Promise((resolve) => {
        audio.addEventListener('loadedmetadata', () => {
          const duration = formatDuration(audio.duration);
          setAudioDuration(duration);
          URL.revokeObjectURL(url);
          resolve(duration);
        });
      });

      const fileName = `episodes/${episodeId || 'temp'}/audio-${Date.now()}.${file.name.split('.').pop()}`;
      
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

      onChange(publicUrl, audioDuration);
      setUploadProgress(100);
      toast({
        title: 'Audio uploaded',
        description: 'Episode audio uploaded successfully',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload audio. Please try again.',
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

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const removeAudio = () => {
    onChange(null);
    setAudioDuration('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {value ? (
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Music className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Audio file uploaded</p>
                {audioDuration && (
                  <p className="text-xs text-muted-foreground">Duration: {audioDuration}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={togglePlayback}
                disabled={disabled}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={removeAudio}
                disabled={disabled}
              >
                <X size={16} />
              </Button>
            </div>
          </div>
          <audio
            ref={audioRef}
            src={value}
            onEnded={() => setIsPlaying(false)}
            controls
            className="w-full"
          />
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
                <Music className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">Drop audio file here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">
                MP3, WAV, M4A up to 100MB
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
        accept="audio/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
};