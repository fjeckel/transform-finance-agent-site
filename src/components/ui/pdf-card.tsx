import React, { useState, useEffect } from 'react';
import { Download, Calendar, FileText, Lock, CreditCard, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PDF } from '@/hooks/usePdfs';
import { useSimplePayment } from '@/hooks/useSimplePayment';
import { formatBytes } from '@/lib/utils';
import { formatPrice } from '@/lib/stripe';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import CheckoutDialog from '@/components/checkout/CheckoutDialog';

interface PDFCardProps {
  pdf: PDF;
  onDownload: (pdfId: string) => void;
}


export const PDFCard = ({ pdf, onDownload }: PDFCardProps) => {
  const [isPurchased, setIsPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const { loading, checkPurchaseStatus } = useSimplePayment();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if user has already purchased this PDF
  useEffect(() => {
    const checkPurchase = async () => {
      if (pdf.is_premium) {
        setCheckingPurchase(true);
        
        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.warn('Purchase check timed out for PDF:', pdf.id, '- This may indicate database/network issues');
          setCheckingPurchase(false);
          setIsPurchased(false);
        }, 10000); // Increased to 10 second timeout
        
        try {
          const purchase = await checkPurchaseStatus(pdf.id);
          clearTimeout(timeoutId);
          setIsPurchased(!!purchase);
        } catch (error) {
          console.error('Error checking purchase status:', error);
          clearTimeout(timeoutId);
          // Don't leave button disabled on error
          setIsPurchased(false);
        } finally {
          setCheckingPurchase(false);
        }
      }
    };

    checkPurchase();
  }, [pdf.id, pdf.is_premium, checkPurchaseStatus]);

  const handleDownload = () => {
    onDownload(pdf.id);
    // Open the PDF in a new tab
    window.open(pdf.file_url, '_blank');
  };

  const handlePurchase = async () => {
    console.log('Handle purchase clicked for PDF:', pdf.id, pdf.title);
    
    if (!user) {
      console.log('No user, redirecting to auth');
      navigate('/auth');
      return;
    }
    
    // Double-check purchase status before proceeding
    try {
      const existingPurchase = await checkPurchaseStatus(pdf.id);
      if (existingPurchase) {
        console.log('User already purchased this PDF');
        setIsPurchased(true);
        toast({
          title: 'Bereits gekauft',
          description: 'Sie haben diesen Report bereits erworben.',
          variant: 'destructive',
        });
        return;
      }
    } catch (error) {
      console.warn('Could not verify purchase status before payment:', error);
    }
    
    // Open checkout dialog
    console.log('Opening checkout dialog');
    setShowCheckout(true);
  };

  const handlePaymentSuccess = async () => {
    // Refresh purchase status
    setIsPurchased(true);
    toast({
      title: 'Payment Successful!',
      description: `Successfully purchased ${pdf.title}`,
    });
    
    // Recheck purchase status to be sure
    try {
      await checkPurchaseStatus(pdf.id);
    } catch (error) {
      console.warn('Could not recheck purchase status after payment');
    }
  };

  const handleViewDetails = () => {
    navigate(`/report/${pdf.id}`);
  };

  const isPremium = pdf.is_premium && pdf.price && pdf.price > 0;
  const showPurchaseButton = isPremium && !isPurchased;
  const showDownloadButton = !isPremium || isPurchased;
  
  // Debug info
  if (isPremium && user) {
    console.log('PDF Debug:', {
      pdfId: pdf.id,
      title: pdf.title,
      isPremium,
      isPurchased,
      checkingPurchase,
      loading,
      buttonDisabled: loading || checkingPurchase,
      user: user?.email
    });
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-square overflow-hidden bg-gray-100 flex items-center justify-center relative">
        {pdf.image_url ? (
          <img
            src={pdf.image_url}
            alt={pdf.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <FileText size={64} className="text-red-500" />
        )}
        
        {/* Premium Badge */}
        {isPremium && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
              <Lock size={12} className="mr-1" />
              Premium
            </Badge>
          </div>
        )}
        
        {/* Purchased Badge */}
        {isPurchased && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-green-500 text-white">
              Gekauft
            </Badge>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-lg leading-tight flex-1">
            {pdf.title}
          </CardTitle>
          {isPremium && (
            <div className="ml-2 text-right">
              <div className="text-lg font-bold text-[#13B87B]">
                {formatPrice(pdf.price!, pdf.currency)}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
          {pdf.file_size && (
            <div className="flex items-center">
              <FileText size={14} className="mr-1" />
              <span>{formatBytes(pdf.file_size)}</span>
            </div>
          )}
          {pdf.created_at && (
            <div className="flex items-center">
              <Calendar size={14} className="mr-1" />
              <span>{new Date(pdf.created_at).toLocaleDateString('de-DE')}</span>
            </div>
          )}
        </div>

        {pdf.download_count !== null && pdf.download_count > 0 && (
          <div className="text-sm text-gray-600 mb-3">
            <span>{pdf.download_count} Downloads</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        {pdf.description && (
          <p className="text-gray-700 text-sm mb-4 line-clamp-3">
            {pdf.description}
          </p>
        )}
        
        {/* Purchase Button for Premium Content */}
        {showPurchaseButton && (
          <div className="space-y-2">
            <Button 
              onClick={handleViewDetails}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold"
              size="lg"
            >
              <Eye size={16} className="mr-2" />
              Vorschau & Details
            </Button>
            <Button 
              onClick={handlePurchase}
              disabled={loading || checkingPurchase}
              variant="outline"
              className="w-full border-[#13B87B] text-[#13B87B] hover:bg-[#13B87B] hover:text-white"
              title={loading ? 'Verarbeitung...' : checkingPurchase ? 'Überprüfung...' : 'Jetzt kaufen'}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Verarbeitung...
                </>
              ) : (
                <>
                  <CreditCard size={16} className="mr-2" />
                  Schnellkauf - {formatPrice(pdf.price!, pdf.currency)}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Download Button for Free or Purchased Content */}
        {showDownloadButton && (
          <div className="space-y-2">
            {isPremium && (
              <Button 
                onClick={handleViewDetails}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold"
                size="lg"
              >
                <Eye size={16} className="mr-2" />
                Vorschau & Details
              </Button>
            )}
            <Button 
              onClick={handleDownload}
              disabled={checkingPurchase}
              className="w-full bg-[#13B87B] hover:bg-[#0F9A6A] text-white"
            >
              {checkingPurchase ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Überprüfung...
                </>
              ) : (
                <>
                  <Download size={16} className="mr-2" />
                  {isPurchased ? 'PDF herunterladen' : 'Kostenlos herunterladen'}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Premium Preview Message */}
        {isPremium && !isPurchased && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            {!user ? 
              'Melden Sie sich an, um zu kaufen' : 
              'Sichere Zahlung über Stripe • Sofortiger Zugang nach Kauf'
            }
          </div>
        )}

      </CardContent>
      
      {/* Simple Checkout Dialog */}
      <CheckoutDialog
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        pdfId={pdf.id}
        pdfTitle={pdf.title}
        price={pdf.price || 0}
        currency={pdf.currency || 'EUR'}
        onSuccess={handlePaymentSuccess}
      />
    </Card>
  );
};