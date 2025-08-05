import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  DollarSign, 
  Clock, 
  Sparkles, 
  Brain,
  Zap,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIProvider {
  id: 'openai' | 'claude';
  name: string;
  model: string;
  description: string;
  strengths: string[];
  pricing: {
    inputCost: number;
    outputCost: number;
    currency: string;
  };
  speed: 'fast' | 'medium' | 'slow';
  quality: 'high' | 'medium' | 'low';
}

interface AIProviderSelectorProps {
  selectedProvider: 'openai' | 'claude';
  onProviderChange: (provider: 'openai' | 'claude') => void;
  estimatedCost: { openai: number; claude: number };
  contentType?: 'episode' | 'insight' | 'category';
  disabled?: boolean;
}

const aiProviders: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI GPT-4o Mini',
    model: 'gpt-4o-mini',
    description: 'Optimized for cost-effectiveness with excellent translation quality',
    strengths: ['Technical content', 'Consistency', 'Fast processing', 'Good for batch operations'],
    pricing: {
      inputCost: 0.15,
      outputCost: 0.60,
      currency: 'USD per 1M tokens'
    },
    speed: 'fast',
    quality: 'high'
  },
  {
    id: 'claude',
    name: 'Claude 3.5 Haiku',
    model: 'claude-3-5-haiku-20241022',
    description: 'Excellent for creative and nuanced content translation',
    strengths: ['Creative content', 'Cultural context', 'Natural tone', 'Marketing copy'],
    pricing: {
      inputCost: 0.08,
      outputCost: 0.24,
      currency: 'USD per 1M tokens'
    },
    speed: 'medium',
    quality: 'high'
  }
];

export const AIProviderSelector: React.FC<AIProviderSelectorProps> = ({
  selectedProvider,
  onProviderChange,
  estimatedCost,
  contentType = 'insight',
  disabled = false
}) => {
  const getSpeedIcon = (speed: string) => {
    switch (speed) {
      case 'fast':
        return <Zap className="h-4 w-4 text-green-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-red-500" />;
    }
  };

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'high':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      case 'medium':
        return <Target className="h-4 w-4 text-blue-500" />;
      default:
        return <Brain className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRecommendedProvider = () => {
    switch (contentType) {
      case 'episode':
        return 'claude'; // Better for conversational/creative content
      case 'insight':
        return 'openai'; // Better for technical/structured content
      case 'category':
        return 'openai'; // Simple, structured content
      default:
        return 'openai';
    }
  };

  const recommendedProvider = getRecommendedProvider();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Translation Provider
        </CardTitle>
        <CardDescription>
          Choose the AI model that best fits your content type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedProvider}
          onValueChange={onProviderChange}
          disabled={disabled}
          className="space-y-4"
        >
          {aiProviders.map((provider) => (
            <div key={provider.id} className="relative">
              <div className={cn(
                "flex items-start space-x-3 rounded-lg border p-4 transition-colors",
                selectedProvider === provider.id 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:bg-muted/50"
              )}>
                <RadioGroupItem value={provider.id} id={provider.id} className="mt-1" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={provider.id} className="text-base font-medium cursor-pointer">
                      {provider.name}
                    </Label>
                    <div className="flex items-center gap-2">
                      {provider.id === recommendedProvider && (
                        <Badge variant="secondary" className="text-xs">
                          Recommended
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ${estimatedCost[provider.id].toFixed(3)}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {provider.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      {getSpeedIcon(provider.speed)}
                      <span className="capitalize">{provider.speed}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getQualityIcon(provider.quality)}
                      <span className="capitalize">{provider.quality} Quality</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Best for:</div>
                    <div className="flex flex-wrap gap-1">
                      {provider.strengths.map((strength, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Pricing: ${provider.pricing.inputCost} input / ${provider.pricing.outputCost} output {provider.pricing.currency}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </RadioGroup>

        {/* Provider Comparison */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Cost Comparison</h4>
          <div className="grid grid-cols-2 gap-4">
            {aiProviders.map((provider) => (
              <div
                key={provider.id}
                className={cn(
                  "text-center p-3 rounded-lg border",
                  selectedProvider === provider.id
                    ? "border-primary bg-primary/5"
                    : "border-border"
                )}
              >
                <div className="text-lg font-bold">
                  ${estimatedCost[provider.id].toFixed(3)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {provider.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Type Recommendation */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-sm">
            <strong>For {contentType}s:</strong> We recommend{' '}
            <strong>
              {aiProviders.find(p => p.id === recommendedProvider)?.name}
            </strong>{' '}
            based on content type and quality optimization.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};