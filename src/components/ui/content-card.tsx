import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Clock, Users, Mic, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import OptimizedImage from '@/components/ui/optimized-image';
import { ContentItem } from '@/hooks/useContent';

interface ContentCardProps {
  item: ContentItem;
}

export const ContentCard: React.FC<ContentCardProps> = ({ item }) => {
  const getSeriesBadgeColor = (series: string): string => {
    switch (series) {
      case 'wtf': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'cfo-memo': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'finance-transformers': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getSeriesDisplayName = (series: string): string => {
    switch (series) {
      case 'wtf': return 'WTF';
      case 'cfo-memo': return 'CFO Memo';
      case 'finance-transformers': return 'Finance Transformers';
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
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="md:flex">
          {item.image_url && (
            <div className="md:w-48 md:flex-shrink-0">
              <OptimizedImage
                src={item.image_url}
                alt={item.title}
                className="h-48 w-full object-cover md:h-full"
                sizes="(max-width: 768px) 100vw, 192px"
              />
            </div>
          )}
          <div className="flex-1">
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {item.series && (
                    <Badge variant="secondary" className={getSeriesBadgeColor(item.series)}>
                      {getSeriesDisplayName(item.series)}
                    </Badge>
                  )}
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Mic className="h-3 w-3" />
                    <span>Episode</span>
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-xl leading-tight">
                {item.title}
              </CardTitle>
              {item.description && (
                <CardDescription className="line-clamp-2">
                  {item.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  {item.publish_date && (
                    <span>{formatDate(item.publish_date)}</span>
                  )}
                </div>
                <Link to={`/episode/${item.slug}`}>
                  <Button variant="outline" size="sm">
                    Episode ansehen
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    );
  }

  // PDF Card
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="md:flex">
        {item.image_url && (
          <div className="md:w-48 md:flex-shrink-0">
            <OptimizedImage
              src={item.image_url}
              alt={item.title}
              className="h-48 w-full object-cover md:h-full"
              sizes="(max-width: 768px) 100vw, 192px"
            />
          </div>
        )}
        <div className="flex-1">
          <CardHeader>
            <div className="flex items-start justify-between mb-2">
              <Badge variant="outline" className="flex items-center space-x-1">
                <FileText className="h-3 w-3" />
                <span>PDF</span>
              </Badge>
            </div>
            <CardTitle className="text-xl leading-tight">
              {item.title}
            </CardTitle>
            {item.description && (
              <CardDescription className="line-clamp-2">
                {item.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>{formatDate(item.created_at)}</span>
                {item.file_size && (
                  <span>{formatFileSize(item.file_size)}</span>
                )}
                {item.download_count !== undefined && (
                  <span>{item.download_count} Downloads</span>
                )}
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
      </div>
    </Card>
  );
};