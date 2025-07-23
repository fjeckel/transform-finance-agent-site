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
        title: 'Stripe-Fehler',
        description: 'Zahlungsanbieter konnte nicht geladen werden.',
        variant: 'destructive',
      });
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
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('pdf_id', pdfId)
        .eq('status', 'completed')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking purchase status:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Purchase status check failed:', error);
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