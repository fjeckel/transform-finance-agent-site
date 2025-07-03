import { supabase } from '@/integrations/supabase/client';

export const uploadFile = async (
  file: File,
  path: string,
  bucket: string = 'episode-media'
): Promise<{ url: string; error?: string }> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
        cacheControl: '3600',
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return { url: publicUrl };
  } catch (error) {
    console.error('Upload error:', error);
    return { url: '', error: error instanceof Error ? error.message : 'Upload failed' };
  }
};

export const deleteFile = async (
  path: string,
  bucket: string = 'episode-media'
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
  }
};

export const getFileUrl = (
  path: string,
  bucket: string = 'episode-media'
): string => {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return publicUrl;
};

export const validateFile = (
  file: File,
  allowedTypes: string[],
  maxSize: number
): { valid: boolean; error?: string } => {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
};

export const extractAudioMetadata = (file: File): Promise<{
  duration: string;
  title?: string;
}> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    
    audio.onloadedmetadata = () => {
      const duration = Math.floor(audio.duration);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      URL.revokeObjectURL(url);
      resolve({
        duration: formattedDuration,
        title: file.name.replace(/\.[^/.]+$/, ''),
      });
    };
    
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load audio metadata'));
    };
    
    audio.src = url;
  });
};