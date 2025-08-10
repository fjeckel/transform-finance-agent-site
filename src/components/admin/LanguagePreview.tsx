import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Globe, 
  Edit3, 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  BarChart3,
  ArrowRightLeft,
  Copy
} from 'lucide-react';

interface Language {
  code: string;
  name: string;
  native_name: string;
  flag_emoji: string;
}

interface TranslationResult {
  language_code: string;
  translated_fields: Record<string, string>;
  confidence_scores: Record<string, number>;
  translation_status: 'pending' | 'processing' | 'completed' | 'failed' | 'review_needed';
  quality_score: number;
  processing_time_ms: number;
  translation_cost_usd: number;
  validation_errors: string[];
  created_at: string;
}

interface ExtractionResult {
  extraction_id: string;
  extracted_fields: Record<string, any>;
  confidence_scores: Record<string, number>;
  quality_score: number;
}

interface LanguagePreviewProps {
  extractionResult: ExtractionResult;
  translationResults: Record<string, TranslationResult>;
  languages: Language[];
  selectedLanguages: string[];
  sourceLanguage: string;
  isTranslating: boolean;
  onFieldEdit: (languageCode: string, field: string, value: string) => void;
  onTranslationSave: (languageCode: string) => void;
  className?: string;
}

export const LanguagePreview: React.FC<LanguagePreviewProps> = ({
  extractionResult,
  translationResults,
  languages,
  selectedLanguages,
  sourceLanguage,
  isTranslating,
  onFieldEdit,
  onTranslationSave,
  className = ''
}) => {
  const [editingField, setEditingField] = useState<{language: string, field: string} | null>(null);
  const [viewMode, setViewMode] = useState<'tabs' | 'comparison'>('tabs');

  const getLanguageByCode = (code: string) => {
    return languages.find(lang => lang.code === code);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'review_needed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-3 h-3" />;
      case 'processing': return <Clock className="w-3 h-3 animate-spin" />;
      case 'failed': return <AlertCircle className="w-3 h-3" />;
      case 'review_needed': return <Edit3 className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const renderFieldEditor = (
    languageCode: string, 
    fieldName: string, 
    value: string | string[], 
    confidence: number,
    isEditing: boolean
  ) => {
    const isArray = Array.isArray(value);
    const displayValue = isArray ? value.join(', ') : String(value || '');

    if (isEditing) {
      return (
        <div className="space-y-2">
          <Textarea
            value={displayValue}
            onChange={(e) => onFieldEdit(languageCode, fieldName, e.target.value)}
            className="min-h-[100px] resize-none"
            placeholder={`Enter ${fieldName} in ${getLanguageByCode(languageCode)?.native_name}...`}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                onTranslationSave(languageCode);
                setEditingField(null);
              }}
              className="flex items-center gap-1"
            >
              <Save className="w-3 h-3" />
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditingField(null)}
              className="flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="group relative">
        <div className="p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {(confidence * 100).toFixed(0)}% confidence
              </Badge>
              {displayValue && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(displayValue)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditingField({language: languageCode, field: fieldName})}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
          </div>
          
          <div className="text-sm">
            {displayValue ? (
              <>
                {displayValue.length > 200 ? (
                  <div>
                    {displayValue.substring(0, 200)}...
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-xs ml-1"
                      onClick={() => setEditingField({language: languageCode, field: fieldName})}
                    >
                      Read more
                    </Button>
                  </div>
                ) : (
                  displayValue
                )}
              </>
            ) : (
              <span className="text-gray-500 italic">No translation available</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderLanguageTab = (languageCode: string) => {
    const language = getLanguageByCode(languageCode);
    const isSource = languageCode === sourceLanguage;
    const translation = translationResults[languageCode];
    
    if (!language) return null;

    // Use original extraction for source language, translation for others
    const fields = isSource 
      ? extractionResult.extracted_fields 
      : translation?.translated_fields || {};
    
    const confidenceScores = isSource 
      ? extractionResult.confidence_scores 
      : translation?.confidence_scores || {};

    return (
      <div className="space-y-4">
        {/* Language Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{language.flag_emoji}</span>
            <div>
              <h3 className="font-medium">{language.native_name}</h3>
              <p className="text-sm text-gray-600">{language.name}</p>
            </div>
            {isSource && <Badge variant="secondary">Source</Badge>}
          </div>
          
          {translation && !isSource && (
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(translation.translation_status)}>
                {getStatusIcon(translation.translation_status)}
                {translation.translation_status.replace('_', ' ').toUpperCase()}
              </Badge>
              {translation.quality_score && (
                <Badge variant="outline">
                  <BarChart3 className="w-3 h-3 mr-1" />
                  {(translation.quality_score * 100).toFixed(0)}%
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Translation Errors */}
        {translation?.validation_errors && translation.validation_errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {translation.validation_errors.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Fields */}
        <div className="space-y-4">
          {Object.entries(extractionResult.extracted_fields).map(([fieldName, _]) => {
            const value = fields[fieldName];
            const confidence = confidenceScores[fieldName] || 0;
            const isEditing = editingField?.language === languageCode && editingField?.field === fieldName;

            return (
              <div key={fieldName} className="space-y-2">
                <label className="text-sm font-medium capitalize">
                  {fieldName.replace('_', ' ')}
                </label>
                {renderFieldEditor(languageCode, fieldName, value, confidence, isEditing)}
              </div>
            );
          })}
        </div>

        {/* Translation Metrics */}
        {translation && !isSource && (
          <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-xs text-gray-600">Processing Time</div>
              <div className="font-medium">
                {translation.processing_time_ms 
                  ? `${(translation.processing_time_ms / 1000).toFixed(1)}s` 
                  : 'N/A'
                }
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Cost</div>
              <div className="font-medium">
                ${translation.translation_cost_usd?.toFixed(4) || '0.0000'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Created</div>
              <div className="font-medium text-xs">
                {new Date(translation.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!extractionResult) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center text-gray-500">
            <Globe className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>No extraction results available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const availableLanguages = selectedLanguages.filter(code => 
    translationResults[code] || code === sourceLanguage
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Language Preview
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'tabs' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('tabs')}
            >
              Tabs
            </Button>
            <Button
              variant={viewMode === 'comparison' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('comparison')}
              disabled={availableLanguages.length < 2}
            >
              <ArrowRightLeft className="w-4 h-4 mr-1" />
              Compare
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isTranslating && (
          <Alert className="mb-4">
            <Clock className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Translating content to {selectedLanguages.length} languages...
            </AlertDescription>
          </Alert>
        )}

        {viewMode === 'tabs' ? (
          <Tabs defaultValue={availableLanguages[0]} className="w-full">
            <TabsList className="grid w-full grid-cols-auto">
              {availableLanguages.map((code) => {
                const language = getLanguageByCode(code);
                if (!language) return null;

                return (
                  <TabsTrigger key={code} value={code} className="flex items-center gap-2">
                    <span>{language.flag_emoji}</span>
                    <span className="hidden sm:inline">{language.native_name}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            {availableLanguages.map((code) => (
              <TabsContent key={code} value={code}>
                {renderLanguageTab(code)}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {availableLanguages.map((code) => (
              <Card key={code}>
                <CardContent className="p-4">
                  {renderLanguageTab(code)}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LanguagePreview;