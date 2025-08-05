import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Globe, 
  Languages, 
  Bot, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Eye,
  Edit,
  Save,
  X
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { translationService } from '@/services/translationService';
import { supabase } from '@/integrations/supabase/client';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

interface Translation {
  language: string;
  status: 'none' | 'pending' | 'completed' | 'approved' | 'error';
  fields: Record<string, string>;
  cost?: number;
  quality?: number;
}

interface TranslationPanelProps {
  contentId: string;
  contentType: 'episode' | 'insight' | 'category';
  currentLanguage: string;
  fields: string[];
  originalContent: Record<string, string>;
  onTranslationUpdate?: (language: string, translations: Record<string, string>) => void;
}

const languages: Language[] = [
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
];

export const TranslationPanel: React.FC<TranslationPanelProps> = ({
  contentId,
  contentType,
  currentLanguage,
  fields,
  originalContent,
  onTranslationUpdate
}) => {
  const { t } = useTranslation();
  const [translations, setTranslations] = useState<Record<string, Translation>>({});
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>(fields);
  const [aiProvider, setAiProvider] = useState<'openai' | 'claude'>('openai');
  const [isTranslating, setIsTranslating] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [estimatedCost, setEstimatedCost] = useState<{ openai: number; claude: number }>({ openai: 0, claude: 0 });

  // Load existing translations
  useEffect(() => {
    loadExistingTranslations();
  }, [contentId]);

  // Calculate estimated costs
  useEffect(() => {
    calculateEstimatedCosts();
  }, [selectedLanguages, selectedFields, originalContent]);

  const loadExistingTranslations = async () => {
    if (!contentId) return;

    try {
      const tableName = `${contentType}s_translations`;
      const idField = `${contentType}_id`;

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(idField, contentId);

      if (error) throw error;

      const translationMap: Record<string, Translation> = {};
      data?.forEach(trans => {
        const fields: Record<string, string> = {};
        selectedFields.forEach(field => {
          if (trans[field]) fields[field] = trans[field];
        });

        translationMap[trans.language_code] = {
          language: trans.language_code,
          status: trans.translation_status || 'none',
          fields,
          cost: trans.openai_cost_usd || trans.anthropic_cost_usd,
          quality: trans.translation_quality_score
        };
      });

      setTranslations(translationMap);
    } catch (error) {
      console.error('Error loading translations:', error);
    }
  };

  const calculateEstimatedCosts = () => {
    const textLength = selectedFields.reduce((sum, field) => {
      return sum + (originalContent[field]?.length || 0);
    }, 0);

    const tokensEstimate = textLength / 4; // Rough estimate: 1 token ≈ 4 characters
    const languageCount = selectedLanguages.length;

    // Pricing estimates (as of the models available)
    const openaiCost = (tokensEstimate * 0.00015 + tokensEstimate * 0.0006) / 1000 * languageCount;
    const claudeCost = (tokensEstimate * 0.00008 + tokensEstimate * 0.00024) / 1000 * languageCount;

    setEstimatedCost({
      openai: Math.round(openaiCost * 100) / 100,
      claude: Math.round(claudeCost * 100) / 100
    });
  };

  const handleTranslate = async () => {
    if (selectedLanguages.length === 0 || selectedFields.length === 0) {
      toast({
        title: "Translation Error",
        description: "Please select at least one language and field to translate",
        variant: "destructive"
      });
      return;
    }

    setIsTranslating(true);

    try {
      for (const language of selectedLanguages) {
        if (language === currentLanguage) continue;

        const result = await translationService.translateContent({
          contentId,
          contentType,
          targetLanguage: language,
          fields: selectedFields,
          priority: 'medium',
          aiProvider // This would need to be added to the service
        });

        if (result.success && result.translations) {
          setTranslations(prev => ({
            ...prev,
            [language]: {
              language,
              status: 'completed',
              fields: result.translations!,
              cost: result.cost?.totalCostUsd,
              quality: 0.85 // Default for now
            }
          }));

          if (onTranslationUpdate) {
            onTranslationUpdate(language, result.translations);
          }
        } else {
          setTranslations(prev => ({
            ...prev,
            [language]: {
              language,
              status: 'error',
              fields: {},
              error: result.error
            }
          }));
        }
      }

      toast({
        title: "Translation Complete",
        description: `Successfully translated to ${selectedLanguages.length} languages`,
      });
    } catch (error) {
      toast({
        title: "Translation Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleEditTranslation = (language: string) => {
    setEditingLanguage(language);
    setEditedContent(translations[language]?.fields || {});
  };

  const handleSaveEdit = async () => {
    if (!editingLanguage) return;

    try {
      const tableName = `${contentType}s_translations`;
      const idField = `${contentType}_id`;

      const { error } = await supabase
        .from(tableName)
        .update(editedContent)
        .eq(idField, contentId)
        .eq('language_code', editingLanguage);

      if (error) throw error;

      setTranslations(prev => ({
        ...prev,
        [editingLanguage]: {
          ...prev[editingLanguage],
          fields: editedContent
        }
      }));

      if (onTranslationUpdate) {
        onTranslationUpdate(editingLanguage, editedContent);
      }

      setEditingLanguage(null);
      toast({
        title: "Translation Updated",
        description: "Your changes have been saved",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to save changes",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      title: 'Title',
      subtitle: 'Subtitle',
      description: 'Description',
      content: 'Content',
      summary: 'Summary',
      book_title: 'Book Title',
      book_author: 'Book Author',
      name: 'Name'
    };
    return labels[field] || field.charAt(0).toUpperCase() + field.slice(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          AI-Powered Translations
        </CardTitle>
        <CardDescription>
          Translate your content into multiple languages using AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Language Selection */}
        <div>
          <h4 className="text-sm font-medium mb-3">Target Languages</h4>
          <div className="flex flex-wrap gap-3">
            {languages.filter(lang => lang.code !== currentLanguage).map(lang => (
              <label key={lang.code} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedLanguages.includes(lang.code)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedLanguages([...selectedLanguages, lang.code]);
                    } else {
                      setSelectedLanguages(selectedLanguages.filter(l => l !== lang.code));
                    }
                  }}
                />
                <span className="text-lg">{lang.flag}</span>
                <span className="text-sm">{lang.nativeName}</span>
                {translations[lang.code] && getStatusIcon(translations[lang.code].status)}
              </label>
            ))}
          </div>
        </div>

        {/* Field Selection */}
        <div>
          <h4 className="text-sm font-medium mb-3">Fields to Translate</h4>
          <div className="flex flex-wrap gap-3">
            {fields.map(field => (
              <label key={field} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedFields.includes(field)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedFields([...selectedFields, field]);
                    } else {
                      setSelectedFields(selectedFields.filter(f => f !== field));
                    }
                  }}
                />
                <span className="text-sm">{getFieldLabel(field)}</span>
              </label>
            ))}
          </div>
        </div>

        {/* AI Provider Selection */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">AI Provider</h4>
          <Select value={aiProvider} onValueChange={(value: 'openai' | 'claude') => setAiProvider(value)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    OpenAI GPT-4o Mini
                  </span>
                  <Badge variant="secondary" className="ml-2">
                    ~${estimatedCost.openai}
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="claude">
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    Claude 3.5 Haiku
                  </span>
                  <Badge variant="secondary" className="ml-2">
                    ~${estimatedCost.claude}
                  </Badge>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Estimated cost for {selectedLanguages.length} languages
          </p>
        </div>

        {/* Translation Button */}
        <Button 
          onClick={handleTranslate} 
          disabled={isTranslating || selectedLanguages.length === 0 || selectedFields.length === 0}
          className="w-full"
        >
          {isTranslating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Translating...
            </>
          ) : (
            <>
              <Globe className="mr-2 h-4 w-4" />
              Translate Content
            </>
          )}
        </Button>

        {/* Translation Results */}
        {Object.keys(translations).length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Translation Status</h4>
            <Tabs defaultValue={Object.keys(translations)[0]}>
              <TabsList className="grid grid-cols-4 w-full">
                {Object.entries(translations).map(([lang, trans]) => {
                  const language = languages.find(l => l.code === lang);
                  return (
                    <TabsTrigger key={lang} value={lang} className="flex items-center gap-2">
                      <span>{language?.flag}</span>
                      {getStatusIcon(trans.status)}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              {Object.entries(translations).map(([lang, trans]) => (
                <TabsContent key={lang} value={lang} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge variant={trans.status === 'completed' ? 'default' : 'secondary'}>
                        {trans.status}
                      </Badge>
                      {trans.cost && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {trans.cost.toFixed(4)}
                        </span>
                      )}
                      {trans.quality && (
                        <span className="text-sm text-muted-foreground">
                          Quality: {Math.round(trans.quality * 100)}%
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {editingLanguage === lang ? (
                        <>
                          <Button size="sm" onClick={handleSaveEdit}>
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingLanguage(null)}>
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleEditTranslation(lang)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {trans.status === 'completed' && trans.fields && (
                    <div className="space-y-3">
                      {Object.entries(trans.fields).map(([field, value]) => (
                        <div key={field} className="space-y-1">
                          <label className="text-sm font-medium">{getFieldLabel(field)}</label>
                          {editingLanguage === lang ? (
                            <textarea
                              className="w-full p-2 border rounded-md"
                              value={editedContent[field] || ''}
                              onChange={(e) => setEditedContent({
                                ...editedContent,
                                [field]: e.target.value
                              })}
                              rows={field === 'content' ? 10 : 3}
                            />
                          ) : (
                            <div className="p-2 bg-muted rounded-md text-sm">
                              {value}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {trans.status === 'error' && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {trans.error || 'Translation failed'}
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
};