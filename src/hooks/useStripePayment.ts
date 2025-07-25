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

export const useStripePayment = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const createPaymentIntent = async (pdfId: string) => {
    if (!user) {
      toast({
        title: 'Authentifizierung erforderlich',
        description: 'Bitte melden Sie sich an, um Inhalte zu kaufen.',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);

    try {
      // Call Supabase Edge Function to create payment intent
      const { data, error } = await supabase.functions.invoke('stripe-create-payment-intent', {
        body: {
          pdfId: pdfId,
          userId: user.id,
        },
      });

      if (error) {
        console.error('Error creating payment intent:', error);
        
        if (error.message.includes('already purchased')) {
          toast({
            title: 'Bereits gekauft',
            description: 'Sie haben diesen Report bereits erworben.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Fehler beim Erstellen der Zahlung',
            description: 'Bitte versuchen Sie es erneut.',
            variant: 'destructive',
          });
        }
        return null;
      }

      return data;
    } catch (error) {
      console.error('Payment intent creation failed:', error);
      toast({
        title: 'Zahlung fehlgeschlagen',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (pdfId: string) => {
    // Create checkout session instead of payment intent for simpler flow
    const checkoutData = await createCheckoutSession(pdfId);
    
    if (!checkoutData || !checkoutData.sessionId) {
      return;
    }

    const stripe = await getStripe();
    
    if (!stripe) {
      toast({
        title: 'Stripe-Konfigurationsfehler',
        description: 'Zahlungsanbieter konnte nicht geladen werden. Bitte kontaktieren Sie den Support.',
        variant: 'destructive',
      });
      console.error('Stripe could not be initialized. Check VITE_STRIPE_PUBLISHABLE_KEY environment variable.');
      return;
    }

    // Redirect to Stripe Checkout
    const { error } = await stripe.redirectToCheckout({
      sessionId: checkoutData.sessionId,
    });

    if (error) {
      console.error('Stripe checkout error:', error);
      toast({
        title: 'Checkout-Fehler',
        description: error.message || 'Fehler beim Öffnen des Zahlungsformulars.',
        variant: 'destructive',
      });
    }
  };

  const createCheckoutSession = async (pdfId: string) => {
    if (!user) {
      toast({
        title: 'Authentifizierung erforderlich',
        description: 'Bitte melden Sie sich an, um Inhalte zu kaufen.',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);

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
        
        if (error.message.includes('already purchased')) {
          toast({
            title: 'Bereits gekauft',
            description: 'Sie haben diesen Report bereits erworben.',
            variant: 'destructive',
          });
        } else if (error.message.includes('PDF not found')) {
          toast({
            title: 'Report nicht gefunden',
            description: 'Der gewählte Report existiert nicht.',
            variant: 'destructive',
          });
        } else if (error.message.includes('not premium content')) {
          toast({
            title: 'Kein Premium-Content',
            description: 'Dieser Report ist kostenlos verfügbar.',
            variant: 'destructive',
          });
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          toast({
            title: 'Netzwerkfehler',
            description: 'Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Fehler beim Erstellen der Zahlung',
            description: `Bitte versuchen Sie es erneut. Details: ${error.message}`,
            variant: 'destructive',
          });
        }
        return null;
      }

      return data;
    } catch (error) {
      console.error('Checkout session creation failed:', error);
      toast({
        title: 'Zahlung fehlgeschlagen',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const checkPurchaseStatus = async (pdfId: string): Promise<Purchase | null> => {
    if (!user) {
      console.log('No user logged in for purchase status check');
      return null;
    }

    try {
      console.log('Checking purchase status for:', { userId: user.id, pdfId });
      
      // First, test if we can access the purchases table at all
      console.log('Testing database connection...');
      const testQuery = await supabase
        .from('purchases')
        .select('count')
        .limit(0);
      
      if (testQuery.error) {
        console.error('Database connection test failed:', testQuery.error);
        throw testQuery.error;
      }
      
      console.log('Database connection successful, checking purchase...');
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