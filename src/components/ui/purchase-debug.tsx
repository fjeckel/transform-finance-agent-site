import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PDF } from '@/hooks/usePdfs';
import { useAuth } from '@/contexts/AuthContext';

interface PurchaseDebugProps {
  pdf: PDF;
  isPurchased: boolean;
  checkingPurchase: boolean;
  loading: boolean;
}

export const PurchaseDebug = ({ pdf, isPurchased, checkingPurchase, loading }: PurchaseDebugProps) => {
  const { user } = useAuth();
  
  // Show in all environments for debugging
  // if (import.meta.env.PROD) {
  //   return null;
  // }

  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const isProd = import.meta.env.PROD;

  return (
    <Card className={`mt-4 border-yellow-200 ${isProd ? 'bg-red-50 border-red-200' : 'bg-yellow-50'}`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-sm ${isProd ? 'text-red-800' : 'text-yellow-800'}`}>
          {isProd ? '🚨 PRODUCTION DEBUG' : 'Purchase Debug Info'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <strong>PDF ID:</strong> {pdf.id}
          </div>
          <div>
            <strong>User:</strong> {user?.email || 'Not logged in'}
          </div>
          <div>
            <strong>Is Premium:</strong> 
            <Badge variant={pdf.is_premium ? 'default' : 'secondary'} className="ml-1 text-xs">
              {pdf.is_premium ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div>
            <strong>Price:</strong> {pdf.price || 'Free'}
          </div>
          <div>
            <strong>Is Purchased:</strong>
            <Badge variant={isPurchased ? 'default' : 'destructive'} className="ml-1 text-xs">
              {isPurchased ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div>
            <strong>Checking:</strong>
            <Badge variant={checkingPurchase ? 'default' : 'secondary'} className="ml-1 text-xs">
              {checkingPurchase ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div>
            <strong>Loading:</strong>
            <Badge variant={loading ? 'default' : 'secondary'} className="ml-1 text-xs">
              {loading ? 'Yes' : 'No'}
            </Badge>
          </div>
        </div>
        
        <div className="pt-2 border-t border-yellow-200">
          <strong>Environment:</strong>
          <div className="mt-1 space-y-1">
            <div>
              <strong>Stripe Key:</strong> 
              <Badge variant={stripeKey ? 'default' : 'destructive'} className="ml-1 text-xs">
                {stripeKey ? '✓ Set' : '✗ Missing'}
              </Badge>
            </div>
            <div>
              <strong>Supabase URL:</strong>
              <Badge variant={supabaseUrl ? 'default' : 'destructive'} className="ml-1 text-xs">
                {supabaseUrl ? '✓ Set' : '✗ Missing'}
              </Badge>
            </div>
            <div>
              <strong>Supabase Key:</strong>
              <Badge variant={supabaseKey ? 'default' : 'destructive'} className="ml-1 text-xs">
                {supabaseKey ? '✓ Set' : '✗ Missing'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};