import * as React from "react";
import { DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CostTrackerProps, AIProvider } from "@/types/research";

const CostTracker: React.FC<CostTrackerProps> = ({
  currentCost,
  estimatedCost,
  currency,
  breakdown,
  className
}) => {
  const costPercentage = estimatedCost > 0 ? Math.min((currentCost / estimatedCost) * 100, 100) : 0;
  const isOverBudget = currentCost > estimatedCost;
  const remainingCost = Math.max(estimatedCost - currentCost, 0);

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    }).format(cost);
  };

  const getProviderIcon = (provider: AIProvider) => {
    switch (provider) {
      case 'claude':
        return '🤖';
      case 'openai':
        return '⚡';
      default:
        return '🔍';
    }
  };

  const getProviderColor = (provider: AIProvider) => {
    switch (provider) {
      case 'claude':
        return 'bg-blue-500';
      case 'openai':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="w-5 h-5" />
          Cost Tracking
          {isOverBudget && (
            <Badge variant="destructive" className="ml-2">
              <AlertCircle className="w-3 h-3 mr-1" />
              Over Budget
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main cost display */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Cost</p>
            <p className={cn(
              "text-2xl font-bold",
              isOverBudget ? "text-destructive" : "text-primary"
            )}>
              {formatCost(currentCost)}
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Estimated</p>
            <p className="text-xl font-semibold text-gray-700">
              {formatCost(estimatedCost)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className={cn(
              "font-medium",
              isOverBudget ? "text-destructive" : "text-primary"
            )}>
              {costPercentage.toFixed(1)}%
            </span>
          </div>
          
          <Progress 
            value={costPercentage} 
            className={cn(
              "h-3",
              isOverBudget && "bg-red-100"
            )}
            aria-label={`Cost progress: ${costPercentage.toFixed(1)}%`}
          />
          
          {!isOverBudget && remainingCost > 0 && (
            <p className="text-xs text-muted-foreground">
              {formatCost(remainingCost)} remaining
            </p>
          )}
        </div>

        {/* Provider breakdown */}
        {breakdown && Object.keys(breakdown).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Provider Breakdown</h4>
            
            <div className="space-y-2">
              {Object.entries(breakdown).map(([provider, cost]) => {
                const providerKey = provider as AIProvider;
                const percentage = currentCost > 0 ? (cost / currentCost) * 100 : 0;
                
                return (
                  <div key={provider} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        getProviderColor(providerKey)
                      )} />
                      <span className="text-sm capitalize">
                        {getProviderIcon(providerKey)} {provider}
                      </span>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatCost(cost)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mobile-friendly summary */}
        <div className="sm:hidden">
          <div className="bg-gray-50 rounded-lg p-3 mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium">
                {formatCost(currentCost)} / {formatCost(estimatedCost)}
              </span>
            </div>
          </div>
        </div>

        {/* Cost trend indicator */}
        {currentCost > 0 && estimatedCost > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span>
              {isOverBudget 
                ? `${((currentCost / estimatedCost - 1) * 100).toFixed(1)}% over estimate`
                : "On track with estimate"
              }
            </span>
          </div>
        )}

        {/* Live updates indicator */}
        <div className="flex items-center justify-center pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Real-time cost tracking</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

CostTracker.displayName = "CostTracker";

export { CostTracker };