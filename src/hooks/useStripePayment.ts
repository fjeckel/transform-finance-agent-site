import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import getStripe from '@/lib/stripe';
import { toast } from '@/hooks/use-toast';

export interface Purchase {
  id: string;
  user_id: string;
  pdf_id: string;
  stripe_payment_intent_id: string;
  amount_paid: number;
  currency: string;
  status: string;
  purchased_at: string;
  pdf?: {
    title: string;
    description: string | null;
    image_url: string | null;
    file_url?: string;
  };
}

// Enhanced error classes for better error handling
class PaymentError extends Error {
  constructor(
    message: string,
    public category: 'USER_ERROR' | 'NETWORK_ERROR' | 'SYSTEM_ERROR',
    public code?: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

// Retry utility with exponential backoff
const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      const isRetryable = error instanceof PaymentError && error.retryable;
      
      if (isLastAttempt || !isRetryable) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.log(`Retrying payment operation, attempt ${attempt + 2}/${maxRetries}`);
    }
  }
  
  throw new Error('Unexpected retry loop exit');
};

export const useStripePayment = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const processPayment = async (pdfId: string) => {
    if (!user) {
      toast({
        title: 'Authentifizierung erforderlich',
        description: 'Bitte melden Sie sich an, um Inhalte zu kaufen.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Use retry logic for creating checkout session
      const checkoutData = await withRetry(
        () => createCheckoutSession(pdfId),
        3,
        1000
      );
      
      if (!checkoutData?.sessionId) {
        throw new PaymentError(
          'Checkout-Session konnte nicht erstellt werden',
          'SYSTEM_ERROR',
          'NO_SESSION_ID'
        );
      }

      // Initialize Stripe
      const stripe = await getStripe();
      if (!stripe) {
        throw new PaymentError(
          'Stripe konnte nicht initialisiert werden',
          'SYSTEM_ERROR',
          'STRIPE_INIT_FAILED'
        );
      }

      // Direct redirect to checkout URL for better reliability
      if (checkoutData.url) {
        window.location.href = checkoutData.url;
        return;
      }

      // Fallback to redirectToCheckout
      const { error } = await stripe.redirectToCheckout({
        sessionId: checkoutData.sessionId,
      });

      if (error) {
        throw new PaymentError(
          error.message || 'Checkout-Fehler',
          'SYSTEM_ERROR',
          'CHECKOUT_REDIRECT_FAILED'
        );
      }

    } catch (error) {
      console.error('Payment processing failed:', error);
      
      if (error instanceof PaymentError) {
        toast({
          title: 'Zahlungsfehler',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Unerwarteter Fehler',
          description: 'Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const createCheckoutSession = async (pdfId: string) => {
    if (!user) {
      throw new PaymentError(
        'Authentifizierung erforderlich',
        'USER_ERROR',
        'NOT_AUTHENTICATED'
      );
    }

    try {
      // Call Supabase Edge Function to create checkout session
      const { data, error } = await supabase.functions.invoke('stripe-create-checkout-session', {
        body: {
          pdfId: pdfId,
          userId: user.id,
          successUrl: `${window.location.origin}/dashboard?payment_success=true`,
          cancelUrl: `${window.location.origin}/episodes?payment_cancelled=true`,
        },
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        
        // Categorize errors for better handling
        if (error.message.includes('already purchased')) {
          throw new PaymentError(
            'Sie haben diesen Report bereits erworben.',
            'USER_ERROR',
            'ALREADY_PURCHASED'
          );
        } else if (error.message.includes('PDF not found')) {
          throw new PaymentError(
            'Der gewählte Report existiert nicht.',
            'USER_ERROR',
            'PDF_NOT_FOUND'
          );
        } else if (error.message.includes('not premium content')) {
          throw new PaymentError(
            'Dieser Report ist kostenlos verfügbar.',
            'USER_ERROR',
            'NOT_PREMIUM'
          );
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new PaymentError(
            'Netzwerkfehler - bitte überprüfen Sie Ihre Internetverbindung.',
            'NETWORK_ERROR',
            'NETWORK_FAILURE',
            true // retryable
          );
        } else {
          throw new PaymentError(
            `Fehler beim Erstellen der Zahlung: ${error.message}`,
            'SYSTEM_ERROR',
            'CHECKOUT_SESSION_FAILED',
            true // retryable
          );
        }
      }

      if (!data) {
        throw new PaymentError(
          'Keine Antwort vom Zahlungsanbieter erhalten.',
          'SYSTEM_ERROR',
          'NO_RESPONSE_DATA'
        );
      }

      return data;
    } catch (error) {
      // Re-throw PaymentError instances
      if (error instanceof PaymentError) {
        throw error;
      }
      
      // Handle unexpected errors
      console.error('Checkout session creation failed:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new PaymentError(
          'Verbindung zum Server fehlgeschlagen.',
          'NETWORK_ERROR',
          'CONNECTION_FAILED',
          true // retryable
        );
      }
      
      throw new PaymentError(
        'Ein unerwarteter Fehler ist aufgetreten.',
        'SYSTEM_ERROR',
        'UNEXPECTED_ERROR'
      );
    }
  };

  const checkPurchaseStatus = async (pdfId: string): Promise<Purchase | null> => {
    if (!user) {
      console.log('No user logged in for purchase status check');
      return null;
    }

    try {
      console.log('Checking purchase status for:', { userId: user.id, pdfId });
      
      // Skip the problematic test query and go directly to the purchase check
      console.log('Querying purchases directly...');
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('pdf_id', pdfId)
        .eq('status', 'completed')
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no rows found

      if (error) {
        console.error('Purchase status check error:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // If it's RLS policy error, handle gracefully
        if (error.code === 'PGRST116' || error.message?.includes('policy')) {
          console.warn('RLS policy blocking query - user may not have proper permissions');
          console.warn('This usually means the user does not have a completed purchase for this PDF');
          return null;
        }
        
        // If it's a table/column not found error, return null gracefully
        if (error.code === '42P01' || error.code === '42703' || error.message?.includes('relation') || error.message?.includes('column')) {
          console.warn('Purchases table or column not found - database migration may be needed');
          toast({
            title: 'Setup erforderlich',
            description: 'Kaufsystem wird konfiguriert. Bitte versuchen Sie es später erneut.',
            variant: 'destructive',
          });
          return null;
        }
        
        return null;
      }

      console.log('Purchase status check result:', data ? 'Found purchase' : 'No purchase found');
      return data;
    } catch (error) {
      console.error('Purchase status check failed with exception:', error);
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error detected - check internet connection or Supabase service status');
        toast({
          title: 'Netzwerkfehler',
          description: 'Verbindung zum Server fehlgeschlagen. Bitte überprüfen Sie Ihre Internetverbindung.',
          variant: 'destructive',
        });
      }
      
      return null;
    }
  };

  const getUserPurchases = async (): Promise<Purchase[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          pdf:downloadable_pdfs (
            title,
            description,
            image_url,
            file_url
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('purchased_at', { ascending: false });

      if (error) {
        console.error('Error fetching user purchases:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch purchases:', error);
      return [];
    }
  };

  return {
    loading,
    processPayment,
    checkPurchaseStatus,
    getUserPurchases,
  };
};