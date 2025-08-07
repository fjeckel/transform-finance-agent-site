import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Mail, Download, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ThankYou: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  
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
        
        {/* Bottom Navigation - Mobile Only */}
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

  const handleResendEmail = async () => {
    if (!sessionId || !pdfId) {
      toast({
        title: 'Error',
        description: 'Missing order information. Please contact support.',
        variant: 'destructive',
      });
      return;
    }

    setResendingEmail(true);
    
    try {
      // Call resend email function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aumijfxmeclxweojrefa.supabase.co';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/resend-email`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({ 
          sessionId, 
          pdfId 
        })
      });

      if (response.ok) {
        toast({
          title: 'Email Resent',
          description: 'We\'ve sent another copy to your email address.',
          variant: 'default',
        });
      } else {
        throw new Error('Failed to resend email');
      }
    } catch (error) {
      toast({
        title: 'Resend Failed',
        description: 'Please contact support for assistance.',
        variant: 'destructive',
      });
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg md:max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">
            Purchase Successful
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-lg text-gray-700 mb-2">
              Your payment of {searchParams.get('amount') || '[Amount]'} has been processed successfully.
            </p>
            <p className="text-gray-600">
              Your PDF is being sent to your email address now.
            </p>
          </div>

          {sessionId && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">What happens next?</h3>
              <ul className="text-sm text-green-700 space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Email with PDF attachment is being sent (usually within 2 minutes)
                </li>
                <li className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-green-600" />
                  Check your inbox and spam folder
                </li>
                <li className="flex items-center">
                  <Download className="h-4 w-4 mr-2 text-green-600" />
                  Download and save the PDF to your device
                </li>
                <li className="flex items-start text-xs text-green-600 mt-2 pl-6">
                  <span className="block">
                    📱 <strong>Mobile tip:</strong> Tap and hold the attachment to save it to your Files app
                  </span>
                </li>
              </ul>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Order Details</h3>
            <div className="text-sm text-blue-700 space-y-1">
              {pdfId && (
                <p><strong>Product:</strong> {searchParams.get('pdf_title') || 'PDF Report'}</p>
              )}
              {sessionId && (
                <p><strong>Order ID:</strong> {sessionId.substring(0, 20)}...</p>
              )}
              <p><strong>Payment:</strong> Completed via Stripe</p>
              <p><strong>Delivery:</strong> Email (within 2 minutes)</p>
              <p><strong>Support:</strong> Reply to confirmation email</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleCheckEmail}
              disabled={checkingEmail}
              className="w-full bg-[#13B87B] hover:bg-[#0F9A6A] h-12 text-base"
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

            <Button 
              onClick={handleResendEmail}
              disabled={resendingEmail}
              variant="outline" 
              className="w-full h-12 text-base"
            >
              {resendingEmail ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Resending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend Email
                </>
              )}
            </Button>

            <Button asChild variant="outline" className="w-full h-12 text-base">
              <Link to="/episodes">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Browse More Reports
              </Link>
            </Button>
          </div>

          {/* Error Recovery Section */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
              <div className="text-sm">
                <h4 className="font-semibold text-amber-800 mb-1">Didn't receive your email?</h4>
                <ul className="text-amber-700 space-y-1">
                  <li>• Check your spam/junk folder</li>
                  <li>• Use the "Resend Email" button above</li>
                  <li>• Contact support with Order ID: {sessionId ? sessionId.substring(0, 20) + '...' : 'N/A'}</li>
                </ul>
                <p className="mt-2 text-xs">
                  <strong>Support Email:</strong> support@financetransformers.com
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Navigation - Mobile Only */}
    </div>
  );
};

export default ThankYou;