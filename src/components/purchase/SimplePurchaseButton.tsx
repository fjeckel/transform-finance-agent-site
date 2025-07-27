import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Mail, Download, Loader2, ShoppingCart } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/stripe';

interface PDF {
  id: string;
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  is_premium?: boolean;
  image_url?: string;
  file_url?: string;
  stripe_payment_link_url?: string;
}

interface SimplePurchaseButtonProps {
  pdf: PDF;
}

const SimplePurchaseButton: React.FC<SimplePurchaseButtonProps> = ({ pdf }) => {
  const [loading, setLoading] = useState(false);

  // If not premium, show free download
  if (!pdf.is_premium || !pdf.price || pdf.price <= 0) {
    return (
      <Button
        onClick={() => window.open(pdf.file_url, '_blank')}
        className="w-full bg-[#13B87B] hover:bg-[#0F9A6A] text-white"
      >
        <Download size={16} className="mr-2" />
        Free Download
      </Button>
    );
  }

  const handlePurchase = async () => {
    setLoading(true);
    
    try {
      // Check if payment link already exists
      if (pdf.stripe_payment_link_url) {
        console.log('Using existing payment link:', pdf.stripe_payment_link_url);
        window.location.href = pdf.stripe_payment_link_url;
        return;
      }

      // Create new payment link
      console.log('Creating payment link for PDF:', pdf.id);
      
      const { data, error } = await supabase.functions.invoke('create-payment-link-simple', {
        body: { pdfId: pdf.id }
      });

      if (error) {
        throw new Error(error.message || 'Failed to create payment link');
      }

      if (!data?.paymentLinkUrl) {
        throw new Error('No payment link received');
      }

      console.log('Payment link created:', data.paymentLinkUrl);
      
      // Redirect to Stripe payment link
      window.location.href = data.paymentLinkUrl;

    } catch (error: any) {
      console.error('Purchase error:', error);
      
      toast({
        title: 'Purchase Failed',
        description: error.message || 'Unable to start checkout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handlePurchase}
        disabled={loading}
        className="w-full bg-gradient-to-r from-[#FF6B6B] to-[#E55555] hover:from-[#E55555] hover:to-[#CC4444] text-white font-semibold shadow-lg"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating checkout...
          </>
        ) : (
          <>
            <ShoppingCart size={16} className="mr-2" />
            Buy Now - {formatPrice(pdf.price, pdf.currency)}
          </>
        )}
      </Button>

      {/* Trust signals */}
      <div className="space-y-2">
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <CreditCard size={14} className="mr-1 text-[#13B87B]" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center">
            <Mail size={14} className="mr-1 text-[#13B87B]" />
            <span>Email Delivery</span>
          </div>
        </div>
        
        <div className="text-xs text-center text-gray-500 space-y-1">
          <p>✅ Instant PDF delivery to your email</p>
          <p>🔒 No account required • Secure checkout via Stripe</p>
          <p>📧 Need help? Contact support after purchase</p>
        </div>
      </div>
    </div>
  );
};

// Enhanced PDF card for no-login purchases
interface SimplePDFCardProps {
  pdf: PDF;
}

export const SimplePDFCard: React.FC<SimplePDFCardProps> = ({ pdf }) => {
  const isPremium = pdf.is_premium && pdf.price && pdf.price > 0;

  return (
    <Card className="h-full flex flex-col transition-all duration-200 hover:shadow-lg">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
        {pdf.image_url ? (
          <img
            src={pdf.image_url}
            alt={pdf.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Download size={32} className="text-gray-400" />
          </div>
        )}
        
        {/* Premium badge */}
        {isPremium && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-[#FF6B6B] text-white">
              Premium
            </Badge>
          </div>
        )}
        
        {/* Price overlay */}
        {isPremium && (
          <div className="absolute bottom-2 left-2">
            <div className="bg-black/70 text-white px-2 py-1 rounded text-sm font-semibold">
              {formatPrice(pdf.price!, pdf.currency)}
            </div>
          </div>
        )}
      </div>

      <CardContent className="flex-1 flex flex-col p-4">
        {/* Title */}
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">
          {pdf.title}
        </h3>

        {/* Description */}
        {pdf.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
            {pdf.description}
          </p>
        )}

        {/* Purchase button */}
        <div className="mt-auto">
          <SimplePurchaseButton pdf={pdf} />
        </div>
      </CardContent>
    </Card>
  );
};

export default SimplePurchaseButton;