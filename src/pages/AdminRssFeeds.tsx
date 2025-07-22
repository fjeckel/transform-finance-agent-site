import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Rss, Copy, ExternalLink, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FeedInfo {
  series: string;
  title: string;
  description: string;
  episodeCount: number;
  lastUpdated: string | null;
  feedUrl: string;
}

const AdminRssFeeds = () => {
  const [feeds, setFeeds] = useState<FeedInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const baseUrl = window.location.origin;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const rssBaseUrl = `${supabaseUrl}/functions/v1/rss-feed`;

  useEffect(() => {
    fetchFeedInfo();
  }, []);

  const fetchFeedInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('episodes')
        .select('series, status, publish_date')
        .eq('status', 'published');

      if (error) throw error;

      const seriesInfo = {
        all: {
          title: 'All Episodes',
          description: 'Complete feed with all published episodes',
          episodeCount: 0,
          lastUpdated: null as string | null,
        },
        wtf: {
          title: 'WTF?! Finance',
          description: 'Understanding complex financial topics in simple terms',
          episodeCount: 0,
          lastUpdated: null as string | null,
        },
        finance_transformers: {
          title: 'Finance Transformers',
          description: 'Transforming finance through technology and innovation',
          episodeCount: 0,
          lastUpdated: null as string | null,
        },
        cfo_memo: {
          title: 'CFO Memo',
          description: 'Strategic insights for finance leaders',
          episodeCount: 0,
          lastUpdated: null as string | null,
        },
      };

      // Count episodes and find last updated date for each series
      data?.forEach(episode => {
        if (episode.series) {
          seriesInfo[episode.series as keyof typeof seriesInfo].episodeCount++;
          const publishDate = new Date(episode.publish_date);
          const currentLastUpdated = seriesInfo[episode.series as keyof typeof seriesInfo].lastUpdated;
          
          if (!currentLastUpdated || publishDate > new Date(currentLastUpdated)) {
            seriesInfo[episode.series as keyof typeof seriesInfo].lastUpdated = episode.publish_date;
          }
        }
        
        // Update "all" feed stats
        seriesInfo.all.episodeCount++;
        if (!seriesInfo.all.lastUpdated || new Date(episode.publish_date) > new Date(seriesInfo.all.lastUpdated)) {
          seriesInfo.all.lastUpdated = episode.publish_date;
        }
      });

      const feedList: FeedInfo[] = Object.entries(seriesInfo).map(([key, info]) => ({
        series: key,
        title: info.title,
        description: info.description,
        episodeCount: info.episodeCount,
        lastUpdated: info.lastUpdated,
        feedUrl: key === 'all' 
          ? `${rssBaseUrl}?baseUrl=${baseUrl}`
          : `${rssBaseUrl}/${key}?baseUrl=${baseUrl}`,
      }));

      setFeeds(feedList);
    } catch (error) {
      console.error('Error fetching feed info:', error);
      toast({
        title: 'Error',
        description: 'Failed to load RSS feed information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      toast({
        title: 'Copied!',
        description: 'RSS feed URL copied to clipboard',
      });
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy URL',
        variant: 'destructive',
      });
    }
  };

  const getSeriesColor = (series: string) => {
    switch (series) {
      case 'wtf': return 'bg-purple-100 text-purple-800';
      case 'finance_transformers': return 'bg-blue-100 text-blue-800';
      case 'cfo_memo': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link to="/admin" className="text-sm text-[#13B87B] hover:underline mb-4 inline-block">
            <ArrowLeft size={16} className="inline mr-1" />
            Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">RSS Feeds</h1>
          <p className="text-gray-600">
            Manage and distribute your podcast episodes via RSS feeds
          </p>
        </div>

        <div className="grid gap-6">
          {feeds.map((feed) => (
            <Card key={feed.series} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{feed.title}</CardTitle>
                      {feed.series !== 'all' && (
                        <Badge className={getSeriesColor(feed.series)}>
                          {feed.series}
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{feed.description}</CardDescription>
                  </div>
                  <Rss className="text-gray-400" size={24} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Episodes:</span>
                      <span className="ml-2 font-medium">{feed.episodeCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Last Updated:</span>
                      <span className="ml-2 font-medium">
                        {feed.lastUpdated 
                          ? new Date(feed.lastUpdated).toLocaleDateString('de-DE')
                          : 'No episodes yet'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs text-gray-600 flex-1 truncate">
                        {feed.feedUrl}
                      </code>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(feed.feedUrl)}
                        >
                          {copiedUrl === feed.feedUrl ? (
                            <Check size={16} className="text-green-600" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(feed.feedUrl, '_blank')}
                        >
                          <ExternalLink size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-1">Distribution Platforms:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Apple Podcasts</Badge>
                      <Badge variant="outline">Spotify</Badge>
                      <Badge variant="outline">Google Podcasts</Badge>
                      <Badge variant="outline">RSS Readers</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">How to Submit Your Podcast</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>To distribute your podcast on major platforms:</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Copy the RSS feed URL for the series you want to submit</li>
              <li>Visit the podcast submission page for your chosen platform</li>
              <li>Paste the RSS feed URL when prompted</li>
              <li>Follow the platform-specific verification process</li>
            </ol>
            <div className="pt-2">
              <p className="font-medium mb-2">Submission Links:</p>
              <div className="space-y-1">
                <a href="https://podcasters.apple.com/" target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 hover:underline block">
                  → Apple Podcasts Connect
                </a>
                <a href="https://podcasters.spotify.com/" target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 hover:underline block">
                  → Spotify for Podcasters
                </a>
                <a href="https://podcasts.google.com/about" target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 hover:underline block">
                  → Google Podcasts Manager
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminRssFeeds;