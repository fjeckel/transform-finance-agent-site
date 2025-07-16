import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Clock, Users, Mic, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CoverImage } from '@/components/ui/cover-image';
import { ContentItem } from '@/hooks/useContent';

interface ContentCardProps {
  item: ContentItem;
}

export const ContentCard: React.FC<ContentCardProps> = ({ item }) => {
  const getSeriesBadgeColor = (series: string): string => {
    switch (series) {
      case 'wtf': return 'bg-purple-500 text-white';
      case 'cfo_memo': return 'bg-green-500 text-white';
      case 'finance_transformers': return 'bg-[#003FA5] text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSeriesDisplayName = (series: string): string => {
    switch (series) {
      case 'wtf': return 'WTF';
      case 'cfo_memo': return 'CFO Memo';
      case 'finance_transformers': return 'Finance Transformers';
      default: return series;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (item.type === 'episode') {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
        <div className="relative">
          <CoverImage
            src="/img/wtf-cover.png"
            alt={item.title}
            className="h-48 w-full object-cover"
          />
        </div>
        <div className="flex-1 flex flex-col">
          <CardHeader className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              {item.series && (
                <Badge variant="secondary" className={getSeriesBadgeColor(item.series)}>
                  {getSeriesDisplayName(item.series)}
                </Badge>
              )}
              <Badge variant="outline" className="flex items-center gap-1">
                <Mic className="h-3 w-3" />
                <span>Episode</span>
              </Badge>
            </div>
            <CardTitle className="text-lg leading-tight mb-2">
              {item.title}
            </CardTitle>
            {item.description && (
              <CardDescription className="line-clamp-3 text-sm">
                {item.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {item.publish_date && (
                  <span>{formatDate(item.publish_date)}</span>
                )}
              </div>
              <Link to={`/episode/${item.slug}`}>
                <Button variant="outline" size="sm">
                  Ansehen
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  // PDF Card
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      <div className="relative">
        <CoverImage
          src="/img/wtf-cover.png"
          alt={item.title}
          className="h-48 w-full object-cover"
        />
      </div>
      <div className="flex-1 flex flex-col">
        <CardHeader className="flex-1">
          <div className="mb-3">
            <Badge variant="outline" className="flex items-center gap-1 w-fit">
              <FileText className="h-3 w-3" />
              <span>PDF</span>
            </Badge>
          </div>
          <CardTitle className="text-lg leading-tight mb-2">
            {item.title}
          </CardTitle>
          {item.description && (
            <CardDescription className="line-clamp-3 text-sm">
              {item.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              <span>{formatDate(item.created_at)}</span>
              <div className="flex items-center gap-2">
                {item.file_size && (
                  <span>{formatFileSize(item.file_size)}</span>
                )}
                {item.download_count !== undefined && (
                  <span>• {item.download_count} Downloads</span>
                )}
              </div>
            </div>
            {item.file_url && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(item.file_url, '_blank')}
              >
                Download
                <Download className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
};