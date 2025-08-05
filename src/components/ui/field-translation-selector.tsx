import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Globe,
  Languages,
  Save,
  RotateCcw,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

interface FieldTranslation {
  [fieldName: string]: {
    [languageCode: string]: string;
  };
}

interface FieldTranslationSelectorProps {
  contentId: string;
  contentType: 'episode' | 'insight' | 'category';
  fields: Array<{
    name: string;
    label: string;
    type: 'input' | 'textarea';
    originalValue: string;
    currentValue: string;
    onChange: (value: string) => void;
  }>;
  defaultLanguage?: string;
}

const languages: Language[] = [
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
];

export const FieldTranslationSelector: React.FC<FieldTranslationSelectorProps> = ({
  contentId,
  contentType,
  fields,
  defaultLanguage = 'de'
}) => {
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<string>(defaultLanguage);
  const [translations, setTranslations] = useState<FieldTranslation>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<Record<string, boolean>>({});

  // Load existing translations
  useEffect(() => {
    loadTranslations();
  }, [contentId, selectedLanguage]);

  const loadTranslations = async () => {
    if (!contentId || selectedLanguage === defaultLanguage) return;

    try {
      const tableName = `${contentType}s_translations`;
      const idField = `${contentType}_id`;

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(idField, contentId)
        .eq('language_code', selectedLanguage)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error loading translations:', error);
        return;
      }

      if (data) {
        const fieldTranslations: FieldTranslation = {};
        fields.forEach(field => {
          if (!fieldTranslations[field.name]) {
            fieldTranslations[field.name] = {};
          }
          fieldTranslations[field.name][selectedLanguage] = data[field.name] || '';
        });
        setTranslations(prev => ({
          ...prev,
          ...fieldTranslations
        }));
      }
    } catch (error) {
      console.error('Error loading translations:', error);
    }
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    if (selectedLanguage === defaultLanguage) {
      // Update original content through parent component
      const field = fields.find(f => f.name === fieldName);
      if (field) {
        field.onChange(value);
      }
    } else {
      // Update translation
      setTranslations(prev => ({
        ...prev,
        [fieldName]: {
          ...(prev[fieldName] || {}),
          [selectedLanguage]: value
        }
      }));
      setHasUnsavedChanges(prev => ({
        ...prev,
        [fieldName]: true
      }));
    }
  };

  const getFieldValue = (fieldName: string): string => {
    if (selectedLanguage === defaultLanguage) {
      const field = fields.find(f => f.name === fieldName);
      return field?.currentValue || field?.originalValue || '';
    }
    return translations[fieldName]?.[selectedLanguage] || '';
  };

  const saveFieldTranslation = async (fieldName: string) => {
    if (selectedLanguage === defaultLanguage) return;

    setLoading(prev => ({ ...prev, [fieldName]: true }));

    try {
      const tableName = `${contentType}s_translations`;
      const idField = `${contentType}_id`;
      const value = translations[fieldName]?.[selectedLanguage] || '';

      // Check if translation record exists
      const { data: existing } = await supabase
        .from(tableName)
        .select('id')
        .eq(idField, contentId)
        .eq('language_code', selectedLanguage)
        .single();

      const updateData = {
        [fieldName]: value,
        translation_status: 'completed',
        translation_method: 'manual',
        translated_at: new Date().toISOString()
      };

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from(tableName)
          .update(updateData)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from(tableName)
          .insert({
            [idField]: contentId,
            language_code: selectedLanguage,
            ...updateData
          });

        if (error) throw error;
      }

      setHasUnsavedChanges(prev => ({
        ...prev,
        [fieldName]: false
      }));

      toast({
        title: "Translation Saved",
        description: `${fieldName} has been saved for ${languages.find(l => l.code === selectedLanguage)?.nativeName}`,
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save translation",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const resetField = (fieldName: string) => {
    if (selectedLanguage === defaultLanguage) {
      const field = fields.find(f => f.name === fieldName);
      if (field) {
        field.onChange(field.originalValue);
      }
    } else {
      setTranslations(prev => ({
        ...prev,
        [fieldName]: {
          ...(prev[fieldName] || {}),
          [selectedLanguage]: ''
        }
      }));
      setHasUnsavedChanges(prev => ({
        ...prev,
        [fieldName]: true
      }));
    }
  };

  const toggleShowOriginal = (fieldName: string) => {
    setShowOriginal(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const getCurrentLanguage = () => {
    return languages.find(lang => lang.code === selectedLanguage);
  };

  const isTranslationMode = selectedLanguage !== defaultLanguage;

  return (
    <div className="space-y-6">
      {/* Language Selector */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Languages className="h-5 w-5" />
            Content Language
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-[250px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{lang.flag}</span>
                      <span>{lang.nativeName}</span>
                      {lang.code === defaultLanguage && (
                        <Badge variant="secondary" className="ml-2">Original</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {isTranslationMode && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Translation Mode
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Editing {getCurrentLanguage()?.nativeName} version
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Fields */}
      <div className="space-y-6">
        {fields.map(field => {
          const fieldValue = getFieldValue(field.name);
          const hasUnsaved = hasUnsavedChanges[field.name];
          const isLoading = loading[field.name];
          const showOriginalForField = showOriginal[field.name];

          return (
            <Card key={field.name}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Label className="text-base font-medium">{field.label}</Label>
                    {isTranslationMode && (
                      <div className="flex items-center gap-2">
                        {hasUnsaved && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            Unsaved
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleShowOriginal(field.name)}
                          className="h-7 px-2"
                        >
                          {showOriginalForField ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {showOriginalForField ? 'Hide' : 'Show'} Original
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {isTranslationMode && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetField(field.name)}
                        disabled={isLoading}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Reset
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => saveFieldTranslation(field.name)}
                        disabled={isLoading || !hasUnsaved}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Save className="h-4 w-4 mr-1" />
                        )}
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Show original content when in translation mode */}
                {isTranslationMode && showOriginalForField && (
                  <div className="bg-muted/50 p-3 rounded-md border-l-4 border-muted-foreground/20">
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Original ({languages.find(l => l.code === defaultLanguage)?.nativeName})
                    </Label>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {field.originalValue || 'No original content'}
                    </div>
                  </div>
                )}

                {/* Field Input */}
                {field.type === 'textarea' ? (
                  <Textarea
                    value={fieldValue}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={isTranslationMode ? `Enter ${field.label.toLowerCase()} in ${getCurrentLanguage()?.nativeName}...` : `Enter ${field.label.toLowerCase()}...`}
                    className="min-h-[120px]"
                    disabled={isLoading}
                  />
                ) : (
                  <Input
                    value={fieldValue}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={isTranslationMode ? `Enter ${field.label.toLowerCase()} in ${getCurrentLanguage()?.nativeName}...` : `Enter ${field.label.toLowerCase()}...`}
                    disabled={isLoading}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};