import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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

export const useSimplePayment = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const checkPurchaseStatus = async (pdfId: string): Promise<Purchase | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('pdf_id', pdfId)
        .eq('status', 'completed')
        .maybeSingle();

      if (error) {
        console.error('Purchase status check error:', error);
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
    checkPurchaseStatus,
    getUserPurchases,
  };
};