import React, { useState } from 'react';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

interface PlatformLink {
  id: string;
  platform_name: string;
  platform_url: string;
}

interface PlatformLinksManagerProps {
  value: PlatformLink[];
  onChange: (links: PlatformLink[]) => void;
  disabled?: boolean;
}

const COMMON_PLATFORMS = [
  { name: 'Spotify', placeholder: 'https://open.spotify.com/episode/...' },
  { name: 'Apple Podcasts', placeholder: 'https://podcasts.apple.com/podcast/...' },
  { name: 'Google Podcasts', placeholder: 'https://podcasts.google.com/feed/...' },
  { name: 'YouTube', placeholder: 'https://youtube.com/watch?v=...' },
  { name: 'Overcast', placeholder: 'https://overcast.fm/+...' },
  { name: 'Pocket Casts', placeholder: 'https://pca.st/...' },
  { name: 'Stitcher', placeholder: 'https://www.stitcher.com/podcast/...' },
  { name: 'TuneIn', placeholder: 'https://tunein.com/podcasts/...' },
  { name: 'iHeartRadio', placeholder: 'https://www.iheart.com/podcast/...' },
  { name: 'Castbox', placeholder: 'https://castbox.fm/episode/...' },
  { name: 'Custom', placeholder: 'Enter custom platform URL...' },
];

export const PlatformLinksManager: React.FC<PlatformLinksManagerProps> = ({
  value = [],
  onChange,
  disabled = false,
}) => {
  const [newLink, setNewLink] = useState({
    platform_name: '',
    platform_url: '',
  });

  const addLink = () => {
    if (!newLink.platform_name || !newLink.platform_url) return;

    // Check if platform already exists
    if (value.some(link => link.platform_name === newLink.platform_name)) {
      return; // Don't add duplicate platforms
    }

    const link: PlatformLink = {
      id: `temp-${Date.now()}`,
      platform_name: newLink.platform_name,
      platform_url: newLink.platform_url,
    };

    onChange([...value, link]);
    setNewLink({ platform_name: '', platform_url: '' });
  };

  const removeLink = (id: string) => {
    onChange(value.filter(link => link.id !== id));
  };

  const updateLink = (id: string, field: keyof PlatformLink, newValue: string) => {
    onChange(
      value.map(link =>
        link.id === id ? { ...link, [field]: newValue } : link
      )
    );
  };

  const getPlaceholder = (platformName: string) => {
    const platform = COMMON_PLATFORMS.find(p => p.name === platformName);
    return platform?.placeholder || 'Enter platform URL...';
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Platform Links
          <span className="text-sm font-normal text-muted-foreground">
            ({value.length} platforms)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new link form */}
        <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              value={newLink.platform_name}
              onValueChange={(value) => setNewLink({ ...newLink, platform_name: value })}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_PLATFORMS.map((platform) => (
                  <SelectItem key={platform.name} value={platform.name}>
                    {platform.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              placeholder={getPlaceholder(newLink.platform_name)}
              value={newLink.platform_url}
              onChange={(e) => setNewLink({ ...newLink, platform_url: e.target.value })}
              disabled={disabled}
            />
          </div>
          
          {newLink.platform_name === 'Custom' && (
            <Input
              placeholder="Custom platform name"
              value={newLink.platform_name === 'Custom' ? '' : newLink.platform_name}
              onChange={(e) => setNewLink({ ...newLink, platform_name: e.target.value })}
              disabled={disabled}
            />
          )}
          
          <Button
            type="button"
            onClick={addLink}
            disabled={
              !newLink.platform_name || 
              !newLink.platform_url || 
              !isValidUrl(newLink.platform_url) ||
              disabled
            }
            size="sm"
          >
            <Plus size={16} className="mr-1" />
            Add Platform
          </Button>
        </div>

        {/* Existing links */}
        <div className="space-y-2">
          {value.map((link) => (
            <div key={link.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    value={link.platform_name}
                    onChange={(e) => updateLink(link.id, 'platform_name', e.target.value)}
                    placeholder="Platform name"
                    disabled={disabled}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={link.platform_url}
                      onChange={(e) => updateLink(link.id, 'platform_url', e.target.value)}
                      placeholder="Platform URL"
                      disabled={disabled}
                      className="text-sm flex-1"
                    />
                    {isValidUrl(link.platform_url) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(link.platform_url, '_blank')}
                        disabled={disabled}
                      >
                        <ExternalLink size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeLink(link.id)}
                disabled={disabled}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}

          {value.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              No platform links yet. Add links to help listeners find your episode on their preferred platform.
            </div>
          )}
        </div>

        {/* Platform suggestions */}
        {value.length > 0 && value.length < COMMON_PLATFORMS.length - 1 && (
          <div className="text-xs text-muted-foreground">
            💡 Consider adding your episode to more platforms to reach a wider audience
          </div>
        )}
      </CardContent>
    </Card>
  );
};
