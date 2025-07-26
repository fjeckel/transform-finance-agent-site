import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface SimpleCheckoutProps {
  pdfId: string;
  pdfTitle: string;
  price: number;
  currency?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const SimpleCheckout: React.FC<SimpleCheckoutProps> = ({
  pdfId,
  pdfTitle,
  price,
  currency = 'EUR',
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please log in to purchase',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Create checkout session
      const { data, error } = await supabase.functions.invoke(
        'stripe-create-checkout-session',
        {
          body: {
            pdfId,
            userId: user.id,
            successUrl: `${window.location.origin}/dashboard?payment_success=true&pdf_id=${pdfId}`,
            cancelUrl: `${window.location.origin}/episodes?payment_cancelled=true`,
          },
        }
      );

      if (error) {
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (!data?.url && !data?.sessionId) {
        throw new Error('No checkout URL received');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else if (data.sessionId) {
        // Fallback: construct URL if only sessionId is returned
        const checkoutUrl = `https://checkout.stripe.com/pay/${data.sessionId}`;
        window.location.href = checkoutUrl;
      }

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: 'Checkout Failed',
        description: error.message || 'Unable to start checkout process',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Purchase {pdfTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total:</span>
            <span className="text-lg font-bold">
              €{price.toFixed(2)} {currency.toUpperCase()}
            </span>
          </div>
        </div>

        <Button
          onClick={handleCheckout}
          className="w-full"
          disabled={loading}
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay €${price.toFixed(2)}`
          )}
        </Button>

        {onCancel && (
          <Button
            variant="outline"
            className="w-full"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}

        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>💳 Secure payment via Stripe</p>
          <p className="text-blue-600">You will be redirected to complete payment</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleCheckout;