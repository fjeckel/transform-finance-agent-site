import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import SimpleCheckout from './SimpleCheckout';

interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pdfId: string;
  pdfTitle: string;
  price: number;
  currency?: string;
  onSuccess?: () => void;
}

const CheckoutDialog: React.FC<CheckoutDialogProps> = ({
  isOpen,
  onClose,
  pdfId,
  pdfTitle,
  price,
  currency = 'EUR',
  onSuccess,
}) => {
  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Purchase {pdfTitle}</DialogTitle>
        </DialogHeader>
        
        <SimpleCheckout
          pdfId={pdfId}
          pdfTitle={pdfTitle}
          price={price}
          currency={currency}
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutDialog;