import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Globe, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TranslationStatus {
  language: string;
  languageName: string;
  flag: string;
  status: 'none' | 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  completedFields: number;
  totalFields: number;
  quality?: number;
  cost?: number;
  lastUpdated?: string;
}

interface TranslationStatusProps {
  contentId: string;
  contentType: 'episode' | 'insight' | 'category';
  translations: TranslationStatus[];
  showCosts?: boolean;
  compact?: boolean;
}

export const TranslationStatusIndicator: React.FC<TranslationStatusProps> = ({
  contentId,
  contentType,
  translations,
  showCosts = false,
  compact = false
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'completed':
        return 'text-blue-600 bg-blue-50';
      case 'in_progress':
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 0.9) return 'text-green-600';
    if (quality >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const totalCost = translations.reduce((sum, t) => sum + (t.cost || 0), 0);
  const averageQuality = translations.filter(t => t.quality).reduce((sum, t) => sum + (t.quality || 0), 0) / translations.filter(t => t.quality).length || 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {translations.map(trans => (
          <div
            key={trans.language}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
              getStatusColor(trans.status)
            )}
            title={`${trans.languageName}: ${trans.completedFields}/${trans.totalFields} fields`}
          >
            <span>{trans.flag}</span>
            {getStatusIcon(trans.status)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Translation Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pb-4 border-b">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {translations.filter(t => t.status === 'approved' || t.status === 'completed').length}
              </div>
              <div className="text-xs text-muted-foreground">Translated</div>
            </div>
            {showCosts && (
              <div className="text-center">
                <div className="text-2xl font-bold flex items-center justify-center">
                  <DollarSign className="h-4 w-4" />
                  {totalCost.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">Total Cost</div>
              </div>
            )}
            <div className="text-center">
              <div className={cn("text-2xl font-bold", getQualityColor(averageQuality))}>
                {Math.round(averageQuality * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">Avg Quality</div>
            </div>
          </div>

          {/* Language Details */}
          <div className="space-y-3">
            {translations.map(trans => (
              <div key={trans.language} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{trans.flag}</span>
                    <span className="font-medium">{trans.languageName}</span>
                    <Badge className={cn("text-xs", getStatusColor(trans.status))}>
                      {trans.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {trans.quality && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span className={getQualityColor(trans.quality)}>
                          {Math.round(trans.quality * 100)}%
                        </span>
                      </div>
                    )}
                    {showCosts && trans.cost && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>{trans.cost.toFixed(3)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(trans.completedFields / trans.totalFields) * 100} 
                    className="flex-1 h-2"
                  />
                  <span className="text-xs text-muted-foreground">
                    {trans.completedFields}/{trans.totalFields}
                  </span>
                </div>

                {trans.lastUpdated && (
                  <div className="text-xs text-muted-foreground">
                    Last updated: {new Date(trans.lastUpdated).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};