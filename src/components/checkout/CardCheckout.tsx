import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

interface CheckoutFormProps {
  pdfId: string;
  pdfTitle: string;
  price: number;
  currency: string;
  onSuccess: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ 
  pdfId, 
  pdfTitle, 
  price, 
  currency, 
  onSuccess 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !user) {
      toast({
        title: 'Error',
        description: 'Payment system not ready or user not authenticated',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Create payment intent
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'simple-payment',
        {
          body: {
            pdfId,
            userId: user.id,
          },
        }
      );

      if (paymentError || !paymentData?.clientSecret) {
        throw new Error(paymentError?.message || 'Failed to create payment');
      }

      // Get card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm payment
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        paymentData.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: user.email,
            },
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        toast({
          title: 'Payment Successful!',
          description: `Successfully purchased ${pdfTitle}`,
        });
        onSuccess();
      }
    } catch (error: any) {
      console.error('Payment failed:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Card Details
          </label>
          <div className="p-3 border rounded-md">
            <CardElement options={CARD_ELEMENT_OPTIONS} />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-md">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total:</span>
          <span className="text-lg font-bold">
            €{price.toFixed(2)} {currency.toUpperCase()}
          </span>
        </div>
        <div className="text-sm text-gray-600 mt-1">
          Payment for: {pdfTitle}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || loading}
        size="lg"
      >
        {loading ? 'Processing...' : `Pay €${price.toFixed(2)}`}
      </Button>

      <div className="text-xs text-gray-500 text-center">
        <p>💳 Test card: 4242 4242 4242 4242</p>
        <p>Secure payment powered by Stripe</p>
      </div>
    </form>
  );
};

interface CardCheckoutProps {
  pdfId: string;
  pdfTitle: string;
  price: number;
  currency?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CardCheckout: React.FC<CardCheckoutProps> = ({
  pdfId,
  pdfTitle,
  price,
  currency = 'EUR',
  onSuccess,
  onCancel,
}) => {
  return (
    <Elements stripe={stripePromise}>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Complete Your Purchase</CardTitle>
        </CardHeader>
        <CardContent>
          <CheckoutForm
            pdfId={pdfId}
            pdfTitle={pdfTitle}
            price={price}
            currency={currency}
            onSuccess={onSuccess || (() => {})}
          />
          
          {onCancel && (
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
        </CardContent>
      </Card>
    </Elements>
  );
};

export default CardCheckout;