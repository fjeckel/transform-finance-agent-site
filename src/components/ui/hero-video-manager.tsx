import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Label } from './label';
import { VideoUpload } from './video-upload';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Youtube, Upload, Eye, Trash2 } from 'lucide-react';

interface HeroVideoManagerProps {
  onUpdate?: () => void;
}

export const HeroVideoManager: React.FC<HeroVideoManagerProps> = ({ onUpdate }) => {
  const [videoType, setVideoType] = useState<'youtube' | 'uploaded'>('youtube');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_name, setting_value')
        .in('setting_name', ['hero_video_type', 'hero_video_url', 'hero_youtube_url']);

      if (error) throw error;

      const settings = data.reduce((acc, setting) => {
        acc[setting.setting_name] = setting.setting_value;
        return acc;
      }, {} as Record<string, string>);

      setVideoType(settings.hero_video_type as 'youtube' | 'uploaded' || 'youtube');
      setVideoUrl(settings.hero_video_url || '');
      setYoutubeUrl(settings.hero_youtube_url || '');
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error loading settings",
        description: "Could not load video settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      const updates = [
        { setting_name: 'hero_video_type', setting_value: videoType },
        { setting_name: 'hero_video_url', setting_value: videoUrl },
        { setting_name: 'hero_youtube_url', setting_value: youtubeUrl }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('site_settings')
          .upsert(update, { onConflict: 'setting_name' });

        if (error) throw error;
      }

      toast({
        title: "Settings saved",
        description: "Video settings have been updated successfully",
      });

      onUpdate?.();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error saving settings",
        description: "Could not save video settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleVideoUpload = (url: string | null, duration?: string) => {
    setVideoUrl(url || '');
    if (url) {
      setVideoType('uploaded');
    }
  };

  const deleteUploadedVideo = async () => {
    if (!videoUrl) return;

    try {
      // Extract file path from URL
      const urlParts = videoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      const { error } = await supabase.storage
        .from('main-page-videos')
        .remove([fileName]);

      if (error) throw error;

      setVideoUrl('');
      setVideoType('youtube');

      toast({
        title: "Video deleted",
        description: "Uploaded video has been deleted",
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error deleting video",
        description: "Could not delete the uploaded video",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hero Video Settings</CardTitle>
          <CardDescription>Loading video settings...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="h-5 w-5" />
          Hero Video Settings
        </CardTitle>
        <CardDescription>
          Choose between YouTube video or upload your own video for the main page hero section
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={videoType} onValueChange={(value) => setVideoType(value as 'youtube' | 'uploaded')}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="youtube" id="youtube" />
            <Label htmlFor="youtube" className="flex items-center gap-2">
              <Youtube className="h-4 w-4" />
              Use YouTube Video
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="uploaded" id="uploaded" />
            <Label htmlFor="uploaded" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Use Uploaded Video
            </Label>
          </div>
        </RadioGroup>

        {videoType === 'youtube' && (
          <div className="space-y-2">
            <Label>Current YouTube Video</Label>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Using embedded YouTube video (current default)
              </p>
              {youtubeUrl && (
                <div className="mt-2">
                  <iframe
                    src={youtubeUrl.replace('autoplay=1', 'autoplay=0')}
                    className="w-full h-32 rounded"
                    frameBorder="0"
                    title="YouTube Preview"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {videoType === 'uploaded' && (
          <div className="space-y-4">
            <Label>Upload Hero Video</Label>
            <VideoUpload
              value={videoUrl}
              onChange={handleVideoUpload}
            />
            {videoUrl && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(videoUrl, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={deleteUploadedVideo}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={saveSettings}
            disabled={saving || (videoType === 'uploaded' && !videoUrl)}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
          <Button
            variant="outline"
            onClick={loadSettings}
            disabled={saving}
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};