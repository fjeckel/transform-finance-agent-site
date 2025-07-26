import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import CardCheckout from '@/components/checkout/CardCheckout';
import CheckoutDialog from '@/components/checkout/CheckoutDialog';

const TestCheckout = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [showInline, setShowInline] = useState(false);

  const testPdf = {
    id: 'test-pdf-123',
    title: 'Test Report 2025',
    price: 9.99,
    currency: 'EUR'
  };

  const handleSuccess = () => {
    alert('Payment successful!');
    setShowDialog(false);
    setShowInline(false);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Test Stripe Checkout
        </h1>

        <div className="space-y-6">
          {/* Test Buttons */}
          <div className="flex gap-4 justify-center">
            <Button onClick={() => setShowDialog(true)}>
              Test Dialog Checkout
            </Button>
            <Button onClick={() => setShowInline(!showInline)} variant="outline">
              {showInline ? 'Hide' : 'Show'} Inline Checkout
            </Button>
          </div>

          {/* Inline Checkout */}
          {showInline && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 text-center">
                Inline Checkout Form
              </h2>
              <CardCheckout
                pdfId={testPdf.id}
                pdfTitle={testPdf.title}
                price={testPdf.price}
                currency={testPdf.currency}
                onSuccess={handleSuccess}
                onCancel={() => setShowInline(false)}
              />
            </div>
          )}

          {/* Test Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Test Card Details:</h3>
            <ul className="text-blue-700 space-y-1">
              <li><strong>Card Number:</strong> 4242 4242 4242 4242</li>
              <li><strong>Expiry:</strong> Any future date (e.g., 12/25)</li>
              <li><strong>CVC:</strong> Any 3 digits (e.g., 123)</li>
              <li><strong>ZIP:</strong> Any 5 digits (e.g., 12345)</li>
            </ul>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li>Click "Test Dialog Checkout" or "Show Inline Checkout"</li>
              <li>Enter the test card details above</li>
              <li>Click "Pay €9.99" to process the payment</li>
              <li>Check browser console for any errors</li>
              <li>Verify webhook processing in Supabase logs</li>
            </ol>
          </div>
        </div>

        {/* Dialog Checkout */}
        <CheckoutDialog
          isOpen={showDialog}
          onClose={() => setShowDialog(false)}
          pdfId={testPdf.id}
          pdfTitle={testPdf.title}
          price={testPdf.price}
          currency={testPdf.currency}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
};

export default TestCheckout;