import React, { useState, useEffect } from 'react';
import { Check, Globe, DollarSign, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface Language {
  code: string;
  name: string;
  native_name: string;
  flag_emoji: string;
  is_default: boolean;
}

interface MultiLanguageSelectorProps {
  selectedLanguages: string[];
  onLanguagesChange: (languages: string[]) => void;
  sourceLanguage: string;
  onSourceLanguageChange: (language: string) => void;
  contentLength: number;
  className?: string;
}

export const MultiLanguageSelector: React.FC<MultiLanguageSelectorProps> = ({
  selectedLanguages,
  onLanguagesChange,
  sourceLanguage,
  onSourceLanguageChange,
  contentLength,
  className = ''
}) => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [estimatedCost, setEstimatedCost] = useState(0);

  // Load available languages
  useEffect(() => {
    loadLanguages();
  }, []);

  // Calculate estimated cost when languages or content changes
  useEffect(() => {
    if (selectedLanguages.length > 0 && contentLength > 0) {
      calculateEstimatedCost();
    }
  }, [selectedLanguages, contentLength]);

  const loadLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from('languages')
        .select('code, name, native_name, flag_emoji, is_default')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Error loading languages:', error);
        return;
      }

      setLanguages(data || []);
    } catch (error) {
      console.error('Error loading languages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateEstimatedCost = async () => {
    try {
      // Call the database function to estimate cost
      const { data, error } = await supabase
        .rpc('estimate_translation_cost', {
          content_length: contentLength,
          target_language_count: selectedLanguages.length,
          provider: 'openai'
        });

      if (!error && data) {
        setEstimatedCost(parseFloat(data));
      }
    } catch (error) {
      console.error('Error calculating cost:', error);
    }
  };

  const handleLanguageToggle = (languageCode: string) => {
    if (selectedLanguages.includes(languageCode)) {
      onLanguagesChange(selectedLanguages.filter(code => code !== languageCode));
    } else {
      onLanguagesChange([...selectedLanguages, languageCode]);
    }
  };

  const handleSelectAll = () => {
    const allCodes = languages.map(lang => lang.code);
    onLanguagesChange(allCodes);
  };

  const handleClearAll = () => {
    onLanguagesChange([]);
  };

  const getLanguageByCode = (code: string) => {
    return languages.find(lang => lang.code === code);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 animate-spin" />
            <span className="text-sm text-gray-600">Loading languages...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Language Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Source Language Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Source Language</Label>
          <Select value={sourceLanguage} onValueChange={onSourceLanguageChange}>
            <SelectTrigger>
              <SelectValue placeholder="Detect automatically" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Auto-detect
                </div>
              </SelectItem>
              {languages.map((language) => (
                <SelectItem key={language.code} value={language.code}>
                  <div className="flex items-center gap-2">
                    <span>{language.flag_emoji}</span>
                    <span>{language.native_name}</span>
                    {language.is_default && (
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Target Languages Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Target Languages</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={selectedLanguages.length === languages.length}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={selectedLanguages.length === 0}
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Language Grid */}
          <div className="grid grid-cols-2 gap-2">
            {languages.map((language) => {
              const isSelected = selectedLanguages.includes(language.code);
              const isSourceLanguage = sourceLanguage === language.code;
              
              return (
                <div
                  key={language.code}
                  className={`
                    flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors
                    ${isSelected 
                      ? 'bg-green-50 border-green-200 text-green-900' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }
                    ${isSourceLanguage ? 'opacity-50' : ''}
                  `}
                  onClick={() => !isSourceLanguage && handleLanguageToggle(language.code)}
                >
                  <Checkbox 
                    checked={isSelected}
                    disabled={isSourceLanguage}
                    onChange={() => {}} // Handled by div click
                  />
                  <span className="text-lg">{language.flag_emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{language.native_name}</div>
                    <div className="text-xs text-gray-500">{language.name}</div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-green-600" />}
                  {isSourceLanguage && (
                    <Badge variant="outline" className="text-xs">Source</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selection Summary */}
        {selectedLanguages.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Selected Languages</span>
                <Badge variant="outline">{selectedLanguages.length} languages</Badge>
              </div>
              
              {/* Selected language badges */}
              <div className="flex flex-wrap gap-2">
                {selectedLanguages.map((code) => {
                  const language = getLanguageByCode(code);
                  if (!language) return null;
                  
                  return (
                    <Badge
                      key={code}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <span>{language.flag_emoji}</span>
                      <span>{language.native_name}</span>
                    </Badge>
                  );
                })}
              </div>

              {/* Cost Estimation */}
              {contentLength > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800">Estimated Cost</span>
                  </div>
                  <div className="text-sm font-medium text-blue-900">
                    ${estimatedCost.toFixed(4)} USD
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MultiLanguageSelector;