import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Globe, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  DollarSign,
  TrendingUp,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { toast } from '@/hooks/use-toast';

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
  const { t } = useTranslation(['translation', 'common']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulate translation retry
  const handleRetryTranslation = async (language: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      toast({
        title: t('translation:messages.retryingTranslation'),
        description: `${t('translation:translate')} ${language}...`,
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate random success/failure
      const success = Math.random() > 0.3;
      
      if (success) {
        toast({
          title: t('translation:messages.translationComplete'),
          description: `${language} ${t('translation:messages.translatedContent')}`,
        });
      } else {
        throw new Error('Translation failed');
      }
      
    } catch (error) {
      setError(t('translation:errors.translationFailed'));
      toast({
        title: t('translation:errors.translationFailed'),
        description: t('translation:errors.tryAgain'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle error clearing
  const clearError = () => setError(null);
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
      <div className="space-y-2">
        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-md text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearError}
              className="ml-auto h-6 w-6 p-0 text-red-700 hover:text-red-900"
            >
              ×
            </Button>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('translation:availableIn')}:</span>
          {translations.map(trans => (
            <div
              key={trans.language}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                getStatusColor(trans.status)
              )}
              title={`${trans.languageName}: ${trans.completedFields}/${trans.totalFields} ${t('translation:fields')}`}
            >
              <span>{trans.flag}</span>
              {getStatusIcon(trans.status)}
              <span className="ml-1">{t(`translation:status.${trans.status}`)}</span>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-600">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>{t('translation:messages.translationInProgress')}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {t('translation:translationStatus')}
        </CardTitle>
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-md text-sm mt-2">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearError}
              className="ml-auto h-6 w-6 p-0 text-red-700 hover:text-red-900"
            >
              ×
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pb-4 border-b">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {translations.filter(t => t.status === 'approved' || t.status === 'completed').length}
              </div>
              <div className="text-xs text-muted-foreground">{t('translation:translated')}</div>
            </div>
            {showCosts && (
              <div className="text-center">
                <div className="text-2xl font-bold flex items-center justify-center">
                  <DollarSign className="h-4 w-4" />
                  {totalCost.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">{t('translation:totalCost')}</div>
              </div>
            )}
            <div className="text-center">
              <div className={cn("text-2xl font-bold", getQualityColor(averageQuality))}>
                {Math.round(averageQuality * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">{t('translation:averageQuality')}</div>
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
                      {t(`translation:status.${trans.status}`)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {trans.quality !== undefined && (
                      <div className="flex items-center gap-1" title={t('translation:quality')}>
                        <TrendingUp className="h-3 w-3" />
                        <span className={getQualityColor(trans.quality)}>
                          {Math.round(trans.quality * 100)}%
                        </span>
                      </div>
                    )}
                    {showCosts && trans.cost !== undefined && (
                      <div className="flex items-center gap-1" title={t('translation:cost')}>
                        <DollarSign className="h-3 w-3" />
                        <span>${trans.cost.toFixed(3)}</span>
                      </div>
                    )}
                    {(trans.status === 'error' || trans.status === 'rejected') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRetryTranslation(trans.languageName)}
                        disabled={isLoading}
                        className="h-6 px-2 py-0 text-xs"
                      >
                        <RefreshCw className={cn("h-3 w-3 mr-1", isLoading && "animate-spin")} />
                        {t('translation:retry')}
                      </Button>
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
                    {t('translation:lastUpdated')}: {new Date(trans.lastUpdated).toLocaleDateString()}
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