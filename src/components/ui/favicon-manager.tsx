import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, Check } from 'lucide-react';

export const FaviconManager: React.FC = () => {
  const [currentFavicon, setCurrentFavicon] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch current favicon setting
  useEffect(() => {
    fetchCurrentFavicon();
  }, []);

  const fetchCurrentFavicon = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_name', 'favicon_url')
        .single();

      if (error) throw error;
      setCurrentFavicon(data?.setting_value || '/img/wtf-cover.png');
    } catch (error) {
      console.error('Error fetching favicon:', error);
      setCurrentFavicon('/img/wtf-cover.png');
    } finally {
      setLoading(false);
    }
  };

  const handleFaviconUpload = async (file: File) => {
    if (!file.type.includes('image/')) {
      toast({
        title: "Fehler",
        description: "Bitte nur Bilddateien (PNG, JPG) hochladen.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    
    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `favicon-${Date.now()}.${fileExt}`;
      const filePath = `favicons/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('episode-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('episode-media')
        .getPublicUrl(filePath);

      const newFaviconUrl = urlData.publicUrl;

      // Update site settings
      const { error: updateError } = await supabase
        .from('site_settings')
        .upsert({
          setting_name: 'favicon_url',
          setting_value: newFaviconUrl
        });

      if (updateError) throw updateError;

      // Update favicon in document head
      updateDocumentFavicon(newFaviconUrl);
      setCurrentFavicon(newFaviconUrl);

      toast({
        title: "Erfolg",
        description: "Favicon wurde erfolgreich aktualisiert.",
      });
    } catch (error) {
      console.error('Error uploading favicon:', error);
      toast({
        title: "Fehler",
        description: "Favicon konnte nicht hochgeladen werden.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const updateDocumentFavicon = (faviconUrl: string) => {
    // Update the favicon in the document head
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = faviconUrl;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Favicon Verwaltung</CardTitle>
          <CardDescription>
            Lade aktuelle Einstellungen...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Favicon Verwaltung</CardTitle>
        <CardDescription>
          Lade ein neues Favicon für deine Website hoch. Empfohlene Größe: 32x32 oder 16x16 Pixel.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Favicon Preview */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Aktuelles Favicon</label>
          <div className="flex items-center space-x-4 p-4 border rounded-lg bg-muted/20">
            <img 
              src={currentFavicon} 
              alt="Current favicon" 
              className="w-8 h-8 object-cover rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/img/wtf-cover.png';
              }}
            />
            <div className="flex-1">
              <p className="text-sm font-medium">Aktives Favicon</p>
              <p className="text-xs text-muted-foreground truncate">{currentFavicon}</p>
            </div>
            <Check className="h-4 w-4 text-green-600" />
          </div>
        </div>

        {/* Upload New Favicon */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Neues Favicon hochladen</label>
          <FileUpload
            onUpload={handleFaviconUpload}
            accept="image/png,image/jpg,image/jpeg"
            disabled={uploading}
            maxSize={2}
          />
        </div>

        {uploading && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Favicon wird hochgeladen...</span>
          </div>
        )}

        <div className="text-xs text-muted-foreground p-3 bg-muted/20 rounded">
          <strong>Hinweis:</strong> Das Favicon wird automatisch in allen Browser-Tabs und Lesezeichen angezeigt. 
          PNG und JPG Formate werden unterstützt. Die optimale Größe ist 32x32 oder 16x16 Pixel.
        </div>
      </CardContent>
    </Card>
  );
};