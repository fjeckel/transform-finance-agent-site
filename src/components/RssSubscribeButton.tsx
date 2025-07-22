import React, { useState } from 'react';
import { Rss, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface RssSubscribeButtonProps {
  series?: 'wtf' | 'finance_transformers' | 'cfo_memo';
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

const RssSubscribeButton: React.FC<RssSubscribeButtonProps> = ({
  series,
  variant = 'outline',
  size = 'default',
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const baseUrl = window.location.origin;
  const rssBaseUrl = `${supabaseUrl}/functions/v1/rss-feed`;
  
  const feedUrl = series 
    ? `${rssBaseUrl}/${series}?baseUrl=${baseUrl}`
    : `${rssBaseUrl}?baseUrl=${baseUrl}`;

  const handleCopyFeed = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      toast({
        title: 'RSS Feed URL Copied!',
        description: 'Paste this URL into your favorite podcast app',
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy RSS feed URL',
        variant: 'destructive',
      });
    }
  };

  const handleOpenInApp = (appUrl: string) => {
    window.open(appUrl, '_blank');
    setIsOpen(false);
  };

  const podcastApps = [
    {
      name: 'Apple Podcasts',
      url: `podcast://${feedUrl.replace('https://', '')}`,
      webUrl: 'https://podcasts.apple.com/',
    },
    {
      name: 'Overcast',
      url: `overcast://x-callback-url/add?url=${encodeURIComponent(feedUrl)}`,
    },
    {
      name: 'Castro',
      url: `castro://subscribe/${encodeURIComponent(feedUrl)}`,
    },
    {
      name: 'Pocket Casts',
      url: `pktc://subscribe/${encodeURIComponent(feedUrl)}`,
    },
  ];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <Rss className="w-4 h-4 mr-2" />
          Subscribe
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleCopyFeed}>
          Copy RSS Feed URL
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {podcastApps.map((app) => (
          <DropdownMenuItem
            key={app.name}
            onClick={() => handleOpenInApp(app.url)}
          >
            Open in {app.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleOpenInApp(feedUrl)}
          className="text-gray-600"
        >
          View RSS Feed
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RssSubscribeButton;