import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Mail, Download, ArrowLeft, RefreshCw } from 'lucide-react';

const ThankYou: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [checkingEmail, setCheckingEmail] = useState(false);
  
  const sessionId = searchParams.get('session_id');
  const pdfId = searchParams.get('pdf_id');
  const success = searchParams.get('success');
  const cancelled = searchParams.get('payment_cancelled');

  // If payment was cancelled
  if (cancelled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </div>
            <CardTitle className="text-xl">Payment Cancelled</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Your payment was cancelled. No charges were made to your account.
            </p>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link to="/episodes">
                  Back to Reports
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCheckEmail = () => {
    setCheckingEmail(true);
    // Simulate checking email
    setTimeout(() => {
      setCheckingEmail(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">
            🎉 Purchase Successful!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-lg text-gray-700 mb-2">
              Thank you for your purchase!
            </p>
            <p className="text-gray-600">
              Your PDF has been sent to your email address.
            </p>
          </div>

          {sessionId && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">📧 What's Next?</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✅ Check your email inbox (and spam folder)</li>
                <li>✅ Download your PDF from the email attachment</li>
                <li>✅ Save the PDF to your device</li>
                <li>✅ Keep the email for your records</li>
              </ul>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">📋 Order Details</h3>
            <div className="text-sm text-blue-700 space-y-1">
              {sessionId && (
                <p><strong>Order ID:</strong> {sessionId.substring(0, 20)}...</p>
              )}
              <p><strong>Delivery:</strong> Instant email delivery</p>
              <p><strong>Support:</strong> Reply to the confirmation email</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleCheckEmail}
              disabled={checkingEmail}
              className="w-full bg-[#13B87B] hover:bg-[#0F9A6A]"
            >
              {checkingEmail ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Check Your Email
                </>
              )}
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link to="/episodes">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Browse More Reports
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Didn't receive your email? Check your spam folder or contact support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThankYou;