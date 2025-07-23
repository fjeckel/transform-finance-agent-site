import React, { useState, useEffect } from 'react';
import { Download, Calendar, FileText, Lock, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PDF } from '@/hooks/usePdfs';
import { useStripePayment } from '@/hooks/useStripePayment';
import { formatBytes } from '@/lib/utils';
import { formatPrice } from '@/lib/stripe';

interface PDFCardProps {
  pdf: PDF;
  onDownload: (pdfId: string) => void;
}


export const PDFCard = ({ pdf, onDownload }: PDFCardProps) => {
  const [isPurchased, setIsPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);
  const { loading, processPayment, checkPurchaseStatus } = useStripePayment();

  // Check if user has already purchased this PDF
  useEffect(() => {
    const checkPurchase = async () => {
      if (pdf.is_premium) {
        setCheckingPurchase(true);
        const purchase = await checkPurchaseStatus(pdf.id);
        setIsPurchased(!!purchase);
        setCheckingPurchase(false);
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
    await processPayment(pdf.id);
  };

  const isPremium = pdf.is_premium && pdf.price && pdf.price > 0;
  const showPurchaseButton = isPremium && !isPurchased;
  const showDownloadButton = !isPremium || isPurchased;

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
          <Button 
            onClick={handlePurchase}
            disabled={loading || checkingPurchase}
            className="w-full bg-gradient-to-r from-[#13B87B] to-[#0F9A6A] hover:from-[#0F9A6A] hover:to-[#0D8A5A] text-white font-semibold"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verarbeitung...
              </>
            ) : (
              <>
                <CreditCard size={16} className="mr-2" />
                Jetzt kaufen - {formatPrice(pdf.price!, pdf.currency)}
              </>
            )}
          </Button>
        )}

        {/* Download Button for Free or Purchased Content */}
        {showDownloadButton && (
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
        )}

        {/* Premium Preview Message */}
        {isPremium && !isPurchased && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            Sichere Zahlung über Stripe • Sofortiger Zugang nach Kauf
          </div>
        )}
      </CardContent>
    </Card>
  );
};