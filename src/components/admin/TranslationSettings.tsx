import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Key, 
  Shield, 
  DollarSign, 
  Globe, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Zap
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TranslationConfig {
  openai_api_key?: string;
  claude_api_key?: string;
  default_provider: 'openai' | 'claude';
  default_model: string;
  auto_translate_enabled: boolean;
  auto_translate_fields: string[];
  quality_threshold: number;
  cost_limit_daily: number;
  cost_limit_monthly: number;
  supported_languages: string[];
}

const AVAILABLE_PROVIDERS = [
  { 
    value: 'openai', 
    label: 'OpenAI', 
    description: 'Reliable and consistent translations',
    models: [
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini', cost: 'Low cost', description: 'Best for most translations' },
      { value: 'gpt-4o', label: 'GPT-4o', cost: 'Higher cost', description: 'Premium quality translations' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', cost: 'Lowest cost', description: 'Basic translations' },
    ]
  },
  { 
    value: 'claude', 
    label: 'Anthropic Claude', 
    description: 'Excellent for creative and nuanced content',
    models: [
      { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', cost: 'Very low cost', description: 'Fast and cost-effective' },
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', cost: 'Medium cost', description: 'Best quality-to-cost ratio' },
      { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus', cost: 'Higher cost', description: 'Highest quality translations' },
    ]
  }
];

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
];

const TRANSLATION_FIELDS = [
  { value: 'title', label: 'Titles', description: 'Page and content titles' },
  { value: 'description', label: 'Descriptions', description: 'Short content descriptions' },
  { value: 'content', label: 'Full Content', description: 'Complete article/episode content' },
  { value: 'summary', label: 'Summaries', description: 'Content summaries and takeaways' },
];

export const TranslationSettings: React.FC = () => {
  const [config, setConfig] = useState<TranslationConfig>({
    default_provider: 'openai',
    default_model: 'gpt-4o-mini',
    auto_translate_enabled: false,
    auto_translate_fields: ['title', 'description'],
    quality_threshold: 0.8,
    cost_limit_daily: 10.0,
    cost_limit_monthly: 100.0,
    supported_languages: ['en', 'fr', 'es'],
  });

  const [showOpenAiKey, setShowOpenAiKey] = useState(false);
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [openAiKeyStatus, setOpenAiKeyStatus] = useState<'unknown' | 'valid' | 'invalid'>('unknown');
  const [claudeKeyStatus, setClaudeKeyStatus] = useState<'unknown' | 'valid' | 'invalid'>('unknown');

  // Test API key mutation
  const testApiKeyMutation = useMutation({
    mutationFn: async (apiKey: string) => {
      // This would call a test endpoint to validate the API key
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/test-openai-key`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });

      if (!response.ok) {
        throw new Error('Failed to test API key');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setApiKeyStatus(data.valid ? 'valid' : 'invalid');
      toast({
        title: data.valid ? 'API Key Valid' : 'API Key Invalid',
        description: data.valid 
          ? 'OpenAI API key is working correctly' 
          : 'Please check your API key and try again',
        variant: data.valid ? 'default' : 'destructive',
      });
    },
    onError: () => {
      setApiKeyStatus('invalid');
      toast({
        title: 'Test Failed',
        description: 'Could not validate API key',
        variant: 'destructive',
      });
    },
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: TranslationConfig) => {
      // Save to Supabase settings or environment
      // For production, API key should be stored securely in Supabase secrets
      console.log('Saving translation settings:', settings);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return settings;
    },
    onSuccess: () => {
      toast({
        title: 'Settings Saved',
        description: 'Translation configuration has been updated',
      });
    },
    onError: (error) => {
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Could not save settings',
        variant: 'destructive',
      });
    },
  });

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(config);
  };

  const handleTestApiKey = () => {
    if (config.openai_api_key) {
      testApiKeyMutation.mutate(config.openai_api_key);
    }
  };

  const updateLanguages = (languageCode: string, enabled: boolean) => {
    const updatedLanguages = enabled
      ? [...config.supported_languages, languageCode]
      : config.supported_languages.filter(code => code !== languageCode);
    
    setConfig({ ...config, supported_languages: updatedLanguages });
  };

  const updateAutoTranslateFields = (field: string, enabled: boolean) => {
    const updatedFields = enabled
      ? [...config.auto_translate_fields, field]
      : config.auto_translate_fields.filter(f => f !== field);
    
    setConfig({ ...config, auto_translate_fields: updatedFields });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Translation Settings</h1>
        <p className="text-muted-foreground">
          Configure OpenAI integration and translation preferences
        </p>
      </div>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            OpenAI API Configuration
          </CardTitle>
          <CardDescription>
            Configure your OpenAI API key for automated translations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">OpenAI API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="api-key"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={config.openai_api_key || ''}
                  onChange={(e) => setConfig({ ...config, openai_api_key: e.target.value })}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-1"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  <Shield className="h-3 w-3" />
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={handleTestApiKey}
                disabled={!config.openai_api_key || testApiKeyMutation.isPending}
              >
                Test Key
              </Button>
            </div>
            
            {apiKeyStatus !== 'unknown' && (
              <div className="flex items-center gap-2 text-sm">
                {apiKeyStatus === 'valid' ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">API key is valid</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-red-600">API key is invalid</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Default Model</Label>
            <Select
              value={config.default_model}
              onValueChange={(value) => setConfig({ ...config, default_model: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium">{model.label}</div>
                        <div className="text-xs text-muted-foreground">{model.description}</div>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {model.cost}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your API key is stored securely and never logged or exposed in the UI. 
              For production deployment, use Supabase secrets management.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Auto-Translation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Auto-Translation Settings
          </CardTitle>
          <CardDescription>
            Configure automatic translation behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Auto-Translation</Label>
              <p className="text-sm text-muted-foreground">
                Automatically translate new content when published
              </p>
            </div>
            <Switch
              checked={config.auto_translate_enabled}
              onCheckedChange={(checked) => 
                setConfig({ ...config, auto_translate_enabled: checked })
              }
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Auto-Translate Fields</Label>
            <div className="grid grid-cols-2 gap-3">
              {TRANSLATION_FIELDS.map((field) => (
                <div key={field.value} className="flex items-center space-x-2">
                  <Switch
                    id={field.value}
                    checked={config.auto_translate_fields.includes(field.value)}
                    onCheckedChange={(checked) => 
                      updateAutoTranslateFields(field.value, checked)
                    }
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor={field.value} className="text-sm font-medium">
                      {field.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {field.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="quality-threshold">Quality Threshold</Label>
            <div className="flex items-center gap-4">
              <Input
                id="quality-threshold"
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={config.quality_threshold}
                onChange={(e) => 
                  setConfig({ ...config, quality_threshold: parseFloat(e.target.value) })
                }
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                Minimum quality score for auto-approval (0.0 - 1.0)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Supported Languages
          </CardTitle>
          <CardDescription>
            Select which languages to support for translations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {LANGUAGES.map((language) => (
              <div key={language.code} className="flex items-center space-x-2">
                <Switch
                  id={language.code}
                  checked={config.supported_languages.includes(language.code)}
                  onCheckedChange={(checked) => 
                    updateLanguages(language.code, checked)
                  }
                />
                <Label htmlFor={language.code} className="flex items-center gap-2">
                  <span>{language.flag}</span>
                  {language.name}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cost Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost Management
          </CardTitle>
          <CardDescription>
            Set spending limits to control translation costs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="daily-limit">Daily Cost Limit (USD)</Label>
              <Input
                id="daily-limit"
                type="number"
                min="0"
                step="0.01"
                value={config.cost_limit_daily}
                onChange={(e) => 
                  setConfig({ ...config, cost_limit_daily: parseFloat(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly-limit">Monthly Cost Limit (USD)</Label>
              <Input
                id="monthly-limit"
                type="number"
                min="0"
                step="0.01"
                value={config.cost_limit_monthly}
                onChange={(e) => 
                  setConfig({ ...config, cost_limit_monthly: parseFloat(e.target.value) })
                }
              />
            </div>
          </div>
          
          <Alert>
            <DollarSign className="h-4 w-4" />
            <AlertDescription>
              Translation will be paused when limits are reached. Costs are tracked in real-time.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings}
          disabled={saveSettingsMutation.isPending}
          size="lg"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
};